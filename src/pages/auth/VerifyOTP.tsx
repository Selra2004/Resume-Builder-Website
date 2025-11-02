import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export const VerifyOTP: React.FC = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { verifyOTP, resendOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const email = (location.state as any)?.email;
  const purpose = (location.state as any)?.purpose || 'registration';
  const resetToken = (location.state as any)?.resetToken;
  const role = (location.state as any)?.role;


  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  // Timer for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pasteData)) {
      const newOtp = [...otp];
      for (let i = 0; i < pasteData.length && i < 6; i++) {
        newOtp[i] = pasteData[i];
      }
      setOtp(newOtp);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      if (purpose === 'password_reset' && resetToken) {
        // Show password reset form
        navigate('/reset-password', { 
          state: { 
            email, 
            otp: otpCode, 
            resetToken 
          } 
        });
      } else {
        const result = await verifyOTP(email, otpCode, purpose);
        
        if (result.success) {
          toast.success(result.message || 'Email verified successfully!');
          
          // Handle role-specific responses
          if ((result as any).requiresProfileCompletion && (result as any).nextStep === 'complete-profile') {
            if (role === 'admin') {
              navigate('/admin/complete-profile');
            } else if (role === 'coordinator') {
              navigate('/coordinator/complete-profile');
            } else if (role === 'company') {
              navigate('/company/complete-profile');
            } else {
              navigate('/complete-profile');
            }
          } else if (role === 'admin') {
            navigate('/admin/pending-approval');
          } else if (role === 'coordinator') {
            navigate('/coordinator/pending-approval');
          } else if (role === 'company') {
            navigate('/company/dashboard');
          } else {
            navigate('/complete-profile');
          }
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      const result = await resendOTP(email, purpose);
      if (result.success) {
        toast.success('New verification code sent!');
        setCanResend(false);
        setResendTimer(60);
        setOtp(['', '', '', '', '', '']);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (purpose) {
      case 'password_reset':
        return 'Enter Reset Code';
      case 'login':
        return 'Login Verification';
      default:
        return 'Verify Your Email';
    }
  };

  const getDescription = () => {
    switch (purpose) {
      case 'password_reset':
        return `We sent a 6-digit reset code to ${email}. Enter it below to reset your password.`;
      case 'login':
        return `For security, we sent a verification code to ${email}.`;
      default:
        return `We sent a 6-digit verification code to ${email}. Enter it below to complete your registration.`;
    }
  };

  if (!email) {
    return null; // Redirect happens in useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">ACC</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {getTitle()}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {getDescription()}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 text-center mb-4">
              Enter 6-digit verification code
            </label>
            <div className="flex justify-center space-x-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              ))}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || otp.join('').length !== 6}
              className="w-full btn-primary py-3 text-base disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verifying...
                </div>
              ) : purpose === 'password_reset' ? (
                'Continue to Reset'
              ) : (
                'Verify Email'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Didn't receive the code?{' '}
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Resend Code
                </button>
              ) : (
                <span className="text-gray-400">
                  Resend in {resendTimer}s
                </span>
              )}
            </p>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate(purpose === 'password_reset' ? '/login' : '/register')}
              className="text-sm font-medium text-gray-600 hover:text-primary-600"
            >
              ← Back to {purpose === 'password_reset' ? 'Login' : 'Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
