'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { CareerTrack, Project } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Badge, DifficultyBadge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth/AuthContext';
import { ArrowRight, Check } from 'lucide-react';

export default function CareerTrackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user, refreshProfile } = useAuth();

  const [track, setTrack] = useState<CareerTrack | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const trackRes = await api.getCareerTrackBySlug(slug);
        setTrack(trackRes.data);
        if (trackRes.data) {
          const projRes = await api.getProjects({ trackId: trackRes.data.id });
          setProjects(projRes.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (slug) {
      loadData();
    }
  }, [slug]);

  const handleSelectTrack = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!track) return;

    setSelecting(true);
    try {
      await api.updateProfile({ selectedCareerTrackId: track.id });
      await refreshProfile();
      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to select track:', err);
    } finally {
      setSelecting(false);
    }
  };

  const isSelected = user?.profile?.selectedCareerTrack?.id === track?.id;

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-slate-400 border-t-slate-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!track) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Career Track Not Found</h2>
        <Link href="/career-tracks" className="mt-3 inline-block">
          <Button variant="secondary" size="sm">Back to Tracks</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="success">Active Track</Badge>
            <span className="text-xs text-slate-500 font-mono">Backend</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {track.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-xl leading-relaxed">
            {track.description}
          </p>
        </div>

        <div className="shrink-0">
          {isSelected ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
              <Check className="w-3.5 h-3.5" />
              Selected Track
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              loading={selecting}
              onClick={handleSelectTrack}
            >
              Select Career Track
            </Button>
          )}
        </div>
      </div>

      {/* Projects */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Simulated Projects
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projects.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 font-medium">{p.company?.name}</span>
                  <DifficultyBadge difficulty={p.difficulty} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">{p.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{p.shortDescription}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {p.technologies.map((t) => (
                    <span key={t} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">{p.estimatedDuration}</span>
                <Link href={`/projects/${p.slug}`}>
                  <Button variant="secondary" size="sm" className="text-xs">
                    View Project →
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
