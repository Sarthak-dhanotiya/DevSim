'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, ArrowUpRight } from 'lucide-react';
import { DeveloperPortfolio } from './DeveloperPortfolio';

export function DeveloperProfileModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!isOpen || !element) return;
    element.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = previousOverflow; };
  }, [isOpen]);
  if (!isOpen) return null;
  return <dialog ref={dialog} aria-label="Sarthak Dhanotiya developer portfolio" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }} className="portfolio-dialog rounded-3xl p-0 w-[calc(100%-2rem)] max-w-3xl max-h-[90dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl">
    <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-white/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800">
      <Link href="/portfolio" onClick={onClose} className="text-xs font-medium flex items-center gap-2">Open full portfolio <ArrowUpRight size={14} /></Link>
      <button autoFocus onClick={onClose} aria-label="Close portfolio" className="rounded-full p-2 hover:bg-violet-500/10"><X size={18} /></button>
    </div>
    <div className="p-4 sm:p-6"><DeveloperPortfolio /></div>
  </dialog>;
}
