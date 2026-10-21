'use client';
import {AuthGuard} from '@/components/auth/AuthGuard';
import {useAuth} from '@/lib/auth/AuthContext';
import {GitHubPortfolio} from '@/components/common/GitHubPortfolio';
export default function Page(){return <AuthGuard><Portfolio/></AuthGuard>;}
function Portfolio(){const {user}=useAuth();return <main className="max-w-4xl mx-auto p-6 space-y-5"><GitHubPortfolio/>{user&&<a className="inline-block rounded-xl border border-violet-200 px-4 py-2 text-sm font-medium text-violet-600 dark:border-violet-800 dark:text-violet-400" href={`/developers/${user.userId}`}>Preview public portfolio &rarr;</a>}<p className="text-xs text-slate-500">Your public page includes only reviewed and merged work. Copy its URL to share it with a mentor or recruiter.</p></main>;}
