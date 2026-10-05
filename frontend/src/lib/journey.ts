import type { Project } from './types';
export interface Journey {
  userId: string; skills: string; goal: string; weeklyHours: number;
  resumeName?: string; resumeSummary?: string; assessmentScore?: number; assessmentSkipped?:boolean; assessmentAnswer?: string;
  assignmentMode: 'AUTOMATED' | 'GUIDED'; status: 'DRAFT' | 'PENDING_REVIEW' | 'ASSIGNED' | 'REJECTED';
  preferredProjectId?: string; requestNote?: string; adminNote?: string;
}
export interface JourneyState {
  journey: Journey;
  recommendations: { project: Project; matchScore: number; matchedSkills: string[]; learningSkills: string[]; reason: string }[];
  engine: 'BUILT_IN' | 'GEMINI_CONFIGURED'; assessmentNote: string;
}
export interface AssignmentRequest { userId: string; name: string; email: string; journey: Journey }
export interface Evidence {
  name: string; skills: string; verification: string;
  completedTickets: { project: string; ticket: string; title: string; criteria: string; score?: number; completedAt: string; source: string; feedback: string }[];
}

export interface PersonalizedChallenge {id:string;source:"GEMINI"|"PROFILE_FALLBACK";unavailableReason?:string;context:string;minutes:number;questions:{title:string;options:string[]}[];task:string;criteria:string[];}
