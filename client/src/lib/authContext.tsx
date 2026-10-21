'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from './types';
import { api } from './api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('interviewai_token') : null;
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { user } = await api.getMe();
        setUser(user);
      } catch (err) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('interviewai_token');
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const { token, user } = await api.login(email, password);
    if (typeof window !== 'undefined') {
      localStorage.setItem('interviewai_token', token);
    }
    setUser(user);
  };

  const register = async (name: string, email: string, password: string) => {
    const { token, user } = await api.register(name, email, password);
    if (typeof window !== 'undefined') {
      localStorage.setItem('interviewai_token', token);
    }
    setUser(user);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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
