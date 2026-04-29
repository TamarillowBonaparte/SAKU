import { tokenManager } from '@/services/api';
import authService from '@/services/authService';
import {
  registerForPushNotifications,
  signInWithGoogle,
} from '@/services/firebaseService';
import notificationService from '@/services/notificationService';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

interface User {
  id: number;
  firebase_uid: string;
  name: string;
  email: string;
  photo_url?: string;
  is_verified: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inactivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setupPushNotification = async () => {
    try {
      const token = await registerForPushNotifications();
      if (token) {
        console.log('Push token ready:', token);
        await notificationService.registerPushToken(token);
      }
    } catch (err) {
      console.warn('Push notification setup gagal:', err);
    }
  };

  const resetInactivityTimer = () => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    inactivityTimeoutRef.current = setTimeout(async () => {
      if (isAuthenticated) {
        console.log('User inactive for 30 minutes - logging out automatically');
        await logout();
      }
    }, 30 * 60 * 1000);
  };

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const restoredSession = await authService.restoreSession();

      if (restoredSession?.user) {
        setUser(restoredSession.user);
        setIsAuthenticated(true);
        await setupPushNotification();
        resetInactivityTimer();
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err: any) {
      console.error('Auth check error:', err);
      setError(err?.message || 'Failed to check authentication');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const trackActivity = async () => {
    if (isAuthenticated) {
      await tokenManager.updateLastActivity();
      resetInactivityTimer();
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.login({ email, password });
      setUser(response.user);
      setIsAuthenticated(true);

      await setupPushNotification();
      resetInactivityTimer();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const googleToken = await signInWithGoogle();
      const response = await authService.googleLogin(googleToken);
      setUser(response.user);
      setIsAuthenticated(true);

      await setupPushNotification();
      resetInactivityTimer();
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || err?.message || 'Google login gagal';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.register({ name, email, password });
      setUser(response.user);
      setIsAuthenticated(true);

      await setupPushNotification();
      resetInactivityTimer();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);

      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Logout failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    trackActivity();
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        error,
        login,
        loginWithGoogle,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

