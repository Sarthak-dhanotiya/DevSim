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
  journeyStatus: string | null;
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
  const [journeyStatus, setJourneyStatus] = useState<string | null>(null);

  const initAuth = async () => {
    try {
      const savedToken = localStorage.getItem('vc_token');
      if (savedToken) {
        setToken(savedToken);
        const res = await api.getCurrentUser();
        if (res.data) {
          if (res.data.role === 'STUDENT') {
            const journey = await api.getJourney();
            setJourneyStatus(journey.data.journey.status);
          }
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
      if (res.data.role === 'STUDENT') {
        const journey = await api.getJourney();
        setJourneyStatus(journey.data.journey.status);
      } else setJourneyStatus(null);
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
      setJourneyStatus('DRAFT');
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
    setJourneyStatus(null);
    localStorage.removeItem('vc_token');
    setUser(null);
    setToken(null);
  };

  const refreshProfile = async () => {
    try {
      const [res, journey] = await Promise.all([api.getProfile(), user?.role === 'STUDENT' ? api.getJourney() : Promise.resolve(null)]);
      if (journey) setJourneyStatus(journey.data.journey.status);
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
        journeyStatus,
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
