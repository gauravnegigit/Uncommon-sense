import React, { createContext, useContext, useState } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('gramin_health_user');
      return savedUser ? JSON.parse(savedUser) : null; // Defaults to null (Guest)
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('gramin_health_jwt_token') || null;
  });

  const [loading, setLoading] = useState(false);

  // Standard Login for Patient or Doctor
  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await authService.login(credentials);
      if (res.token && res.user) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('gramin_health_user', JSON.stringify(res.user));
        localStorage.setItem('gramin_health_jwt_token', res.token);
        return { success: true, user: res.user };
      }
      return { success: false, message: 'Invalid credentials' };
    } catch (err) {
      return { success: false, message: err.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  // Patient Registration (with verification)
  const signup = async (patientData) => {
    setLoading(true);
    try {
      const res = await authService.signup(patientData);
      if (res.token && res.user) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('gramin_health_user', JSON.stringify(res.user));
        localStorage.setItem('gramin_health_jwt_token', res.token);
        return { success: true, user: res.user };
      }
      return { success: false, message: 'Sign Up failed' };
    } catch (err) {
      return { success: false, message: err.message || 'Registration error' };
    } finally {
      setLoading(false);
    }
  };

  // Logout - Clears session and returns to unauthenticated guest mode
  const logout = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
    localStorage.removeItem('gramin_health_user');
    localStorage.removeItem('gramin_health_jwt_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        role: user?.role || null,
        loading,
        login,
        signup,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
