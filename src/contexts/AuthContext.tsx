import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../services/api';

export interface User {
  id: number;
  email: string;
  role: 'user' | 'coordinator' | 'company' | 'admin';
  isVerified: boolean;
  isApproved?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; needsVerification?: boolean }>;
  register: (email: string, password: string, role: string, additionalData?: any) => Promise<{ success: boolean; message: string; userId?: number }>;
  verifyOTP: (email: string, otp: string, purpose?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  resendOTP: (email: string, purpose?: string) => Promise<{ success: boolean; message: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string; resetToken?: string }>;
  resetPassword: (email: string, otp: string, resetToken: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = localStorage.getItem('acc_token');
      const storedUser = localStorage.getItem('acc_user');

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          authAPI.setAuthToken(storedToken);
        } catch (error) {
          localStorage.removeItem('acc_token');
          localStorage.removeItem('acc_user');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      
      if (response.data.token && response.data.user) {
        const { token: authToken, user: userData } = response.data;
        
        setToken(authToken);
        setUser(userData);
        
        localStorage.setItem('acc_token', authToken);
        localStorage.setItem('acc_user', JSON.stringify(userData));
        authAPI.setAuthToken(authToken);
        
        return { success: true, message: 'Login successful' };
      }
      
      return { success: false, message: response.data.message || 'Login failed' };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      
      if (message.includes('verify your email')) {
        return { success: false, message, needsVerification: true };
      }
      
      return { success: false, message };
    }
  };

  const register = async (email: string, password: string, role: string, additionalData?: any) => {
    try {
      const endpoint = role === 'user' ? '/auth/register/user' : 
                     role === 'coordinator' ? '/auth/register/coordinator' : 
                     role === 'company' ? '/auth/register/company' :
                     role === 'admin' ? '/auth/register/admin' : '/auth/register/user';
      
      const payload = (role === 'admin' || role === 'company') 
        ? { email, password, ...additionalData }
        : { email, password };
      
      const response = await authAPI.register(endpoint, payload);
      
      return { 
        success: true, 
        message: response.data.message,
        userId: response.data.userId || response.data.adminId
      };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const verifyOTP = async (email: string, otp: string, purpose = 'registration') => {
    try {
      const response = await authAPI.verifyOTP(email, otp, purpose);
      
      if (response.data.token && response.data.user) {
        const { token: authToken, user: userData } = response.data;
        
        
        setToken(authToken);
        setUser(userData);
        
        localStorage.setItem('acc_token', authToken);
        localStorage.setItem('acc_user', JSON.stringify(userData));
        authAPI.setAuthToken(authToken);
      }
      
      return { 
        success: true, 
        message: response.data.message,
        requiresProfileCompletion: response.data.requiresProfileCompletion,
        nextStep: response.data.nextStep
      };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'OTP verification failed' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('acc_token');
    localStorage.removeItem('acc_user');
    authAPI.setAuthToken(null);
  };

  const resendOTP = async (email: string, purpose = 'registration') => {
    try {
      const response = await authAPI.resendOTP(email, purpose);
      return { success: true, message: response.data.message };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to send OTP' 
      };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const response = await authAPI.forgotPassword(email);
      return { 
        success: true, 
        message: response.data.message,
        resetToken: response.data.resetToken 
      };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to send reset code' 
      };
    }
  };

  const resetPassword = async (email: string, otp: string, resetToken: string, newPassword: string) => {
    try {
      const response = await authAPI.resetPassword(email, otp, resetToken, newPassword);
      return { success: true, message: response.data.message };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Password reset failed' 
      };
    }
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    verifyOTP,
    logout,
    resendOTP,
    forgotPassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
