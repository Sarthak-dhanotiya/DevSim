'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { ArrowRight, Terminal } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter(); const { register } = useAuth();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try { await register(name.trim(), email.trim().toLowerCase(), password); router.replace('/onboarding'); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  const input = 'mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40';
  return <main className="mx-auto flex min-h-[75vh] max-w-md items-center px-5 py-14"><div className="w-full"><Terminal className="mb-5 rounded-lg bg-slate-900 p-2 text-white" size={40} /><h1 className="text-3xl font-bold">Start your engineering journey.</h1><p className="mt-3 text-sm leading-6 text-slate-500">Create your account, confirm your skills and find a project that fits your next step.</p><form onSubmit={submit} className="mt-7 space-y-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">{error && <p role="alert" className="rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-600">{error}</p>}<label className="block text-sm font-medium">Full name<input autoComplete="name" className={input} required minLength={2} maxLength={150} value={name} onChange={e => setName(e.target.value)} /></label><label className="block text-sm font-medium">Email<input autoComplete="email" type="email" className={input} required value={email} onChange={e => setEmail(e.target.value)} /></label><label className="block text-sm font-medium">Password<input autoComplete="new-password" type="password" className={input} required minLength={8} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} /><span className="mt-2 block text-xs font-normal text-slate-500">Use 8-72 characters. You'll use this password to log in.</span></label><button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Creating account…' : 'Create account'}<ArrowRight size={16} /></button></form><p className="mt-5 text-center text-sm text-slate-500">Already registered? <Link href="/login" className="font-semibold text-indigo-600">Sign in</Link></p></div></main>;
}
