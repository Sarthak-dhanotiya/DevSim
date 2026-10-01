'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge, DifficultyBadge } from '@/components/ui/Badge';
import {
  ArrowRight,
  Building2,
  Layers,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="space-y-16 py-12">
      {/* 1. HERO SECTION */}
      <section className="max-w-4xl mx-auto px-4 text-center pt-8">
        <Badge variant="default" size="md">
          Phase 1 Foundation
        </Badge>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mt-4 leading-tight">
          Get real software engineering experience before your first job.
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Skip theoretical tutorials. Join simulated virtual software companies and build backend systems
          with real production standards.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/register">
            <Button size="md" className="w-full sm:w-auto flex items-center gap-2">
              Start Free as Student <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/projects">
            <Button variant="outline" size="md" className="w-full sm:w-auto">
              Browse Projects
            </Button>
          </Link>
        </div>

        {/* Clean Tech Pills */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="text-sm font-semibold text-slate-900 dark:text-white">Java 21</div>
            <div className="text-xs text-slate-500">Modern LTS Core</div>
          </div>
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="text-sm font-semibold text-slate-900 dark:text-white">Spring Boot 3</div>
            <div className="text-xs text-slate-500">Modular Monolith</div>
          </div>
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="text-sm font-semibold text-slate-900 dark:text-white">PostgreSQL</div>
            <div className="text-xs text-slate-500">Flyway Migrations</div>
          </div>
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="text-sm font-semibold text-slate-900 dark:text-white">Next.js 14</div>
            <div className="text-xs text-slate-500">TypeScript & Tailwind</div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">How It Works</h2>
          <p className="text-sm text-slate-500 mt-1">A simple, focused software engineering simulation.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-xs font-mono font-bold text-slate-400">01</span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1 mb-1">Select Track</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Choose Java Backend Developer tailored for enterprise roles.
            </p>
          </div>

          <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-xs font-mono font-bold text-slate-400">02</span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1 mb-1">Join Company</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Explore QuickKart, a growing e-commerce tech employer.
            </p>
          </div>

          <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-xs font-mono font-bold text-slate-400">03</span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1 mb-1">Enroll in Project</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Take on the QuickKart Commerce Backend repository.
            </p>
          </div>

          <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-xs font-mono font-bold text-slate-400">04</span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1 mb-1">Track Progress</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              See current active projects on your student dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* 3. FEATURED CAREER TRACK */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="p-6 sm:p-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="success">Active Track</Badge>
                <span className="text-xs text-slate-500 font-mono">Backend Engineering</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Java Backend Developer
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-xl leading-relaxed">
                Learn real-world backend engineering by working on Java, Spring Boot, PostgreSQL, Redis, APIs and production-style projects.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-4">
                {['Java 21', 'Spring Boot 3', 'PostgreSQL', 'Flyway', 'Spring Security', 'REST API'].map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="shrink-0">
              <Link href="/career-tracks/java-backend-developer">
                <Button variant="primary" size="sm">
                  View Career Track →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. VIRTUAL COMPANY SPOTLIGHT */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Card */}
          <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold flex items-center justify-center text-sm">
                  QK
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">QuickKart</h3>
                  <div className="text-xs text-slate-500">E-Commerce • 50-200 employees</div>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                A growing e-commerce technology company building scalable backend systems for customers, products, orders and payments.
              </p>
            </div>
            <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800/80">
              <Link href="/companies/quickkart">
                <Button variant="outline" size="sm" className="w-full">
                  Explore QuickKart
                </Button>
              </Link>
            </div>
          </div>

          {/* Project Card */}
          <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <DifficultyBadge difficulty="BEGINNER" />
                <span className="text-xs text-slate-500 font-mono">4 weeks</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                QuickKart Commerce Backend
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Build and maintain backend services for an e-commerce platform including products, customers, orders and inventory.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {['Java 21', 'Spring Boot', 'PostgreSQL', 'REST API'].map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800/80">
              <Link href="/projects/quickkart-commerce-backend">
                <Button variant="primary" size="sm" className="w-full">
                  View Project & Enroll
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BOTTOM CTA */}
      <section className="max-w-2xl mx-auto px-4 text-center py-8">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Ready to begin?
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-2">
          Create your profile, select your track, and start your simulation today.
        </p>
        <div className="mt-5">
          <Link href="/register">
            <Button size="md">Create Student Account</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
