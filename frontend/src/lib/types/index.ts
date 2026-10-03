export type Role = 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN';

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
  onboardingCompleted: boolean;
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
  generationSource?: string;
  reviewScore?: number;
  reviewAttempts?: number;
  hintsUsed?: number;
  id: string;
  ticketKey: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
  ticketType: TicketType;
  priority: TicketPriority;
  estimatedHours: number;
  orderIndex: number;
  isAiGenerated?: boolean;
  difficultyLevel?: string;
  targetUserId?: string;
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

export interface SuperAdminStats {
  totalUsers: number;
  totalStudents: number;
  totalAdmins: number;
  totalCompanies: number;
  totalProjects: number;
  totalEnrollments: number;
  totalAiTicketsGenerated: number;
}

export interface SuperAdminUserItem {
  userId: string;
  email: string;
  role: Role;
  createdAt: string;
  name: string;
  collegeName?: string;
  experienceLevel: string;
  enrollmentId?: string;
  assignedProjectId?: string;
  assignedProjectName?: string;
  assignedCompanyId?: string;
  assignedCompanyName?: string;
  enrollmentStatus: string;
  completedTicketsCount: number;
  totalTicketsCount: number;
  hasPersonalizedAiTickets: boolean;
}

export interface AssignProjectPayload {
  projectId: string;
  autoGenerateAiTasks?: boolean;
  difficultyLevel?: string;
  focusArea?: string;
}

export interface GenerateAiTasksPayload {
  userId: string;
  projectId: string;
  difficultyLevel?: string;
  focusArea?: string;
  taskCount?: number;
}

export interface CreateManualTicketPayload {
  projectId: string;
  targetUserId?: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
  ticketType?: TicketType;
  priority?: TicketPriority;
  estimatedHours?: number;
}
