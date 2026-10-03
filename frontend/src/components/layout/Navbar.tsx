'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTheme } from '@/lib/theme/ThemeContext';
import { DeveloperProfileModal } from '@/components/common/DeveloperProfileModal';
import { Button } from '../ui/Button';
import {
  Terminal,
  LogOut,
  LayoutDashboard,
  User,
  Briefcase,
  Building2,
  Layers,
  Sun,
  Moon,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navLinks = [
    { href: '/career-tracks', label: 'Career Tracks', icon: Layers },
    { href: '/companies', label: 'Companies', icon: Building2 },
    { href: '/projects', label: 'Projects', icon: Briefcase },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between min-h-14 py-2 gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center font-bold">
              <Terminal className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-white">
              DevSim
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {user && (
              <Link
                href="/workspace"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  pathname.startsWith('/workspace')
                    ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                Workspace
              </Link>
            )}
            {user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
              <Link
                href="/super-admin"
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  pathname.startsWith('/super-admin')
                    ? 'text-indigo-400 bg-indigo-950/60 border border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                    : 'text-indigo-400/90 hover:text-indigo-200 hover:bg-indigo-950/40 border border-indigo-500/20'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Super Admin</span>
              </Link>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Developer Portfolio Button */}
            <button
              onClick={() => setIsDevModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600 transition-colors text-xs"
              title="Developed by Sarthak Dhanotiya (Associate Software Developer)"
            >
              <div className="w-5 h-5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-[10px] flex items-center justify-center shrink-0">
                SD
              </div>
              <div className="text-left hidden sm:block">
                <span className="font-semibold text-slate-900 dark:text-white block text-[11px] leading-tight">
                  Sarthak Dhanotiya
                </span>
                <span className="text-[10px] text-slate-500 block leading-tight">
                  Associate Developer
                </span>
              </div>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-1.5">
                <Link href="/dashboard">
                  <Button
                    variant={pathname === '/dashboard' ? 'primary' : 'secondary'}
                    size="sm"
                    className="text-xs"
                  >
                    Dashboard
                  </Button>
                </Link>

                <Link href="/profile" className="hidden sm:block">
                  <Button
                    variant={pathname === '/profile' ? 'primary' : 'outline'}
                    size="sm"
                    className="text-xs"
                  >
                    Profile
                  </Button>
                </Link>

                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1.5 rounded-md text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm" className="text-xs">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
        <nav aria-label="Mobile navigation" className="md:hidden flex items-center gap-1 overflow-x-auto pb-2">
          {navLinks.map(link => <Link key={link.href} href={link.href} className={`shrink-0 rounded-lg px-3 py-2 text-xs transition-colors ${pathname.startsWith(link.href) ? 'bg-violet-500/10 text-violet-600 dark:text-violet-300' : 'text-slate-500 hover:bg-violet-500/10'}`}>{link.label}</Link>)}
          {user && <><Link href="/workspace" className="shrink-0 rounded-lg px-3 py-2 text-xs text-violet-500">Workspace</Link><Link href="/profile" className="shrink-0 rounded-lg px-3 py-2 text-xs text-slate-500">Profile</Link></>}
          {user && user.role === 'SUPER_ADMIN' && <Link href="/super-admin" className="shrink-0 rounded-lg px-3 py-2 text-xs text-violet-500">Admin</Link>}
        </nav>
      </div>

      <DeveloperProfileModal
        isOpen={isDevModalOpen}
        onClose={() => setIsDevModalOpen(false)}
      />
    </header>
  );
}
