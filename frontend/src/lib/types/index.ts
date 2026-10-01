export type Role = 'STUDENT' | 'ADMIN';

export type ExperienceLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export type EnrollmentStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export type TicketType = 'FEATURE' | 'BUG' | 'REFACTOR';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TicketStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export interface CareerTrack {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconUrl?: string;
  active: boolean;
}

export interface VirtualCompany {
  id: string;
  name: string;
  slug: string;
  description: string;
  industry: string;
  companySize: string;
  logoUrl?: string;
  active: boolean;
  projects?: Project[];
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  difficulty: Difficulty;
  estimatedDuration: string;
  active: boolean;
  company: VirtualCompany;
  careerTrack: CareerTrack;
  technologies: string[];
}

export interface StudentProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  collegeName?: string;
  graduationYear?: number;
  currentYear?: string;
  experienceLevel: ExperienceLevel;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  selectedCareerTrack?: CareerTrack;
}

export interface Enrollment {
  id: string;
  studentId: string;
  project: Project;
  status: EnrollmentStatus;
  startedAt: string;
  completedAt?: string;
}

export interface ProjectTicket {
  id: string;
  ticketKey: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
  ticketType: TicketType;
  priority: TicketPriority;
  estimatedHours: number;
  orderIndex: number;
  status: TicketStatus;
  branchName?: string;
  submissionNotes?: string;
  aiReviewFeedback?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface WorkspaceData {
  enrollmentId: string;
  project: Project;
  company: VirtualCompany;
  tickets: ProjectTicket[];
  totalTickets: number;
  completedTickets: number;
  progressPercentage: number;
  suggestedNextTicketKey?: string;
}

export interface AiChatMessage {
  senderName: string;
  senderRole: string;
  response: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface ErrorResponse {
  timestamp: string;
  status: number;
  errorCode: string;
  message: string;
  path: string;
  details?: string[];
}
