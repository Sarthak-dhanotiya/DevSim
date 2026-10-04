'use client';
import {AuthGuard} from '@/components/auth/AuthGuard';
import {useAuth} from '@/lib/auth/AuthContext';
import {GitHubPortfolio} from '@/components/common/GitHubPortfolio';
export default function Page(){return <AuthGuard><Portfolio/></AuthGuard>;}
function Portfolio(){const {user}=useAuth();return <main className="max-w-4xl mx-auto p-6 space-y-5"><GitHubPortfolio/>{user&&<a className="inline-block underline text-violet-500" href={`/developers/${user.userId}`}>Open public verified portfolio</a>}</main>;}
