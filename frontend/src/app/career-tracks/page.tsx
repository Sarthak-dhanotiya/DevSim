'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { CareerTrack } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Layers, ArrowRight } from 'lucide-react';

export default function CareerTracksPage() {
  const [tracks, setTracks] = useState<CareerTrack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTracks() {
      try {
        const res = await api.getCareerTracks();
        setTracks(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTracks();
  }, []);

  const upcomingTracks = [
    { name: 'Frontend Developer', role: 'Frontend Engineer', description: 'React, Next.js, TypeScript, UI systems' },
    { name: 'Full Stack Developer', role: 'Full Stack Engineer', description: 'React interfaces + Spring Boot / Node APIs' },
    { name: 'Python Backend Developer', role: 'Python Engineer', description: 'FastAPI, Django, asynchronous queues, data layers' },
    { name: 'DevOps Engineer', role: 'Platform Engineer', description: 'Docker, CI/CD pipelines, Kubernetes, monitoring' },
    { name: 'AI Engineer', role: 'AI / ML Engineer', description: 'Agentic workflows, LLM orchestration, vector databases' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Career Tracks</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Structured simulations designed around real enterprise role expectations.
        </p>
      </div>

      {/* Active Tracks */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Available Now
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tracks.map((t) => (
            <div
              key={t.id}
              className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="success">Active Track</Badge>
                  <span className="text-xs text-slate-400 font-mono">4-6 Weeks</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t.name}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  {t.description}
                </p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {['Java 21', 'Spring Boot 3', 'PostgreSQL', 'Flyway', 'Spring Security'].map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">1 Virtual Company</span>
                <Link href={`/career-tracks/${t.slug}`}>
                  <Button variant="primary" size="sm" className="text-xs">
                    View Track →
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming Tracks */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Upcoming Tracks (Roadmap)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {upcomingTracks.map((item) => (
            <div
              key={item.name}
              className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-mono text-slate-400">{item.role}</span>
                <Badge variant="outline">Soon</Badge>
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{item.name}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
