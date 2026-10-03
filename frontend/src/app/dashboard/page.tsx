'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/Button';
import { Badge, DifficultyBadge, StatusBadge } from '@/components/ui/Badge';
import { JourneyProgress } from '@/components/common/JourneyProgress';
import { api } from '@/lib/api/client';
import { CareerTrack, Enrollment, Project, VirtualCompany, WorkspaceData } from '@/lib/types';
import {
  Briefcase,
  Building2,
  Layers,
  ArrowRight,
  Clock,
  UserCheck,
  Kanban,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  Target,
} from 'lucide-react';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const { user } = useAuth();

  const [currentEnrollment, setCurrentEnrollment] = useState<Enrollment | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [careerTracks, setCareerTracks] = useState<CareerTrack[]>([]);
  const [companies, setCompanies] = useState<VirtualCompany[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [enrollmentRes, tracksRes, companiesRes, projectsRes] = await Promise.all([
          api.getCurrentEnrollment().catch(() => ({ data: null })),
          api.getCareerTracks().catch(() => ({ data: [] })),
          api.getCompanies().catch(() => ({ data: [] })),
          api.getProjects().catch(() => ({ data: [] })),
        ]);

        const enrollment = enrollmentRes?.data || null;
        setCurrentEnrollment(enrollment);
        setCareerTracks(tracksRes?.data || []);
        setCompanies(companiesRes?.data || []);
        setProjects(projectsRes?.data || []);

        if (enrollment) {
          try {
            const wsRes = await api.getWorkspace(enrollment.id);
            setWorkspace(wsRes?.data || null);
          } catch (wsErr) {
            console.error('Failed to load workspace in dashboard:', wsErr);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-10 space-y-6" aria-label="Loading dashboard" role="status"><div className="skeleton h-48" /><div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{[0,1,2,3].map(i => <div key={i} className="skeleton h-28" />)}</div><div className="skeleton h-64" /><span className="sr-only">Loading your dashboard...</span></div>;
  const profile = user?.profile;
  const profileFields = [
    Boolean(profile?.name),
    Boolean(profile?.collegeName),
    Boolean(profile?.graduationYear),
    Boolean(profile?.currentYear),
    Boolean(profile?.bio),
    Boolean(profile?.githubUrl),
    Boolean(profile?.selectedCareerTrack),
  ];
  const completedFieldsCount = profileFields.filter(Boolean).length;
  const completionPercentage = Math.round((completedFieldsCount / profileFields.length) * 100);

  return (
    <div className="dashboard-shell max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <JourneyProgress />
      <section className="dashboard-hero relative overflow-hidden rounded-3xl p-7 sm:p-9">
        <div className="ambient-orb orb-one" aria-hidden="true" /><div className="ambient-orb orb-two" aria-hidden="true" />
        <div className="relative flex flex-col sm:flex-row justify-between gap-6">
          <div><div className="eyebrow text-violet-300 flex items-center gap-2"><Sparkles size={14} /> YOUR ENGINEERING JOURNEY</div>
            <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">Welcome back, {profile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Developer'}<span className="text-violet-300">.</span></h1>
            <p className="mt-3 text-sm leading-6 text-slate-300 max-w-md">{currentEnrollment ? 'Your next contribution is waiting. Build something you?re proud of today.' : 'Your first engineering adventure starts here. Find a project and make your first contribution.'}</p>
            <div className="flex flex-wrap gap-3 mt-6"><Link href={currentEnrollment ? '/workspace' : '/projects'}><Button className="!bg-violet-500 hover:!bg-violet-400 !text-white rounded-xl gap-2">{currentEnrollment ? 'Continue building' : 'Find your first project'} <ArrowUpRight size={16} /></Button></Link><Link href="/profile"><Button variant="outline" className="!text-white !border-white/20 hover:!bg-white/10 rounded-xl">Your profile</Button></Link></div>
          </div>
          <div className="sm:self-center rounded-2xl border border-white/15 bg-white/5 p-5 sm:min-w-[170px]"><span className="eyebrow text-violet-200">SPRINT COMPLETION</span><div className="text-4xl font-bold mt-3 tracking-tight">{workspace?.progressPercentage ?? 0}<span className="text-lg text-violet-300">%</span></div><p className="text-xs text-slate-300 mt-2">{workspace?.completedTickets ?? 0} / {workspace?.totalTickets ?? 0} tickets completed</p></div>
        </div>
      </section>
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[{ icon: CheckCircle2, label: 'Completed tickets', value: workspace?.completedTickets ?? 0 }, { icon: Kanban, label: 'In progress', value: workspace?.tickets.filter(t => t.status === 'IN_PROGRESS').length ?? 0 }, { icon: Target, label: 'In review', value: workspace?.tickets.filter(t => t.status === 'IN_REVIEW').length ?? 0 }, { icon: Briefcase, label: 'Projects to explore', value: projects.length }].map(({ icon: Icon, label, value }) => <div key={label} className="surface-card lift-card p-5"><div className="flex justify-between items-center"><Icon size={18} className="text-violet-500" /><span className="text-2xl font-bold tracking-tight">{value}</span></div><p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{label}</p></div>)}
      </section>
      {/* 2. PROFILE COMPLETION BANNER */}
      {completionPercentage < 100 && (
        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <UserCheck className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">Profile: {completionPercentage}% Complete</span>
              <span className="text-slate-500 ml-2">Add college, year, and URLs to finish setup.</span>
            </div>
          </div>
          <Link href="/profile">
            <Button variant="secondary" size="sm" className="text-xs">
              Complete Profile
            </Button>
          </Link>
        </div>
      )}

      {/* 3. CURRENT PROJECT */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-slate-400" />
          Current Project
        </h2>

        {currentEnrollment ? (
          <div className="surface-card p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <StatusBadge status={currentEnrollment.status} />
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Company: <strong className="text-slate-900 dark:text-white">{currentEnrollment.project?.company?.name}</strong>
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <DifficultyBadge difficulty={currentEnrollment.project?.difficulty || 'BEGINNER'} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {currentEnrollment.project?.name}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <Link href="/workspace">
                  <Button variant="primary" size="sm" className="flex items-center gap-1.5">
                    <Kanban className="w-3.5 h-3.5" /> Open Workspace
                  </Button>
                </Link>
                <Link href={`/projects/${currentEnrollment.project?.slug}`}>
                  <Button variant="outline" size="sm">
                    Details
                  </Button>
                </Link>
              </div>
            </div>

            {/* Sprint Progress Bar */}
            {workspace && (
              <div className="p-3.5 rounded border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Sprint Progress
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {workspace.progressPercentage}% Complete
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="progress-fill h-full rounded-full"
                    style={{ width: `${workspace.progressPercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    {workspace.completedTickets} of {workspace.totalTickets} tickets done
                  </span>
                  {workspace.suggestedNextTicketKey && (
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      Next up: <strong>{workspace.suggestedNextTicketKey}</strong>
                    </span>
                  )}
                </div>
              </div>
            )}

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {currentEnrollment.project?.shortDescription}
            </p>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
              {currentEnrollment.project?.technologies?.map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-lg border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
            <p className="text-xs text-slate-500 mb-3">No active project enrolled yet.</p>
            <Link href="/projects/quickkart-commerce-backend">
              <Button variant="primary" size="sm">
                Enroll in QuickKart Commerce Backend
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* 4. SELECTED CAREER TRACK */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            Selected Career Track
          </h2>
          <Link href="/career-tracks" className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white">
            Change Track →
          </Link>
        </div>

        {profile?.selectedCareerTrack ? (
          <div className="surface-card lift-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {profile.selectedCareerTrack.name}
                </span>
                <Badge variant="success">Active</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                {profile.selectedCareerTrack.description}
              </p>
            </div>
            <Link href={`/career-tracks/${profile.selectedCareerTrack.slug}`}>
              <Button variant="outline" size="sm" className="text-xs">
                View Details
              </Button>
            </Link>
          </div>
        ) : (
          <div className="p-5 rounded-lg border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
            <p className="text-xs text-slate-500 mb-2">No career track selected yet.</p>
            <Link href="/career-tracks">
              <Button variant="secondary" size="sm">
                Select Career Track
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* 5. AVAILABLE PROJECTS */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-slate-400" />
            Available Projects
          </h2>
          <Link href="/projects" className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white">
            View All ({projects.length}) →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="surface-card lift-card p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 font-medium">{proj.company?.name}</span>
                  <DifficultyBadge difficulty={proj.difficulty} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">{proj.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{proj.shortDescription}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {proj.technologies.slice(0, 3).map((t) => (
                    <span key={t} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {t}
                    </span>
                  ))}
                  {proj.technologies.length > 3 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500">
                      +{proj.technologies.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">{proj.estimatedDuration}</span>
                <Link href={`/projects/${proj.slug}`}>
                  <Button variant="secondary" size="sm" className="text-xs">
                    View
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. VIRTUAL COMPANIES */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          Virtual Companies
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {companies.map((c) => (
            <div
              key={c.id}
              className="surface-card lift-card p-5 flex items-start gap-3.5"
            >
              <div className="w-9 h-9 rounded bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold flex items-center justify-center text-xs shrink-0">
                {c.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</h3>
                  <span className="text-xs text-slate-400">{c.industry}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">{c.companySize}</span>
                  <Link href={`/companies/${c.slug}`} className="text-xs text-slate-700 dark:text-slate-300 font-medium hover:underline">
                    Profile →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
