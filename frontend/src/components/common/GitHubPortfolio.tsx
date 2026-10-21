'use client';

import Link from 'next/link';
import {useEffect, useState} from 'react';
import {ArrowUpRight, Check, Copy, GitCommitHorizontal, GitPullRequest, ShieldCheck} from 'lucide-react';
import {githubRequest} from '@/lib/github';

type Evidence = {repository: string; pull_request: string; head_sha: string; merged: boolean; approved: boolean; verified: boolean; ticket_key: string; title: string; commits_json?: string};
type Commit = {sha: string; url: string; message: string; author: string};

function Commits({json}: {json?: string}) {
  let commits: Commit[] = [];
  try { const parsed = JSON.parse(json || '[]'); if (Array.isArray(parsed)) commits = parsed; } catch { return null; }
  return commits.length ? <details className="mt-4 border-t border-slate-100 pt-3 text-xs dark:border-slate-800"><summary className="cursor-pointer font-medium text-slate-500">{commits.length} linked commits</summary><ul className="mt-3 space-y-3">{commits.map(c => <li key={c.sha} className="flex items-start gap-2"><GitCommitHorizontal size={14} className="mt-0.5 shrink-0 text-slate-400"/><div><a href={c.url} target="_blank" rel="noopener noreferrer" className="break-words text-violet-600 hover:underline dark:text-violet-400">{c.message}</a><p className="mt-1 text-slate-500">{c.sha.slice(0, 7)} / {c.author}</p></div></li>)}</ul></details> : null;
}

export function GitHubPortfolio({studentId}: {studentId?: string}) {
  const [items, setItems] = useState<Evidence[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setItems([]);
    githubRequest<Evidence[]>(studentId ? `/portfolio/${studentId}` : '/portfolio')
      .then(result => { if (active) setItems(result); })
      .catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [studentId, reload]);
  const completed = items.filter(i => i.verified);
  const visible = filter === 'completed' ? completed : items;
  async function share() {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setCopyError(''); }
    catch { setCopyError('Copy the page address from your browser to share this portfolio.'); }
  }
  return <section className="space-y-6 text-slate-900 dark:text-slate-100">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400"><ShieldCheck size={16}/>Proof of your progress</p><h1 className="text-3xl font-bold tracking-tight">{studentId ? 'Work portfolio' : 'My work portfolio'}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">Real tickets, code changes and pull requests. Every completed item links to the work behind it.</p></div>{studentId && <button type="button" onClick={() => void share()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium dark:border-slate-700">{copied ? <Check size={15}/> : <Copy size={15}/ >}{copied ? 'Link copied' : 'Copy portfolio link'}</button>}</div>
    {copyError && <p role="status" className="text-sm text-amber-600">{copyError}</p>}
    {copied && <span role="status" className="sr-only">Portfolio link copied</span>}
    {error && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error} <button type="button" onClick={() => setReload(n => n + 1)} className="ml-2 font-semibold underline">Retry</button></div>}
    {loading ? <p role="status" className="py-8 text-sm text-slate-500">Loading your work...</p> : !error && <>
      <div className="grid grid-cols-2 gap-3"><div className="surface-card p-4"><p className="text-2xl font-semibold">{completed.length}</p><p className="mt-1 text-xs text-slate-500">Reviewed & merged</p></div><div className="surface-card p-4"><p className="text-2xl font-semibold">{new Set(items.map(i => i.repository)).size}</p><p className="mt-1 text-xs text-slate-500">{studentId ? 'Projects with completed work' : 'Projects with linked work'}</p></div></div>
      <div className="rounded-xl bg-slate-100 p-4 text-xs leading-6 text-slate-600 dark:bg-slate-900 dark:text-slate-400"><strong className="text-slate-800 dark:text-slate-200">What does reviewed & merged mean?</strong> The linked PR was authored by the connected GitHub account, approved by DevSim AI and merged. This records contribution evidence; it is not an independent certification of code quality.</div>
      {!studentId && items.length > 0 && <div className="flex gap-2" aria-label="Filter work">{[{id: 'all', label: `All work (${items.length})`}, {id: 'completed', label: `Reviewed & merged (${completed.length})`}].map(tab => <button type="button" key={tab.id} aria-pressed={filter === tab.id} onClick={() => setFilter(tab.id)} className={`rounded-full px-4 py-2 text-xs font-medium ${filter === tab.id ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{tab.label}</button>)}</div>}
      {!visible.length && <div className="surface-card px-5 py-12 text-center"><GitPullRequest size={30} className="mx-auto mb-4 text-slate-400"/><h2 className="font-semibold">{studentId ? 'No completed work to share yet' : filter === 'completed' ? 'Your completed work will appear here' : 'Your portfolio starts with your first PR'}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{studentId ? 'Reviewed and merged contributions will appear here when available.' : 'Complete a ticket, open a pull request and get it reviewed and merged to add contribution evidence.'}</p>{!studentId && <Link href="/workspace" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">Go to workspace <ArrowUpRight size={15}/></Link>}</div>}
      {visible.map(item => <article key={item.pull_request} className="surface-card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="mb-1 text-xs font-medium text-slate-500">{item.ticket_key}</p><h2 className="font-semibold">{item.title}</h2></div><span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${item.verified ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{item.verified ? 'Reviewed & merged' : item.merged ? 'Merged / not approved' : item.approved ? 'Approved / awaiting merge' : 'Not yet reviewed & merged'}</span></div><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-violet-600 dark:text-violet-400">{[{label: 'Repository', url: item.repository}, {label: 'Pull request', url: item.pull_request}, ...(item.head_sha ? [{label: 'Commit evidence', url: `${item.repository}/commit/${item.head_sha}`}] : [])].map(link => <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">{link.label}<ArrowUpRight size={13}/></a>)}</div><Commits json={item.commits_json}/></article>)}
    </>}
  </section>;
}
