'use client';

import React from 'react';
import {
  X,
  Code2,
  Mail,
  Linkedin,
  Github,
  Globe,
  Briefcase,
  Layers,
  Sparkles,
  ExternalLink,
  Award,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface DeveloperProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeveloperProfileModal({ isOpen, onClose }: DeveloperProfileModalProps) {
  if (!isOpen) return null;

  const skills = [
    'Java 21',
    'Spring Boot 3',
    'Spring Data JPA',
    'PostgreSQL',
    'Docker',
    'Next.js 14',
    'TypeScript',
    'Tailwind CSS',
    'REST APIs',
    'Microservices Architecture',
    'Flyway Migrations',
    'JUnit 5 / Mockito',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close profile"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header Banner */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-start gap-4">
            {/* Avatar Initials with Online Status */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xl flex items-center justify-center shadow-sm">
                SD
              </div>
              <span
                className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"
                title="Available for opportunities"
              />
            </div>

            {/* Name & Title */}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Sarthak Dhanotiya
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                  Creator & Architect
                </span>
              </div>

              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Associate Software Developer
              </p>

              <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Full Stack Software Engineer
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 text-xs sm:text-sm">
          {/* About Section */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
              About Developer
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Software developer passionate about engineering robust, distributed backend architectures and intuitive developer tooling. Designed and developed <strong>DevSim</strong> to bridge the gap between academic education and real-world tech industry practices through realistic simulation.
            </p>
          </div>

          {/* Platform Highlight Box */}
          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-xs text-slate-900 dark:text-white">
                Platform Achievements in DevSim
              </span>
            </div>
            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc list-inside">
              <li>Engineered 3-tier layered Java 21 / Spring Boot 3 modular backend with Flyway migrations.</li>
              <li>Built real-time simulated AI Tech Lead for automated code reviews and engineering guidance.</li>
              <li>Implemented interactive Kanban board, sprint progress tracker, and branch generator.</li>
            </ul>
          </div>

          {/* Core Technical Skills */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
              Core Technical Skills
            </span>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Connect & Social Links */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
              Connect & Portfolio
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-colors text-slate-700 dark:text-slate-300"
              >
                <Github className="w-4 h-4 shrink-0" />
                <span className="truncate">GitHub Profile</span>
                <ExternalLink className="w-3 h-3 ml-auto text-slate-400 shrink-0" />
              </a>

              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-colors text-slate-700 dark:text-slate-300"
              >
                <Linkedin className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
                <span className="truncate">LinkedIn Profile</span>
                <ExternalLink className="w-3 h-3 ml-auto text-slate-400 shrink-0" />
              </a>

              <a
                href="mailto:sarthakdhanotiya@example.com"
                className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-colors text-slate-700 dark:text-slate-300 col-span-2"
              >
                <Mail className="w-4 h-4 shrink-0 text-amber-500" />
                <span className="truncate">sarthak.dhanotiya@example.com</span>
                <span className="text-[10px] text-slate-400 ml-auto font-mono">Send Email</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            DevSim • Built by Sarthak Dhanotiya
          </span>
          <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
