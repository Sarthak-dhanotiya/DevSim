'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Enrollment, Project } from '@/lib/types';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Badge, DifficultyBadge, StatusBadge } from '@/components/ui/Badge';
import { Clock, AlertCircle, CheckCircle2, Check } from 'lucide-react';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [currentEnrollment, setCurrentEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [projRes, enrollRes] = await Promise.all([
          api.getProjectBySlug(slug),
          user ? api.getCurrentEnrollment().catch(() => ({ data: null })) : Promise.resolve({ data: null }),
        ]);

        setProject(projRes.data);
        setCurrentEnrollment(enrollRes?.data || null);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err?.message || 'Failed to load project details.');
      } finally {
        setLoading(false);
      }
    }
    if (slug) {
      loadData();
    }
  }, [slug, user]);

  const handleEnroll = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!project) return;

    setEnrolling(true);
    setErrorMsg(null);

    try {
      await api.enrollInProject(project.id);
      router.push('/dashboard');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to enroll in project.');
    } finally {
      setEnrolling(false);
    }
  };

  const isEnrolledInThis = currentEnrollment?.project?.id === project?.id;

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-slate-400 border-t-slate-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Project Not Found</h2>
        <Link href="/projects" className="mt-3 inline-block">
          <Button variant="secondary" size="sm">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
        <Link href="/projects" className="hover:underline">
          Projects
        </Link>
        <span>/</span>
        <span className="text-slate-800 dark:text-slate-200">{project.name}</span>
      </div>

      {errorMsg && (
        <div className="p-3 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center gap-2 text-xs text-red-800 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header Card */}
      <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <DifficultyBadge difficulty={project.difficulty} />
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Company:{' '}
              <Link href={`/companies/${project.company?.slug}`} className="font-semibold text-slate-900 dark:text-white hover:underline">
                {project.company?.name}
              </Link>
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" /> {project.estimatedDuration}
            </span>
          </div>

          {isEnrolledInThis && (
            <StatusBadge status={currentEnrollment?.status || 'IN_PROGRESS'} />
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {project.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
            {project.shortDescription}
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs text-slate-500 font-mono">
            Track: <strong className="text-slate-700 dark:text-slate-300">{project.careerTrack?.name}</strong>
          </span>

          <div>
            {isEnrolledInThis ? (
              <Link href="/dashboard">
                <Button variant="primary" size="sm" className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Enrolled (View Dashboard)
                </Button>
              </Link>
            ) : (
              <Button
                variant="primary"
                size="sm"
                loading={enrolling}
                onClick={handleEnroll}
              >
                Enroll / Start Project
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Overview and Technologies */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="sm:col-span-2 p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Project Overview</h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
            {project.description}
          </p>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">
              Key Engineering Goals
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Modular Spring Boot layered architecture (Controller, Service, Repository, DTO).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Flyway database migrations and relational PostgreSQL constraints.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Stateless JWT authentication & Spring Security access controls.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">
              Technologies
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {project.technologies.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">
              Employer
            </h3>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {project.company?.name}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {project.company?.description}
            </p>
            <Link
              href={`/companies/${project.company?.slug}`}
              className="text-xs text-slate-900 dark:text-white font-medium hover:underline inline-block pt-1"
            >
              View Company Profile →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
