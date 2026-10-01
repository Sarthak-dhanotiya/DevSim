'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Project, VirtualCompany } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Badge, DifficultyBadge } from '@/components/ui/Badge';
import { Clock } from 'lucide-react';

export default function CompanyDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [company, setCompany] = useState<VirtualCompany | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCompany() {
      try {
        const res = await api.getCompanyBySlug(slug);
        setCompany(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (slug) {
      loadCompany();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-slate-400 border-t-slate-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Virtual Company Not Found</h2>
        <Link href="/companies" className="mt-3 inline-block">
          <Button variant="secondary" size="sm">Back to Companies</Button>
        </Link>
      </div>
    );
  }

  const projects = (company.projects as Project[]) || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-4">
        <div className="w-12 h-12 rounded bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold flex items-center justify-center text-base shrink-0">
          {company.name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{company.name}</h1>
            <Badge variant="outline">{company.industry}</Badge>
          </div>
          <div className="text-xs text-slate-500 mt-1">{company.companySize}</div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
            {company.description}
          </p>
        </div>
      </div>

      {/* Engineering Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-white mb-1">Architecture</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Modular monolith with clean separation of domain concerns and strict validation.
          </p>
        </div>
        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-white mb-1">Tech Stack</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Java 21, Spring Boot 3, PostgreSQL, Flyway, Maven, Spring Security.
          </p>
        </div>
        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-white mb-1">Methodology</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Git-based workflows, REST API contracts, and standard database schema versioning.
          </p>
        </div>
      </div>

      {/* Projects */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Projects at {company.name}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projects.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <DifficultyBadge difficulty={p.difficulty} />
                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {p.estimatedDuration}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{p.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{p.shortDescription}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {p.technologies?.map((tech) => (
                    <span key={tech} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">{p.careerTrack?.name}</span>
                <Link href={`/projects/${p.slug}`}>
                  <Button variant="primary" size="sm" className="text-xs">
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
