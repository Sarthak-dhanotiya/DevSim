'use client';
import React, { useState } from 'react';
import { api } from '@/lib/api/client';
import type { ProjectTicket } from '@/lib/types';
import { Lightbulb } from 'lucide-react';
export function TicketSupport({ ticket, enrollmentId }: { ticket: ProjectTicket; enrollmentId: string }) {
  const [hint, setHint] = useState(''); const [busy, setBusy] = useState(false); const [count, setCount] = useState(ticket.hintsUsed || 0);
  async function request() { setBusy(true); try { const r = await api.getTicketHint(enrollmentId, ticket.id); setHint(r.data.hint); setCount(r.data.hintsUsed); } catch (e) { setHint((e as Error).message); } finally { setBusy(false); } }
  return <div className="mx-5 mb-3 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20 p-3 text-xs"><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-slate-500">{ticket.generationSource === 'GEMINI' ? 'Live AI generated' : ticket.generationSource === 'BUILT_IN' ? 'Built-in personalized ticket' : 'Curated ticket'} · {ticket.difficultyLevel?.toLowerCase()} {ticket.reviewScore != null ? `· review ${ticket.reviewScore}/100` : ''}</span><button onClick={request} disabled={busy || ticket.status === 'DONE'} className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-300 disabled:opacity-40"><Lightbulb size={13} />{busy ? 'Loading…' : `Unlock hint (${count} used)`}</button></div>{hint && <p role="status" className="mt-2 whitespace-pre-line leading-5 text-slate-600 dark:text-slate-300">{hint}</p>}<p className="mt-2 text-[10px] leading-4 text-slate-400">Review checks submitted text. It does not run tests or merge a repository. Hint usage helps choose your next sprint.</p></div>;
}
