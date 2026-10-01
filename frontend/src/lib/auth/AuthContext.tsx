'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import { StudentProfile } from '../types';

interface UserSession {
  userId: string;
  email: string;
  role: string;
  profile: StudentProfile | null;
}

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const initAuth = async () => {
    try {
      const savedToken = localStorage.getItem('vc_token');
      if (savedToken) {
        setToken(savedToken);
        const res = await api.getCurrentUser();
        if (res.data) {
          setUser({
            userId: res.data.userId,
            email: res.data.email,
            role: res.data.role,
            profile: res.data.profile,
          });
        }
      }
    } catch (err) {
      console.error('Session restored failed:', err);
      localStorage.removeItem('vc_token');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    if (res.data && res.data.token) {
      localStorage.setItem('vc_token', res.data.token);
      setToken(res.data.token);
      setUser({
        userId: res.data.userId,
        email: res.data.email,
        role: res.data.role,
        profile: res.data.profile,
      });
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.register({ name, email, password });
    if (res.data && res.data.token) {
      localStorage.setItem('vc_token', res.data.token);
      setToken(res.data.token);
      setUser({
        userId: res.data.userId,
        email: res.data.email,
        role: res.data.role,
        profile: res.data.profile,
      });
    }
  };

  const logout = () => {
    localStorage.removeItem('vc_token');
    setUser(null);
    setToken(null);
  };

  const refreshProfile = async () => {
    try {
      const res = await api.getProfile();
      if (res.data && user) {
        setUser({
          ...user,
          profile: res.data,
        });
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
