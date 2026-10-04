'use client';
import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user, loading, journeyStatus } = useAuth(); const path = usePathname(); const router = useRouter();
  const required = !loading && user?.role === 'STUDENT' && (!user.profile?.onboardingCompleted || journeyStatus === 'PENDING_REVIEW') && path !== '/onboarding' && path !== '/github/callback' && path !== '/portfolio';
  useEffect(() => { if (required) router.replace('/onboarding'); }, [required, router]);
  if (loading) return <div className="p-16 text-center text-sm text-slate-500" role="status">Checking your session…</div>;
  if (required) return <div className="p-16 text-center text-sm text-slate-500">Opening your starting journey…</div>;
  return <>{children}</>;
}
