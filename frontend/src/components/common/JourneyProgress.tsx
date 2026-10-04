'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';
import {FirstDayBrief} from './FirstDayBrief';
import type { JourneyState, Evidence } from '@/lib/journey';
import { ArrowRight, Download, Sparkles, RefreshCw } from 'lucide-react';

export function JourneyProgress({ onSprint }: { onSprint?: () => void }) {
  const { user } = useAuth(); const [state, setState] = useState<JourneyState | null>(null); const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const [ready, setReady] = useState(false);
  async function load() {
    try {
      const s = await api.getJourney(); setState(s.data);
      if (s.data.journey.status === 'ASSIGNED') {
        const [e, enrollment] = await Promise.all([api.getEvidence(), api.getCurrentEnrollment()]); setEvidence(e.data);
        if (enrollment.data) { const w = await api.getWorkspace(enrollment.data.id); setReady(w.data.totalTickets > 0 && w.data.completedTickets === w.data.totalTickets); }
      }
    } catch (e) { setMessage((e as Error).message); }
  }
  useEffect(() => { if (user?.role === 'STUDENT') load(); }, [user?.userId]);
  async function next() { setBusy(true); setMessage(''); try { const r = await api.nextSprint(); setMessage(r.data.reason); setReady(false); await load(); onSprint?.(); } catch (e) { setMessage((e as Error).message); } finally { setBusy(false); } }
  function download() {
    if (!evidence) return;
    const text = `# ${evidence.name} — Engineering evidence\n\nSkills: ${evidence.skills}\n\n${evidence.verification}\n\n` + evidence.completedTickets.map(t => `## ${t.ticket}: ${t.title}\nProject: ${t.project}\nReview score: ${t.score ?? 'unavailable'}/100\nCompleted: ${t.completedAt}\nTicket source: ${t.source}\n\nAcceptance criteria:\n${t.criteria}\n\nReview:\n${t.feedback}\n`).join('\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown' })); const a = document.createElement('a'); a.href = url; a.download = 'devsim-engineering-evidence.md'; a.click(); URL.revokeObjectURL(url);
  }
  if (user?.role !== 'STUDENT') return null;
  return <section className="mb-6 rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/70 dark:bg-indigo-950/30 p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="flex items-center gap-2 text-sm font-semibold"><Sparkles size={16} className="text-indigo-500" />Your personalized journey</h2><p className="mt-2 text-xs text-slate-500">{state?.journey.status === 'PENDING_REVIEW' ? 'Guided assignment pending. The admin will review your preferences.' : state?.journey.status === 'ASSIGNED' ? `${state.journey.skills} · ${state.journey.weeklyHours}h/week · ${evidence?.completedTickets.length || 0} reviewed tickets completed` : 'Set up your skills and goal to receive a personalized project.'}</p></div><div className="flex flex-wrap gap-3"><button onClick={load} title="Refresh progress" aria-label="Refresh journey progress" className="text-indigo-500"><RefreshCw size={16} /></button><Link href="/onboarding" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300">View journey <ArrowRight size={14} /></Link>{state?.journey.status === 'ASSIGNED' && <><button disabled={busy || !ready} onClick={next} title={ready ? 'Unlock the next personalized sprint' : 'Finish the current sprint first'} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">{busy ? 'Generating…' : 'Unlock next sprint'}</button><button onClick={download} disabled={!evidence?.completedTickets.length} className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-300 disabled:opacity-40"><Download size={14} />Export evidence</button></>}</div></div>{state?.journey.status==='ASSIGNED'&&<details className="mt-4"><summary className="text-xs cursor-pointer text-indigo-500">Your first-day brief</summary><FirstDayBrief state={state} name={user.profile?.name||'Developer'} employeeId={user.userId}/></details>}{message && <p role="status" className="mt-3 text-xs leading-5 text-slate-500">{message}</p>}</section>;
}
