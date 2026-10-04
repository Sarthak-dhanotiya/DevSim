'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, journeyStatus } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const needsOnboarding = user?.role === 'STUDENT' && (!user.profile?.onboardingCompleted || journeyStatus === 'PENDING_REVIEW') && pathname !== '/onboarding';

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (!loading && needsOnboarding) router.replace('/onboarding');
  }, [user, loading, router, needsOnboarding]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-mono text-surface-400">Authenticating developer session...</p>
      </div>
    );
  }

  if (!user || needsOnboarding) {
    return null;
  }

  return <>{children}</>;
}
