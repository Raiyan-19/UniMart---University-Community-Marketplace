import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, LoginCredentials, RegisterPayload } from '../types';
import { authApi, setStoredToken, getStoredToken, clearStoredAuth } from '../services/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  requiresEmailVerification: boolean;
  unverifiedUser: User | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; emailSent?: boolean; emailDeliveryError?: string; otpPreview?: string }>;
  verifyEmail: (code: string, emailOverride?: string) => Promise<boolean>;
  resendVerificationCode: () => Promise<string | undefined>;
  logout: () => Promise<void>;
  updateUser: (updated: User) => void;
  switchDemoRole: (role: 'student' | 'teacher' | 'admin') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [requiresEmailVerification, setRequiresEmailVerification] = useState<boolean>(false);
  const [unverifiedUser, setUnverifiedUser] = useState<User | null>(null);
  const { success, error, info } = useToast();

  const loadCurrentUser = useCallback(async () => {
    const existingToken = getStoredToken();
    if (!existingToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await authApi.getMe();
      const currentUser = res.user || res.data?.user;
      if (res.success && currentUser) {
        setUser(currentUser);
        setToken(existingToken);
        if (!currentUser.isEmailVerified) {
          setRequiresEmailVerification(true);
          setUnverifiedUser(currentUser);
        } else {
          setRequiresEmailVerification(false);
          setUnverifiedUser(null);
        }
      } else {
        clearStoredAuth();
        setUser(null);
        setToken(null);
      }
    } catch {
      clearStoredAuth();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchDemoRoleInternal = async (targetRole: 'student' | 'teacher' | 'admin') => {
    try {
      let email = 'raiyan19@student.baust.edu.bd';
      let password = 'password123';
      if (targetRole === 'teacher') {
        email = 'aminul@baust.edu.bd';
        password = 'password123';
      } else if (targetRole === 'admin') {
        email = 'admin@unimart.edu.bd';
        password = 'admin123';
      }

      const res = await authApi.login({ email, password });
      if (res.success && res.user && res.token) {
        setUser(res.user);
        setToken(res.token);
        setStoredToken(res.token, res.user.id);
        setRequiresEmailVerification(false);
        setUnverifiedUser(null);
      }
    } catch (e) {
      console.error('Demo switch error:', e);
    }
  };

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  // Listen for unauthorized events to safely reset auth state
  useEffect(() => {
    const handleUnauthorized = () => {
      clearStoredAuth();
      setUser(null);
      setToken(null);
      setRequiresEmailVerification(false);
      setUnverifiedUser(null);
    };

    window.addEventListener('unimart:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unimart:unauthorized', handleUnauthorized);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await authApi.login(credentials);
      if (res.success && res.user && res.token) {
        setUser(res.user);
        setToken(res.token);
        setStoredToken(res.token, res.user.id);

        if (res.requiresEmailVerification) {
          setRequiresEmailVerification(true);
          setUnverifiedUser(res.user);
          info('Verification Required', 'Please enter the 6-digit code sent to your university email.');
        } else {
          setRequiresEmailVerification(false);
          setUnverifiedUser(null);
          success('Welcome Back!', `Logged in as ${res.user.name} (${res.user.role.toUpperCase()})`);
        }
        return true;
      }
      return false;
    } catch (err: any) {
      error('Login Failed', err.message || 'Invalid email or password.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload): Promise<{ success: boolean; emailSent?: boolean; emailDeliveryError?: string; otpPreview?: string }> => {
    try {
      setIsLoading(true);
      const res = await authApi.register(payload);
      if (res.success && res.user && res.token) {
        setUser(res.user);
        setUnverifiedUser(res.user);
        setToken(res.token);
        setStoredToken(res.token, res.user.id);
        setRequiresEmailVerification(true);

        if (res.emailSent === false) {
          info('Email Delivery Notice', res.emailDeliveryError || 'Could not deliver the verification email to your inbox.');
        } else {
          success('Account Created', `A 6-digit verification code was sent to ${res.user.email}. Please check your inbox.`);
        }

        return {
          success: true,
          emailSent: res.emailSent,
          emailDeliveryError: res.emailDeliveryError,
          otpPreview: res.otpPreview,
        };
      }
      return { success: false };
    } catch (err: any) {
      error('Registration Failed', err.message || 'Could not complete registration.');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (code: string, emailOverride?: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const targetUserId = user?.id || unverifiedUser?.id;
      const targetEmail = emailOverride || user?.email || unverifiedUser?.email;
      const res = await authApi.verifyEmail(code, targetUserId, targetEmail);
      const verifiedUser = res.user || res.data?.user;
      if (res.success && verifiedUser) {
        setUser(verifiedUser);
        setRequiresEmailVerification(false);
        setUnverifiedUser(null);
        if (res.token) {
          setToken(res.token);
          setStoredToken(res.token, verifiedUser.id);
        }
        success('Email Verified!', 'Your account is verified. Welcome to UniMart!');
        return true;
      }
      return false;
    } catch (err: any) {
      error('Verification Failed', err.message || 'Invalid code.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationCode = async (): Promise<string | undefined> => {
    try {
      const email = user?.email || unverifiedUser?.email;
      const targetUserId = user?.id || unverifiedUser?.id;
      const res = await authApi.resendCode(email, targetUserId);
      const preview = res.otpPreview || res.data?.otpPreview;
      if (res.success) {
        success('Code Sent', `A fresh 6-digit verification code has been dispatched to ${email || 'your email'}.`);
        return preview;
      }
    } catch (err: any) {
      error('Failed to Resend', err.message || 'Could not resend verification code.');
      throw err;
    }
    return undefined;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore API network errors during logout
    } finally {
      clearStoredAuth();
      setUser(null);
      setToken(null);
      setRequiresEmailVerification(false);
      setUnverifiedUser(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('unimart:logout'));
      }
      success('Logged Out', 'You have been safely signed out.');
    }
  };

  const updateUser = (updated: User) => {
    setUser(updated);
  };

  const switchDemoRole = async (targetRole: 'student' | 'teacher' | 'admin') => {
    setIsLoading(true);
    await switchDemoRoleInternal(targetRole);
    setIsLoading(false);
    success('Role Switched', `Switched active profile to ${targetRole.toUpperCase()}`);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        requiresEmailVerification,
        unverifiedUser,
        login,
        register,
        verifyEmail,
        resendVerificationCode,
        logout,
        updateUser,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
