import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types/index.ts';
import { api, getStoredToken, setStoredToken, removeStoredToken, getUserFromToken } from '../lib/api.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (identifier: string, pass: string) => Promise<void>;
  register: (name: string, phone: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setSession: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialToken = getStoredToken();
  const [user, setUser] = useState<User | null>(getUserFromToken(initialToken));
  const [token, setToken] = useState<string | null>(initialToken);
  const [isLoading, setIsLoading] = useState<boolean>(!initialToken);

  const refreshUser = async () => {
    const curToken = getStoredToken();
    if (!curToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setToken(getStoredToken());
      setUser(res.user);
    } catch {
      removeStoredToken();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    const handleUnauthorized = () => {
      removeStoredToken();
      setToken(null);
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (identifier: string, pass: string) => {
    const res = await api.login({ identifier, password: pass });
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (name: string, phone: string, email: string, pass: string) => {
    const res = await api.register({ name, phone, email, password: pass });
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    removeStoredToken();
    setToken(null);
    setUser(null);
  };

  const setSession = (newToken: string, newUser: User) => {
    setStoredToken(newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const isAdmin = Boolean(
    user && ['super_admin', 'admin', 'order_manager', 'product_manager', 'support_agent'].includes(user.role)
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin,
        login,
        register,
        logout,
        refreshUser,
        setSession
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
