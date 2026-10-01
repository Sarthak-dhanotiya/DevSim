'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { Project } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Badge, DifficultyBadge } from '@/components/ui/Badge';
import { Search, Clock } from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await api.getProjects();
        setProjects(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.company?.name.toLowerCase().includes(search.toLowerCase()) ||
    p.technologies.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Simulated Projects</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Enterprise backend projects hosted by virtual companies.
          </p>
        </div>

        {/* Search */}
        <div className="w-full sm:w-64 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-9 pr-3 py-1.5 rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-slate-400 border-t-slate-900 dark:border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 font-medium">{p.company?.name}</span>
                  <div className="flex items-center gap-2">
                    <DifficultyBadge difficulty={p.difficulty} />
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {p.estimatedDuration}
                    </span>
                  </div>
                </div>

                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">{p.name}</h2>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4">
                  {p.shortDescription}
                </p>

                <div className="flex flex-wrap gap-1 mb-4">
                  {p.technologies.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">{p.careerTrack?.name}</span>
                <Link href={`/projects/${p.slug}`}>
                  <Button variant="primary" size="sm" className="text-xs">
                    Project Details →
                  </Button>
                </Link>
              </div>
            </div>
          ))}

          {filteredProjects.length === 0 && (
            <div className="col-span-full p-8 text-center rounded-lg border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-500">
              No projects matching your search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
