import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 dark:text-white">DevSim</span>
            <span>— Virtual Software Company Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/career-tracks" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Tracks
            </Link>
            <Link href="/companies" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Companies
            </Link>
            <Link href="/projects" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Projects
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
