'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { VirtualCompany } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Users } from 'lucide-react';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<VirtualCompany[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await api.getCompanies();
        setCompanies(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCompanies();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Virtual Companies</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Simulated software employers with production constraints and real company stacks.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {companies.map((company) => (
          <div
            key={company.id}
            className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold flex items-center justify-center text-sm">
                  {company.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">{company.name}</h2>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <span>{company.industry}</span>
                    <span>•</span>
                    <span>{company.companySize}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                {company.description}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">1 Active Project</span>
              <Link href={`/companies/${company.slug}`}>
                <Button variant="primary" size="sm" className="text-xs">
                  Company Details →
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
