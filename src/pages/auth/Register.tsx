import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL_FOR_ASSETS } from '../../services/api';
import { toast } from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon, InformationCircleIcon, HomeIcon } from '@heroicons/react/24/outline';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    invitationToken: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email: string, role: string) => {
    if (role === 'user') {
      const asiatechPattern = /^1-\d{6}@asiatech\.edu\.ph$/;
      return asiatechPattern.test(email);
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return 'Password must be at least 8 characters long';
    }
    if (!hasUpperCase) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!hasLowerCase) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!hasNumbers) {
      return 'Password must contain at least one number';
    }
    if (!hasSpecialChar) {
      return 'Password must contain at least one special character';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!validateEmail(formData.email, formData.role)) {
      if (formData.role === 'user') {
        toast.error('Please use your Asiatech email format: 1-xxxxxx@asiatech.edu.ph');
      } else {
        toast.error('Please enter a valid email address');
      }
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.role === 'company' && !formData.invitationToken) {
      toast.error('Invitation code is required for company registration');
      return;
    }

    setIsLoading(true);

    try {
      const additionalData = formData.role === 'company' && formData.invitationToken 
        ? { invitationToken: formData.invitationToken }
        : undefined;
        
      const result = await register(formData.email, formData.password, formData.role, additionalData);
      
      if (result.success) {
        toast.success(result.message);
        navigate('/verify-otp', { 
          state: { 
            email: formData.email, 
            purpose: 'registration',
            role: formData.role,
            invitationToken: formData.invitationToken 
          } 
        });
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    {
      value: 'user',
      label: 'Student/Alumni',
      description: 'OJT college students and alumni looking for opportunities',
    },
    {
      value: 'coordinator',
      label: 'Coordinator',
      description: 'Bridge between companies and the platform',
    },
    {
      value: 'company',
      label: 'Company/Business Owner',
      description: 'Post jobs and find talented candidates',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Back to Home Link */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
          >
            <HomeIcon className="h-4 w-4 mr-1" />
            ← Back to Home
          </Link>
        </div>

        <div>
          <div className="mx-auto h-20 w-20 flex items-center justify-center">
            <img 
              src={`${API_BASE_URL_FOR_ASSETS}/uploads/logo/Logo.png`}
              onError={(e) => {
                // Fallback to placeholder if backend not available  
                (e.target as HTMLImageElement).style.display = 'none';
              }} 
              alt="ACC Logo" 
              className="h-20 w-20 object-contain"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign in
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              I am registering as:
            </label>
            <div className="space-y-3">
              {roleOptions.map((option) => (
                <div
                  key={option.value}
                  className={`relative rounded-lg border p-4 cursor-pointer transition-colors ${
                    formData.role === option.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => setFormData({ ...formData, role: option.value })}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="role"
                      value={option.value}
                      checked={formData.role === option.value}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <div className="ml-3">
                      <label className="block text-sm font-medium text-gray-900">
                        {option.label}
                      </label>
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-field mt-1"
              placeholder={
                formData.role === 'user'
                  ? '1-123456@asiatech.edu.ph'
                  : 'Enter your email'
              }
            />
            {formData.role === 'user' && (
              <div className="mt-1 flex items-center text-sm text-blue-600">
                <InformationCircleIcon className="h-4 w-4 mr-1" />
                <span>Use your Asiatech email format: 1-xxxxxx@asiatech.edu.ph</span>
              </div>
            )}
          </div>

          {/* Company Invitation Code */}
          {formData.role === 'company' && (
            <div>
              <label htmlFor="invitationToken" className="block text-sm font-medium text-gray-700">
                Invitation Code
              </label>
              <input
                id="invitationToken"
                name="invitationToken"
                type="text"
                required={formData.role === 'company'}
                value={formData.invitationToken}
                onChange={(e) => setFormData({ ...formData, invitationToken: e.target.value })}
                className="input-field mt-1"
                placeholder="Enter invitation code from coordinator"
              />
              <p className="mt-1 text-sm text-gray-500">
                You need an invitation from a coordinator to register as a company.
              </p>
            </div>
          )}

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="mt-1 relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field pr-10"
                placeholder="Create a strong password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <p>Password must contain:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>At least 8 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
                <li>One special character (!@#$%^&*)</li>
              </ul>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <div className="mt-1 relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="input-field pr-10"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="text-sm text-gray-600">
            By creating an account, you agree to our{' '}
            <Link to="/terms-of-service" className="text-primary-600 hover:text-primary-500 underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy-policy" className="text-primary-600 hover:text-primary-500 underline">
              Privacy Policy
            </Link>
            .
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 text-base"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Create account'
              )}
            </button>
          </div>
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Are you an administrator?{' '}
              <Link to="/admin/register" className="font-medium text-primary-600 hover:text-primary-500">
                Register as Admin
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
