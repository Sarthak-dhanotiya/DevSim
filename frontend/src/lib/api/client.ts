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
} from '../types';

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
      'Content-Type': 'application/json',
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
      const errorMessage =
        data?.message || (data?.details ? data.details.join(', ') : 'Network request failed');
      throw new Error(errorMessage);
    }

    return data;
  }

  // --- AUTH ---
  async register(body: { name: string; email: string; password?: string }) {
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
}

export const api = new ApiClient();
