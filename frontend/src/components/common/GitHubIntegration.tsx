'use client';

import Link from 'next/link';
import {useCallback, useEffect, useRef, useState} from 'react';
import {ArrowUpRight, Check, CheckCircle2, ChevronDown, Copy, GitBranch, Github, GitPullRequest, MoreHorizontal, RefreshCw, Terminal} from 'lucide-react';
import {githubRequest, GitHubAccount, GitHubPR, GitHubWorkspace, pullRequestStatus} from '@/lib/github';
import type {ProjectTicket} from '@/lib/types';

const secondary = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800';
const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50';

export function GitHubIntegration({enrollmentId, onSync, onRepositoryChange, tickets = [], projectName, suggestedTicketKey}: {
  enrollmentId?: string; onSync?: () => void; onRepositoryChange?: (ready: boolean) => void;
  tickets?: ProjectTicket[]; projectName?: string; suggestedTicketKey?: string;
}) {
  const [account, setAccount] = useState<GitHubAccount>();
  const [workspace, setWorkspace] = useState<GitHubWorkspace>();
  const [busy, setBusy] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [setupOpen, setSetupOpen] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>();
  const syncCallback = useRef(onSync);
  const repositoryCallback = useRef(onRepositoryChange);
  syncCallback.current = onSync;
  repositoryCallback.current = onRepositoryChange;
  const previousPRs = useRef<string>();
  const generation = useRef(0);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(async (version: number) => {
    try {
      const nextAccount = await githubRequest<GitHubAccount>('/account');
      if (version !== generation.current) return;
      setAccount(nextAccount);
      if (enrollmentId && nextAccount.connected) {
        const next = await githubRequest<GitHubWorkspace>(`/projects/${enrollmentId}`);
        if (version !== generation.current) return;
        setWorkspace(next);
        repositoryCallback.current?.(!!next.name);
        const snapshot = JSON.stringify(next.pullRequests);
        if (previousPRs.current !== undefined && previousPRs.current !== snapshot) syncCallback.current?.();
        previousPRs.current = snapshot;
      } else {
        setWorkspace(undefined);
        repositoryCallback.current?.(false);
      }
      setError('');
    } catch (e) {
      if (version === generation.current) setError((e as Error).message);
    } finally {
      if (version === generation.current) setLoading(false);
    }
  }, [enrollmentId]);

  useEffect(() => {
    const version = ++generation.current;
    setWorkspace(undefined); setSelectedBranch(''); setLastChecked(undefined); setLoading(true); setBusy(''); setNotice(''); setSetupOpen(false);
    previousPRs.current = undefined;
    void load(version);
    // Poll saved status only. GitHub sync/review remains an explicit action.
    const timer = setInterval(() => void load(version), 30000);
    return () => { clearInterval(timer); generation.current++; };
  }, [load]);
  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

  async function action(kind: string) {
    const version = generation.current;
    setBusy(kind); setError(''); setNotice('');
    try {
      if (kind === 'connect') {
        const result = await githubRequest<{url: string}>('/auth-url');
        window.location.assign(result.url); return;
      }
      if (kind === 'disconnect') await githubRequest('/disconnect', 'DELETE');
      else if (enrollmentId) {
        const next = await githubRequest<GitHubWorkspace>(`/projects/${enrollmentId}/${kind}`, 'POST');
        if (version !== generation.current) return;
        setWorkspace(next);
        if (kind === 'sync') { setLastChecked(new Date()); syncCallback.current?.(); }
      }
      await load(version);
      if (version === generation.current && kind === 'setup') setNotice('Repository setup updated.');
    } catch (e) { if (version === generation.current) setError((e as Error).message); }
    finally { if (version === generation.current) setBusy(''); }
  }

  async function copy(command: string) {
    try {
      await navigator.clipboard.writeText(command);
      setNotice('Command copied. Paste it into your terminal.');
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setNotice(''), 4000);
    } catch { setError('Could not copy. Select the command below and copy it manually.'); setSetupOpen(true); }
  }

  const branches = workspace?.branches ?? [];
  const prs = workspace?.pullRequests ?? [];
  const branch = branches.find(b => b.branch === selectedBranch);
  const ticket = tickets.find(t => t.ticketKey === branch?.ticket);
  const selectedPR = ticket ? prs.find(pr => pr.ticket_id === ticket.id) : undefined;
  const focusPR = branch ? selectedPR : prs.find(pr => !pr.merged && pr.state !== 'closed');
  const cloneCommand = workspace?.url ? `git clone ${workspace.url.replace(/\.git$/, '')}.git` : '';
  const branchCommand = branch ? `git checkout -b ${branch.branch}` : '';
  const pushCommand = branch ? `git push -u origin ${branch.branch}` : '';
  const prUrl = workspace?.url ? `${workspace.url}/compare${branch ? `/${encodeURIComponent(branch.branch)}?expand=1&title=${encodeURIComponent(`${branch.ticket}: ${ticket?.title || 'Ticket implementation'}`)}` : ''}` : '';
  const ready = !!workspace?.name && !!workspace.url;
  const recommended = suggestedTicketKey || tickets.find(t => t.status === 'IN_PROGRESS')?.ticketKey || tickets.find(t => t.status !== 'DONE')?.ticketKey;
  const nextTitle = !branch && !focusPR ? 'Choose a ticket to start' : !focusPR ? 'Create your ticket branch' : focusPR.merged ? 'Your pull request is merged' : focusPR.state === 'closed' ? 'This pull request is closed' : focusPR.approved ? 'Your changes are approved' : focusPR.review_status === 'POSTED' ? 'Update your code from the feedback' : 'Check your pull request review';
  const nextDescription = !branch && !focusPR ? 'Pick a ticket below. We will prepare the branch and pull request links for you.' : !focusPR ? 'Clone the project if needed, create this branch, then commit and push your changes.' : focusPR.merged ? 'Check its review status below, or choose another ticket to keep building.' : focusPR.state === 'closed' ? 'Open it on GitHub to inspect the result, or select another ticket.' : focusPR.approved ? 'Inspect your changes and run your tests before merging on GitHub.' : focusPR.review_status === 'POSTED' ? 'Read the review, push your fixes to the same branch, then check for updates.' : 'You can view the PR on GitHub or check for the latest review here.';

  function Command({label, command}: {label: string; command: string}) {
    return <div><p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p><div className="flex items-start gap-3 rounded-xl bg-slate-100 p-3 dark:bg-slate-950"><code className="min-w-0 flex-1 break-all text-xs leading-6">{command}</code><button type="button" className="rounded p-1 hover:bg-slate-200 dark:hover:bg-slate-800" aria-label={`Copy ${label.toLowerCase()}`} onClick={() => void copy(command)}><Copy size={16}/></button></div></div>;
  }

  return <section aria-label="GitHub project workspace" className="surface-card my-5 text-slate-900 dark:text-slate-100">
    <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
      <div className="flex min-w-0 items-center gap-3"><span className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-800"><Github size={23}/></span><div className="min-w-0"><p className="mb-1 text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500">GitHub workspace</p><h2 className="break-words text-lg font-semibold">{ready ? projectName || workspace.name?.split('/').pop() : 'Build your project on GitHub'}</h2><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">{account?.connected ? <><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>Connected as @{account.username}</> : loading ? 'Checking connection...' : 'Connect your account to submit real code and get feedback.'}</p></div></div>
      <div className="flex flex-wrap items-center gap-2">
        {ready && account?.connected && <a className={secondary} href={workspace.url} target="_blank" rel="noopener noreferrer">Open repository <ArrowUpRight size={15}/></a>}
        {!account?.connected && <button type="button" className={primary} disabled={loading || !!busy || !account?.configured} onClick={() => void action('connect')}>{busy === 'connect' ? 'Connecting...' : 'Connect GitHub'}</button>}
        {account?.connected && <details className="relative"><summary aria-label="GitHub settings" className="flex cursor-pointer list-none rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"><MoreHorizontal size={20}/></summary><div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {ready && <button type="button" disabled={!!busy} className="w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800" onClick={() => void action('setup')}>{busy === 'setup' ? 'Updating setup...' : 'Repair repository setup'}</button>}
          {account.botInstallUrl && <a className="block rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800" href={account.botInstallUrl} target="_blank" rel="noopener noreferrer">Install review bot <ArrowUpRight className="inline" size={13}/></a>}
          <Link href="/my-portfolio" className="block rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">View my work portfolio</Link>
          <button type="button" disabled={!!busy} className="w-full rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950" onClick={() => void action('disconnect')}>Disconnect GitHub</button>
        </div></details>}
      </div>
    </div>
    {error && <div role="alert" className="mx-5 mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"><span>{error}</span><button type="button" disabled={!!busy} className="font-semibold underline" onClick={() => void load(generation.current)}>Retry</button></div>}
    {notice && <p role="status" className="mx-5 mb-4 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400"><Check size={14}/>{notice}</p>}
    {account && !account.configured && <p className="px-5 pb-5 text-sm text-slate-500">GitHub connection is not available yet. Ask your administrator to enable it.</p>}
    {enrollmentId && account?.connected && !loading && !workspace && !error && <p className="px-5 pb-5 text-sm text-slate-500">Loading repository...</p>}
    {enrollmentId && account?.connected && workspace && !ready && <div className="mx-5 mb-5 rounded-2xl bg-violet-50 p-5 dark:bg-violet-950/30"><h3 className="font-semibold">Create your project repository</h3><p className="mb-4 mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">We will create a public repository in your connected GitHub account, ready for your project work.</p><button type="button" className={primary} disabled={!!busy} onClick={() => void action('provision-repo')}>{busy === 'provision-repo' ? 'Creating repository...' : 'Create project repository'}</button></div>}
    {account?.connected && ready && workspace && <>
      <div className="mx-5 mb-5 rounded-2xl border border-violet-100 bg-violet-50/60 p-4 dark:border-violet-900 dark:bg-violet-950/20 sm:mx-6 sm:p-5">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-violet-600 dark:text-violet-400">Your next step</p>
        <div className="flex flex-wrap items-start justify-between gap-4"><div className="max-w-xl"><h3 className="font-semibold">{nextTitle}</h3><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{nextDescription}</p></div>{focusPR ? <a href={focusPR.url} className={primary} target="_blank" rel="noopener noreferrer">View pull request <ArrowUpRight size={15}/></a> : branch ? <button type="button" className={primary} onClick={() => { setSetupOpen(true); void copy(branchCommand); }}><GitBranch size={15}/>Copy branch command</button> : <button type="button" className={secondary} onClick={() => setSetupOpen(true)}><Terminal size={15}/>First time? Clone project</button>}</div>
        <label className="mt-4 block text-xs font-medium text-slate-600 dark:text-slate-400" htmlFor="github-ticket-branch">Work on a ticket</label>
        <select id="github-ticket-branch" className="mt-2 w-full min-w-0 rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900" value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}>
          <option value="">{branches.length ? 'Choose a ticket' : 'No assigned tickets yet'}</option>{branches.map(b => { const t = tickets.find(t => t.ticketKey === b.ticket); return <option key={b.ticket} value={b.branch}>{b.ticket}{t ? ` - ${t.title}` : ''}{b.ticket === recommended ? ' (Suggested)' : ''}</option>; })}
        </select>
        {branch && !focusPR && <div className="mt-3 flex flex-wrap items-center gap-3 text-xs"><span className="flex min-w-0 items-center gap-1.5 break-all font-mono text-slate-500"><GitBranch size={13}/>{branch.branch}</span><a href={prUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-violet-600 dark:text-violet-400">Pushed your code? Open a pull request <ArrowUpRight className="inline" size={13}/></a></div>}
      </div>
      <details open={setupOpen} onToggle={e => setSetupOpen(e.currentTarget.open)} className="mx-5 mb-5 rounded-xl border border-slate-200 dark:border-slate-800 sm:mx-6"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-medium"><span className="flex items-center gap-2"><Terminal size={16}/>Setup & terminal commands</span><ChevronDown size={16} className={setupOpen ? 'rotate-180' : ''}/></summary><div className="space-y-4 border-t border-slate-200 p-4 dark:border-slate-800"><p className="text-xs leading-5 text-slate-500">Run these commands in your terminal. Clone once, open the project folder, then use a separate branch for each ticket.</p><Command label="1. Clone project" command={cloneCommand}/><Command label="2. Open project folder" command={`cd ${workspace.name?.split('/').pop()}`}/>{branch ? <><Command label="3. Create ticket branch" command={branchCommand}/><p className="text-xs leading-5 text-slate-500">Implement the ticket, run your tests, and commit your changes before pushing.</p><Command label="4. Push committed changes" command={pushCommand}/><a className={secondary} href={prUrl} target="_blank" rel="noopener noreferrer">5. Open pull request <ArrowUpRight size={14}/></a></> : <p className="text-sm text-slate-500">Choose a ticket above to see its branch and push commands.</p>}</div></details>
      <div className="border-t border-slate-200 p-5 dark:border-slate-800 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="flex items-center gap-2 text-sm font-semibold"><GitPullRequest size={17}/>Pull requests <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800">{prs.length}</span></h3><p className="mt-1 text-xs text-slate-500">{busy === 'sync' ? 'Fetching pull requests and checking reviews...' : lastChecked ? `Last checked at ${lastChecked.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}` : 'Check for updates after opening a PR or pushing changes.'}{workspace.webhookConfigured && ' Automatic updates enabled.'}</p></div><button type="button" disabled={!!busy} className={secondary} onClick={() => void action('sync')}><RefreshCw size={14} className={busy === 'sync' ? 'animate-spin' : ''}/>{busy === 'sync' ? 'Checking...' : 'Check for updates'}</button></div>
        {!prs.length ? <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center dark:border-slate-700"><GitPullRequest size={25} className="mx-auto mb-3 text-slate-400"/><h4 className="text-sm font-medium">Your first pull request starts here</h4><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Choose a ticket, push your changes and open a pull request. Your review and progress will appear here.</p></div> : <div className="space-y-3">{prs.map(pr => <PullRequestCard key={pr.pr_number} pr={pr} ticket={tickets.find(t => t.id === pr.ticket_id)} selected={focusPR?.pr_number === pr.pr_number}/>)}</div>}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>Your reviewed and merged work builds your portfolio.</span><Link href="/my-portfolio" className="inline-flex items-center gap-1 font-semibold text-violet-600 dark:text-violet-400">View my work <ArrowUpRight size={13}/></Link></div>
      </div>
    </>}
  </section>;
}

function PullRequestCard({pr, ticket, selected}: {pr: GitHubPR; ticket?: ProjectTicket; selected: boolean}) {
  const status = pullRequestStatus(pr);
  const reviewDone = pr.review_status === 'POSTED';
  return <article className={`rounded-xl border p-4 ${selected ? 'border-violet-300 dark:border-violet-800' : 'border-slate-200 dark:border-slate-800'}`}>
    <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><a href={pr.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 text-sm font-semibold hover:text-violet-600"><GitPullRequest size={17} className="mt-0.5 shrink-0"/><span>{ticket ? `${ticket.ticketKey}: ${ticket.title}` : `Pull request #${pr.pr_number}`}<ArrowUpRight size={13} className="ml-1 inline"/></span></a><p className="ml-6 mt-1 text-xs text-slate-500">PR #{pr.pr_number}{pr.merged && !pr.approved ? ' - Merged without DevSim approval' : ''}</p></div><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}>{status.label}</span></div>
    <ol aria-label="Pull request progress" className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px]">{[{label: 'PR opened', done: true}, {label: reviewDone ? pr.approved ? 'Review approved' : 'Changes requested' : 'Review pending', done: reviewDone}, {label: 'Merged', done: pr.merged}].map(step => <li key={step.label} className={`flex items-center gap-1.5 ${step.done ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>{step.done ? <CheckCircle2 size={13}/> : <span className="h-3 w-3 rounded-full border border-current"/>}{step.label}</li>)}</ol>
    {pr.review_body && <details className="mt-4 border-t border-slate-100 pt-3 text-sm dark:border-slate-800"><summary className="cursor-pointer font-medium text-violet-600 dark:text-violet-400">{reviewDone && !pr.approved ? 'See what to improve' : 'View review feedback'}</summary><p className="mt-3 whitespace-pre-wrap break-words text-xs leading-6 text-slate-600 dark:text-slate-400">{pr.review_body.replace(/<!--[\s\S]*?-->/g, '')}</p><a className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-400" href={`${pr.url}#pullrequestreview`} target="_blank" rel="noopener noreferrer">View feedback and file comments on GitHub <ArrowUpRight size={13}/></a></details>}
  </article>;
}
