import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  UserLoginRequest,
  UserCreateRequest,
  SignupVerifyRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UserResponse,
} from '../types';
import { authService } from '../services/authService';

export type AuthModalMode = 'LOGIN' | 'SIGNUP' | 'OTP' | 'FORGOT' | 'RESET';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: AuthModalMode;
  pendingSignupData: { phone?: string; email?: string; name?: string } | null;
  resetContact: string | null;
  setIsAuthModalOpen: (open: boolean) => void;
  setAuthModalMode: (mode: AuthModalMode) => void;
  setPendingSignupData: (data: { phone?: string; email?: string; name?: string } | null) => void;
  setResetContact: (contact: string | null) => void;
  login: (req: UserLoginRequest) => Promise<UserResponse>;
  initiateSignup: (req: UserCreateRequest) => Promise<UserResponse>;
  verifySignup: (req: SignupVerifyRequest) => Promise<{ success: boolean; message: string; user: User }>;
  forgotPassword: (req: ForgotPasswordRequest) => Promise<{ success: boolean; message: string }>;
  resetPassword: (req: ResetPasswordRequest) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('LOGIN');
  const [pendingSignupData, setPendingSignupData] = useState<{ phone?: string; email?: string; name?: string } | null>(null);
  const [resetContact, setResetContact] = useState<string | null>(null);

  // Check current session from backend cookie
  const checkSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const me = await authService.getMe();
      if (me && me.name) {
        setUser({
          id: me.id,
          name: me.name,
          email: me.email,
          phone: me.phone,
          role: me.role,
          created_at: me.created_at,
        });
      } else {
        setUser(null);
      }
    } catch {
      // 401 or network offline -> Guest mode
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (req: UserLoginRequest): Promise<UserResponse> => {
    const res = await authService.login(req);
    setUser({
      id: res.id,
      name: res.name,
      email: res.email,
      phone: res.phone,
      role: res.role,
      created_at: res.created_at,
    });
    return res;
  };

  const initiateSignup = async (req: UserCreateRequest): Promise<UserResponse> => {
    const res = await authService.initiateSignup(req);
    setPendingSignupData({
      phone: req.contact || undefined,
      email: req.email || undefined,
      name: req.name,
    });
    return res;
  };

  const verifySignup = async (req: SignupVerifyRequest) => {
    const res = await authService.verifySignup(req);
    if (res.user) {
      setUser(res.user);
    } else {
      await checkSession();
    }
    setPendingSignupData(null);
    return res;
  };

  const forgotPassword = async (req: ForgotPasswordRequest) => {
    const res = await authService.forgotPassword(req);
    setResetContact(req.contact);
    return res;
  };

  const resetPassword = async (req: ResetPasswordRequest) => {
    const res = await authService.resetPassword(req);
    setResetContact(null);
    return res;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.warn('Logout error', e);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAuthModalOpen,
        authModalMode,
        pendingSignupData,
        resetContact,
        setIsAuthModalOpen,
        setAuthModalMode,
        setPendingSignupData,
        setResetContact,
        login,
        initiateSignup,
        verifySignup,
        forgotPassword,
        resetPassword,
        logout,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
