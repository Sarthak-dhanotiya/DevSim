import {
  ApiResponse,
  CareerTrack,
  Enrollment,
  Project,
  StudentProfile,
  VirtualCompany,
  ProjectTicket,
  WorkspaceData,
  TicketStatus,
  AiChatMessage,
  SuperAdminStats,
  SuperAdminUserItem,
  AssignProjectPayload,
  GenerateAiTasksPayload,
  CreateManualTicketPayload,
  Role,
} from '../types';
import type { JourneyState, AssignmentRequest, Evidence } from '../journey';

function getBaseUrl(): string {
  let url = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1').trim();
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  if (!url.endsWith('/api/v1')) {
    url = `${url}/api/v1`;
  }
  return url;
}

const API_BASE_URL = getBaseUrl();

class ApiClient {
  async getEmailVerification(){return this.request<{verified:boolean}>('/journey/email');}
  async sendEmailVerification(){return this.request<{message:string}>('/journey/email/send',{method:'POST'});}
  async verifyEmail(code:string){return this.request<{verified:boolean}>('/journey/email/verify',{method:'POST',body:JSON.stringify({code})});}
  async skipAssessment(){return this.request<JourneyState>('/journey/assessment/skip',{method:'POST'});}
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('vc_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      if(response.status===404 && endpoint.startsWith('/journey/email')) {
        throw new Error('Your local backend is an older version. In the PowerShell terminal containing your AI keys, run: powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1 -Build -RestartBackend. Wait for backend startup, then click Retry.');
      }
      const errorMessage =
        data?.message || (data?.details ? data.details.join(', ') : 'Network request failed');
      throw new Error(errorMessage);
    }

    return data;
  }

  // --- AUTH ---
  async getJourney() { return this.request<JourneyState>('/journey'); }
  async saveJourney(body: { skills: string[]; goal: string; weeklyHours: number; careerTrackId: string; experienceLevel: string; assignmentMode: string; projectId?: string; requestNote?: string }) {
    return this.request<JourneyState>('/journey', { method: 'PUT', body: JSON.stringify(body) });
  }
  async uploadResume(file: File) {
    const body = new FormData(); body.append('file', file);
    return this.request<{ fileName: string; skills: string[]; summary: string; parser: string; warning: string }>('/journey/resume', { method: 'POST', body });
  }
  async assessJourney(answers: number[], solution: string) {
    return this.request<{ score: number; level: string; feedback: string }>('/journey/assessment', { method: 'POST', body: JSON.stringify({ answers, solution }) });
  }
  async completeJourney(projectId: string) { return this.request<JourneyState>('/journey/complete', { method: 'POST', body: JSON.stringify({ projectId }) }); }
  async getAssignmentRequests() { return this.request<AssignmentRequest[]>('/super-admin/assignment-requests'); }
  async reviewAssignment(userId: string, body: { projectId: string; approve: boolean; note: string }) { return this.request<JourneyState>(`/super-admin/assignment-requests/${userId}/review`, { method: 'POST', body: JSON.stringify(body) }); }
  async nextSprint() { return this.request<{ difficulty: string; reason: string }>('/journey/next-sprint', { method: 'POST' }); }
  async getEvidence() { return this.request<Evidence>('/journey/evidence'); }
  async getTicketHint(enrollmentId: string, ticketId: string) { return this.request<{ hint: string; hintsUsed: number }>(`/enrollments/${enrollmentId}/tickets/${ticketId}/hint`, { method: 'POST' }); }
  async register(body: { name: string; email: string; password: string }) {
    return this.request<{
      token: string;
      tokenType: string;
      userId: string;
      email: string;
      role: string;
      profile: StudentProfile;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async forgotPassword(email: string) {
    return this.request<void>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(body: { email: string; otp: string; newPassword: string }) {
    return this.request<void>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async login(body: { email: string; password: string }) {
    return this.request<{
      token: string;
      tokenType: string;
      userId: string;
      email: string;
      role: string;
      profile: StudentProfile;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getCurrentUser() {
    return this.request<{
      userId: string;
      email: string;
      role: string;
      profile: StudentProfile;
    }>('/auth/me');
  }

  // --- PROFILE ---
  async getProfile() {
    return this.request<StudentProfile>('/profile');
  }

  async updateProfile(profileData: Partial<{
    name: string;
    collegeName: string;
    graduationYear: number;
    currentYear: string;
    experienceLevel: string;
    bio: string;
    githubUrl: string;
    linkedinUrl: string;
    selectedCareerTrackId: string;
  }>) {
    return this.request<StudentProfile>('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // --- CAREER TRACKS ---
  async getCareerTracks(activeOnly: boolean = true) {
    return this.request<CareerTrack[]>(`/career-tracks?activeOnly=${activeOnly}`);
  }

  async getCareerTrackBySlug(slug: string) {
    return this.request<CareerTrack>(`/career-tracks/${slug}`);
  }

  // --- COMPANIES ---
  async getCompanies(activeOnly: boolean = true) {
    return this.request<VirtualCompany[]>(`/companies?activeOnly=${activeOnly}`);
  }

  async getCompanyBySlug(slug: string) {
    return this.request<VirtualCompany>(`/companies/${slug}`);
  }

  // --- PROJECTS ---
  async getProjects(filters?: { companyId?: string; trackId?: string }) {
    const params = new URLSearchParams();
    if (filters?.companyId) params.append('companyId', filters.companyId);
    if (filters?.trackId) params.append('trackId', filters.trackId);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<Project[]>(`/projects${queryString}`);
  }

  async getProjectBySlug(slug: string) {
    return this.request<Project>(`/projects/${slug}`);
  }

  // --- ENROLLMENTS ---
  async enrollInProject(projectId: string) {
    return this.request<Enrollment>('/enrollments', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    });
  }

  async getCurrentEnrollment() {
    return this.request<Enrollment | null>('/enrollments/current');
  }

  async getEnrollmentHistory() {
    return this.request<Enrollment[]>('/enrollments');
  }

  // --- WORKSPACE & TICKETS (PHASE 2) ---
  async getProjectTickets(projectId: string) {
    return this.request<ProjectTicket[]>(`/projects/${projectId}/tickets`);
  }

  async getWorkspace(enrollmentId: string) {
    return this.request<WorkspaceData>(`/enrollments/${enrollmentId}/workspace`);
  }

  async updateTicketStatus(
    enrollmentId: string,
    ticketId: string,
    body: { status: TicketStatus; submissionNotes?: string }
  ) {
    return this.request<ProjectTicket>(
      `/enrollments/${enrollmentId}/tickets/${ticketId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      }
    );
  }

  async chatWithTechLead(body: { ticketId?: string; message: string }) {
    return this.request<AiChatMessage>('/workspace/ai-chat', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // --- SUPER ADMIN & DYNAMIC AI TASKS ---
  async getSuperAdminStats() {
    return this.request<SuperAdminStats>('/super-admin/stats');
  }

  async getSuperAdminUsers() {
    return this.request<SuperAdminUserItem[]>('/super-admin/users');
  }

  async assignUserProject(userId: string, body: AssignProjectPayload) {
    return this.request<SuperAdminUserItem>(`/super-admin/users/${userId}/assign-project`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async updateUserRole(userId: string, role: Role) {
    return this.request<SuperAdminUserItem>(`/super-admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async generateAiTasks(body: GenerateAiTasksPayload) {
    return this.request<ProjectTicket[]>('/super-admin/tickets/generate-ai', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getUserTickets(userId: string) {
    return this.request<ProjectTicket[]>(`/super-admin/users/${userId}/tickets`);
  }

  async createCustomTicket(body: CreateManualTicketPayload) {
    return this.request<ProjectTicket>('/super-admin/tickets', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async deleteTicket(ticketId: string) {
    return this.request<void>(`/super-admin/tickets/${ticketId}`, {
      method: 'DELETE',
    });
  }

  async createCompany(body: {
    name: string;
    slug: string;
    description: string;
    industry: string;
    companySize: string;
    logoUrl?: string;
  }) {
    return this.request<VirtualCompany>('/admin/companies', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async createProject(body: {
    githubTemplateRepo?:string;
    githubRepoMode?:string;
    companyId?: string;
    careerTrackId: string;
    name: string;
    slug: string;
    shortDescription: string;
    description: string;
    difficulty: string;
    estimatedDuration: string;
    technologyNames?: string[];
  }) {
    return this.request<Project>('/admin/projects', {
      method: 'POST',
      body: JSON.stringify({ ...body, technologies: body.technologyNames }),
    });
  }
}

export const api = new ApiClient();
