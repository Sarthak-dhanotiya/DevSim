'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { api } from '@/lib/api/client';
import {
  SuperAdminStats,
  SuperAdminUserItem,
  VirtualCompany,
  Project,
  CareerTrack,
  ProjectTicket,
  Role,
} from '@/lib/types';
import { AssignmentRequests } from '@/components/common/AssignmentRequests';
import { Button } from '@/components/ui/Button';
import {
  ShieldCheck,
  Users,
  Building2,
  Briefcase,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  X,
  Sliders,
  ChevronRight,
  UserCheck,
  Cpu,
  Layers,
  ArrowRight,
  Award,
} from 'lucide-react';

export default function SuperAdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Data states
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [usersList, setUsersList] = useState<SuperAdminUserItem[]>([]);
  const [companies, setCompanies] = useState<VirtualCompany[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [careerTracks, setCareerTracks] = useState<CareerTrack[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'users' | 'companies' | 'ai-studio'>('users');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN'>('ALL');

  // Modals state
  const [assignModalUser, setAssignModalUser] = useState<SuperAdminUserItem | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [autoGenAi, setAutoGenAi] = useState<boolean>(true);
  const [difficultyLevel, setDifficultyLevel] = useState<string>('INTERMEDIATE');
  const [focusArea, setFocusArea] = useState<string>('Core REST APIs & Persistence');
  const [submittingAssign, setSubmittingAssign] = useState<boolean>(false);

  // AI Task Generation Modal
  const [aiGenModalUser, setAiGenModalUser] = useState<SuperAdminUserItem | null>(null);
  const [aiGenProjectId, setAiGenProjectId] = useState<string>('');
  const [aiGenDifficulty, setAiGenDifficulty] = useState<string>('INTERMEDIATE');
  const [aiGenFocus, setAiGenFocus] = useState<string>('Core REST APIs & Database');
  const [aiGenCount, setAiGenCount] = useState<number>(4);
  const [generatingAiTasks, setGeneratingAiTasks] = useState<boolean>(false);
  const [aiGeneratedResults, setAiGeneratedResults] = useState<ProjectTicket[] | null>(null);

  // View User Tickets Modal
  const [viewTicketsUser, setViewTicketsUser] = useState<SuperAdminUserItem | null>(null);
  const [userTickets, setUserTickets] = useState<ProjectTicket[]>([]);
  const [loadingUserTickets, setLoadingUserTickets] = useState<boolean>(false);

  // Create Company Form
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanySlug, setNewCompanySlug] = useState('');
  const [newCompanyIndustry, setNewCompanyIndustry] = useState('FinTech');
  const [newCompanySize, setNewCompanySize] = useState('50-200 employees');
  const [newCompanyDesc, setNewCompanyDesc] = useState('');
  const [submittingCompany, setSubmittingCompany] = useState(false);

  // Create Project Form
  const [newProjCompanyId, setNewProjCompanyId] = useState('');
  const [newProjTrackId, setNewProjTrackId] = useState('');
  const [newProjName, setNewProjName] = useState('');
  const [newProjGithubTemplate,setNewProjGithubTemplate]=useState('');
  const [newProjGithubMode,setNewProjGithubMode]=useState('TEMPLATE');
  const [newProjSlug, setNewProjSlug] = useState('');
  const [newProjDifficulty, setNewProjDifficulty] = useState('INTERMEDIATE');
  const [newProjDuration, setNewProjDuration] = useState('4 weeks');
  const [newProjShortDesc, setNewProjShortDesc] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjTechs, setNewProjTechs] = useState('Java 21, Spring Boot 3, PostgreSQL, Redis');
  const [submittingProject, setSubmittingProject] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [statsRes, usersRes, companiesRes, projectsRes, tracksRes] = await Promise.all([
        api.getSuperAdminStats().catch(() => null),
        api.getSuperAdminUsers().catch(() => null),
        api.getCompanies(false).catch(() => null),
        api.getProjects().catch(() => null),
        api.getCareerTracks(false).catch(() => null),
      ]);

      if (statsRes?.data) setStats(statsRes.data);
      if (usersRes?.data) setUsersList(usersRes.data);
      if (companiesRes?.data) setCompanies(companiesRes.data);
      if (projectsRes?.data) setProjects(projectsRes.data);
      if (tracksRes?.data) setCareerTracks(tracksRes.data);
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      setMessage({ type: 'error', text: 'Failed to fetch admin data: ' + err.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
        // Not authorized
        router.push('/');
        return;
      }
      fetchData();
    }
  }, [user, authLoading]);

  // Handle Project Assignment
  const handleAssignProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalUser || !selectedProjectId) return;

    try {
      setSubmittingAssign(true);
      await api.assignUserProject(assignModalUser.userId, {
        projectId: selectedProjectId,
        autoGenerateAiTasks: autoGenAi,
        difficultyLevel,
        focusArea,
      });

      setMessage({
        type: 'success',
        text: `Successfully assigned project to ${assignModalUser.name}${
          autoGenAi ? ' with personalized AI sprint tasks!' : '!'
        }`,
      });
      setAssignModalUser(null);
      await fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Assignment failed' });
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Handle Role Promotion/Demotion
  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      await api.updateUserRole(userId, newRole);
      setMessage({ type: 'success', text: `Role updated to ${newRole} successfully!` });
      await fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Role update failed' });
    }
  };

  // Handle Direct AI Task Generation
  const handleGenerateAiTasks = async () => {
    if (!aiGenModalUser || !aiGenProjectId) return;

    try {
      setGeneratingAiTasks(true);
      setAiGeneratedResults(null);
      const res = await api.generateAiTasks({
        userId: aiGenModalUser.userId,
        projectId: aiGenProjectId,
        difficultyLevel: aiGenDifficulty,
        focusArea: aiGenFocus,
        taskCount: aiGenCount,
      });

      if (res.data) {
        setAiGeneratedResults(res.data);
        setMessage({
          type: 'success',
          text: `Generated ${res.data.length} dynamic AI sprint tasks for ${aiGenModalUser.name}!`,
        });
        await fetchData();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'AI task generation failed' });
    } finally {
      setGeneratingAiTasks(false);
    }
  };

  // Handle View Tickets
  const handleOpenUserTickets = async (userItem: SuperAdminUserItem) => {
    setViewTicketsUser(userItem);
    try {
      setLoadingUserTickets(true);
      const res = await api.getUserTickets(userItem.userId);
      setUserTickets(res.data || []);
    } catch (err: any) {
      console.error('Error fetching user tickets:', err);
    } finally {
      setLoadingUserTickets(false);
    }
  };

  // Handle Delete Ticket
  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    try {
      await api.deleteTicket(ticketId);
      setUserTickets((prev) => prev.filter((t) => t.id !== ticketId));
      setMessage({ type: 'success', text: 'Ticket deleted successfully.' });
      await fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete ticket' });
    }
  };

  // Handle Create Company
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingCompany(true);
      await api.createCompany({
        name: newCompanyName,
        slug: newCompanySlug.toLowerCase().replace(/\s+/g, '-'),
        industry: newCompanyIndustry,
        companySize: newCompanySize,
        description: newCompanyDesc,
      });
      setMessage({ type: 'success', text: `Company "${newCompanyName}" created successfully!` });
      setNewCompanyName('');
      setNewCompanySlug('');
      setNewCompanyDesc('');
      await fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create company' });
    } finally {
      setSubmittingCompany(false);
    }
  };

  // Handle Create Project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingProject(true);
      const techs = newProjTechs.split(',').map((t) => t.trim()).filter(Boolean);
      await api.createProject({
        githubTemplateRepo:newProjGithubTemplate.trim(),
        githubRepoMode:newProjGithubMode,
        companyId: newProjCompanyId || undefined,
        careerTrackId: newProjTrackId,
        name: newProjName,
        slug: newProjSlug.toLowerCase().replace(/\s+/g, '-'),
        difficulty: newProjDifficulty,
        estimatedDuration: newProjDuration,
        shortDescription: newProjShortDesc,
        description: newProjDesc,
        technologyNames: techs,
      });
      setMessage({ type: 'success', text: `Project "${newProjName}" created successfully!` });
      setNewProjName('');
      setNewProjSlug('');
      setNewProjShortDesc('');
      setNewProjDesc('');
      await fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create project' });
    } finally {
      setSubmittingProject(false);
    }
  };

  // Filtered Users
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.collegeName && u.collegeName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.assignedProjectName && u.assignedProjectName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (authLoading || (loading && !stats)) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center animate-pulse mb-4">
          <ShieldCheck className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
        <p className="text-sm font-medium">Verifying Super Admin Authorization...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 selection:bg-indigo-500 selection:text-white">
      {/* Glow Effects */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Banner / Breadcrumb */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Super Admin Control Center
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Platform Owner
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage virtual companies, control user enrollments, and orchestrate dynamic AI sprint tasks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-xs font-medium text-slate-300 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>
            <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live AI Engine Online
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Global Alert Messages */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-center justify-between transition-all ${
              message.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-red-950/40 border-red-500/40 text-red-200'
            }`}
          >
            <div className="flex items-center gap-3 text-sm font-medium">
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="text-slate-400 hover:text-white p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 4 Primary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">Total Users</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {stats?.totalUsers || 0}
            </div>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
              <span className="text-indigo-400 font-medium">{stats?.totalStudents || 0} Students</span>
              <span>•</span>
              <span className="text-purple-400 font-medium">{stats?.totalAdmins || 0} Admins</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">Virtual Companies</span>
              <Building2 className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {stats?.totalCompanies || companies.length}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Simulated corporate environments
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">Active Projects</span>
              <Briefcase className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {stats?.totalProjects || projects.length}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              {stats?.totalEnrollments || 0} total enrollments active
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 to-purple-950/40 border border-indigo-500/30 hover:border-indigo-400 transition-all shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-indigo-300">Dynamic AI Tasks</span>
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 tracking-tight">
              {stats?.totalAiTicketsGenerated || 0}
            </div>
            <div className="mt-1 text-[11px] text-indigo-200/80">
              Personalized tickets created by AI
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center space-x-2 border-b border-slate-800 mb-6 pb-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users & Dynamic Assignments</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/30">
              {usersList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('companies')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'companies'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Company & Project Hub</span>
          </button>

          <button
            onClick={() => setActiveTab('ai-studio')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'ai-studio'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>AI Sprint Task Studio</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: USERS & DYNAMIC ASSIGNMENT                                         */}
        {/* ========================================================================= */}
        {user?.role === 'SUPER_ADMIN' && <AssignmentRequests projects={projects} onReviewed={fetchData} />}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search students, emails, colleges..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  Role:
                </span>
                {(['ALL', 'STUDENT', 'ADMIN', 'SUPER_ADMIN'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      roleFilter === r
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        : 'text-slate-400 hover:text-white bg-slate-800/40'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Student / User</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Assigned Company & Project</th>
                      <th className="py-3 px-4">Sprint Progress</th>
                      <th className="py-3 px-4">Task Mode</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-500">
                          No users match your search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((item) => (
                        <tr
                          key={item.userId}
                          className="hover:bg-slate-800/40 transition-colors group"
                        >
                          {/* User info */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-200 text-sm">{item.name}</div>
                            <div className="text-slate-400 text-xs">{item.email}</div>
                            {item.collegeName && (
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                🎓 {item.collegeName} ({item.experienceLevel})
                              </div>
                            )}
                          </td>

                          {/* Role with quick switcher */}
                          <td className="py-3.5 px-4">
                            <select
                              value={item.role}
                              onChange={(e) => handleRoleChange(item.userId, e.target.value as Role)}
                              className={`px-2 py-1 rounded-md text-xs font-semibold focus:outline-none border ${
                                item.role === 'SUPER_ADMIN'
                                  ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                                  : item.role === 'ADMIN'
                                  ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              <option value="STUDENT">STUDENT</option>
                              <option value="ADMIN">ADMIN</option>
                              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                            </select>
                          </td>

                          {/* Assigned Project */}
                          <td className="py-3.5 px-4">
                            {item.assignedProjectName ? (
                              <div>
                                <div className="font-medium text-slate-200 flex items-center gap-1.5">
                                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                                  <span>{item.assignedCompanyName || 'Company'}</span>
                                </div>
                                <div className="text-slate-400 text-xs mt-0.5">
                                  {item.assignedProjectName}
                                </div>
                              </div>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                Not Assigned
                              </span>
                            )}
                          </td>

                          {/* Progress */}
                          <td className="py-3.5 px-4">
                            {item.assignedProjectName ? (
                              <div className="w-32">
                                <div className="flex justify-between text-[11px] mb-1">
                                  <span className="text-slate-400">
                                    {item.completedTicketsCount} / {item.totalTicketsCount} Done
                                  </span>
                                  <span className="text-indigo-400 font-mono">
                                    {item.totalTicketsCount > 0
                                      ? Math.round(
                                          (item.completedTicketsCount / item.totalTicketsCount) * 100
                                        )
                                      : 0}
                                    %
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
                                    style={{
                                      width: `${
                                        item.totalTicketsCount > 0
                                          ? (item.completedTicketsCount / item.totalTicketsCount) * 100
                                          : 0
                                      }%`,
                                    }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-xs">—</span>
                            )}
                          </td>

                          {/* Task Mode: AI Personalized vs Standard */}
                          <td className="py-3.5 px-4">
                            {item.hasPersonalizedAiTickets ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/40">
                                <Sparkles className="w-3 h-3 text-indigo-400" />
                                Dynamic AI Active
                              </span>
                            ) : item.assignedProjectName ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                                Default Static Pool
                              </span>
                            ) : (
                              <span className="text-slate-500 text-xs">—</span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Generate Dynamic AI Tasks */}
                              <button
                                onClick={() => {
                                  setAiGenModalUser(item);
                                  setAiGenProjectId(item.assignedProjectId || (projects[0]?.id ?? ''));
                                  setAiGeneratedResults(null);
                                }}
                                title="Generate Personalized AI Tasks for this user"
                                className="p-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 transition-all text-xs flex items-center gap-1"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                <span className="hidden sm:inline">AI Tasks</span>
                              </button>

                              {/* Assign / Change Project */}
                              <button
                                onClick={() => {
                                  setAssignModalUser(item);
                                  setSelectedProjectId(item.assignedProjectId || (projects[0]?.id ?? ''));
                                }}
                                title="Assign or switch project"
                                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all text-xs flex items-center gap-1"
                              >
                                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                <span className="hidden sm:inline">Assign</span>
                              </button>

                              {/* View Assigned Tickets */}
                              <button
                                onClick={() => handleOpenUserTickets(item)}
                                title="View User Tickets"
                                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all text-xs"
                              >
                                <Layers className="w-3.5 h-3.5 text-slate-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: COMPANIES & PROJECTS HUB                                          */}
        {/* ========================================================================= */}
        {activeTab === 'companies' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Virtual Company */}
            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white">Create Virtual Company</h2>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Spin up a simulated tech enterprise (e.g. QuickKart, RazorPay, FinFlow) where students will be hired.
              </p>

              <form onSubmit={handleCreateCompany} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CloudScale Systems"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Slug</label>
                    <input
                      type="text"
                      required
                      placeholder="cloudscale-systems"
                      value={newCompanySlug}
                      onChange={(e) => setNewCompanySlug(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Industry</label>
                    <select
                      value={newCompanyIndustry}
                      onChange={(e) => setNewCompanyIndustry(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="FinTech">FinTech & Payments</option>
                      <option value="E-Commerce">E-Commerce</option>
                      <option value="HealthTech">HealthTech</option>
                      <option value="SaaS & Cloud">SaaS & Cloud Infrastructure</option>
                      <option value="AI & Robotics">AI & Big Data</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Company Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 50-200 employees (Series B)"
                    value={newCompanySize}
                    onChange={(e) => setNewCompanySize(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe the company's domain, scale, and software architecture..."
                    value={newCompanyDesc}
                    onChange={(e) => setNewCompanyDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <Button
                  type="submit"
                  loading={submittingCompany}
                  variant="primary"
                  size="sm"
                  className="w-full bg-indigo-600 hover:bg-indigo-500"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Virtual Company
                </Button>
              </form>
            </div>

            {/* Create Project for Company */}
            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white">Create Project & Tech Stack</h2>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Create a standalone project or optionally attach a company. Include business requirements and milestones in the brief.
              </p>

              <form onSubmit={handleCreateProject} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Company</label>
                    <select
                      value={newProjCompanyId}
                      onChange={(e) => setNewProjCompanyId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Independent project (no company)</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.industry})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Career Track</label>
                    <select
                      required
                      value={newProjTrackId}
                      onChange={(e) => setNewProjTrackId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select Track...</option>
                      {careerTracks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Project Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Distributed Ledger Service"
                      value={newProjName}
                      onChange={(e) => setNewProjName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Slug</label>
                    <input
                      type="text"
                      required
                      placeholder="ledger-service"
                      value={newProjSlug}
                      onChange={(e) => setNewProjSlug(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Difficulty</label>
                    <select
                      value={newProjDifficulty}
                      onChange={(e) => setNewProjDifficulty(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="BEGINNER">Beginner (Intern)</option>
                      <option value="INTERMEDIATE">Intermediate (SDE-1)</option>
                      <option value="ADVANCED">Advanced (SDE-2 / Senior)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Duration</label>
                    <input
                      type="text"
                      placeholder="4 weeks"
                      value={newProjDuration}
                      onChange={(e) => setNewProjDuration(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Technologies (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Java 21, Spring Boot 3, PostgreSQL, Redis, Kafka"
                    value={newProjTechs}
                    onChange={(e) => setNewProjTechs(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Short Description</label>
                  <div className="my-4 space-y-2"><label className="block text-xs text-slate-300">GitHub starter repository (optional)</label><input value={newProjGithubTemplate} onChange={e=>setNewProjGithubTemplate(e.target.value)} placeholder="owner/repository" pattern="[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+" className="w-full rounded-lg bg-slate-900 border border-slate-700 p-3 text-white text-sm"/><select value={newProjGithubMode} onChange={e=>setNewProjGithubMode(e.target.value)} className="rounded-lg bg-slate-900 border border-slate-700 p-2 text-white text-sm"><option value="TEMPLATE">Generate from template</option><option value="FORK">Fork public repository</option></select><p className="text-xs text-slate-400">Leave empty to use the server default or a README starter. Template mode requires a GitHub template repository.</p></div>
                  <input
                    type="text"
                    required
                    placeholder="Brief 1-line mission of this service..."
                    value={newProjShortDesc}
                    onChange={(e) => setNewProjShortDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Description</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Deep architectural context, engineering scope, and deliverables..."
                    value={newProjDesc}
                    onChange={(e) => setNewProjDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <Button
                  type="submit"
                  loading={submittingProject}
                  variant="primary"
                  size="sm"
                  className="w-full bg-cyan-600 hover:bg-cyan-500"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Project
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: AI SPRINT TASK STUDIO                                             */}
        {/* ========================================================================= */}
        {activeTab === 'ai-studio' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-gradient-to-br from-slate-900 via-indigo-950/20 to-purple-950/20 border border-indigo-500/30 shadow-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Dynamic AI Task Orchestrator
                  </h2>
                  <p className="text-xs text-slate-400">
                    Generate unique, non-identical Jira sprint tickets tailored to any student's skill level and company context.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Student</label>
                  <select
                    value={aiGenModalUser?.userId || ''}
                    onChange={(e) => {
                      const found = usersList.find((u) => u.userId === e.target.value);
                      setAiGenModalUser(found || null);
                      if (found?.assignedProjectId) setAiGenProjectId(found.assignedProjectId);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select a student...</option>
                    {usersList.map((u) => (
                      <option key={u.userId} value={u.userId}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Project & Company</label>
                  <select
                    value={aiGenProjectId}
                    onChange={(e) => setAiGenProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select project...</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.company?.name || 'Company'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Sprint Difficulty</label>
                  <select
                    value={aiGenDifficulty}
                    onChange={(e) => setAiGenDifficulty(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="BEGINNER">Junior / Intern (CRUD & Validation)</option>
                    <option value="INTERMEDIATE">Mid-Level (Redis, Idempotency, JWT)</option>
                    <option value="ADVANCED">Senior (Concurrency Locks, Memory Leaks)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Focus Area</label>
                  <select
                    value={aiGenFocus}
                    onChange={(e) => setAiGenFocus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Core REST APIs & Database">Core REST APIs & Database</option>
                    <option value="Security, Auth & RBAC">Security, Auth & RBAC</option>
                    <option value="Caching & Performance Optimization">Caching & Performance Optimization</option>
                    <option value="High Concurrency & Bug Fixes">High Concurrency & Bug Fixes</option>
                    <option value="Idempotent Webhooks & External Gateways">Idempotent Webhooks & External Gateways</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">Tickets count:</span>
                  {[2, 3, 4, 5].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setAiGenCount(cnt)}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                        aiGenCount === cnt
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cnt} Tickets
                    </button>
                  ))}
                </div>

                <Button
                  onClick={handleGenerateAiTasks}
                  disabled={!aiGenModalUser || !aiGenProjectId}
                  loading={generatingAiTasks}
                  variant="primary"
                  size="md"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/20"
                >
                  <Sparkles className="w-4 h-4 mr-2 text-amber-300" />
                  {generatingAiTasks ? 'Gemini Generating Tickets...' : 'Generate Dynamic Sprint Tickets'}
                </Button>
              </div>
            </div>

            {/* Generated Results Preview */}
            {aiGeneratedResults && aiGeneratedResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Live Generated Tickets for {aiGenModalUser?.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                      Bound to Workspace
                    </span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiGeneratedResults.map((t) => (
                    <div
                      key={t.id}
                      className="p-5 rounded-xl bg-slate-900/80 border border-indigo-500/30 shadow-md relative group hover:border-indigo-400 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {t.ticketKey}
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {t.ticketType}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            t.priority === 'CRITICAL'
                              ? 'bg-red-500/20 text-red-300'
                              : t.priority === 'HIGH'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white mb-2">{t.title}</h4>
                      <p className="text-xs text-slate-400 mb-3 line-clamp-3">{t.description}</p>

                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                        <span className="font-semibold text-slate-400 block mb-1">
                          Acceptance Criteria:
                        </span>
                        <pre className="whitespace-pre-wrap font-sans text-slate-300">
                          {t.acceptanceCriteria}
                        </pre>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Est: {t.estimatedHours} hrs</span>
                        <span className="text-indigo-400 flex items-center gap-1 font-mono">
                          <Sparkles className="w-3 h-3" />
                          AI Personalized
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: ASSIGN PROJECT TO USER                                           */}
      {/* ========================================================================= */}
      {assignModalUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative">
            <button
              onClick={() => setAssignModalUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Assign Project to User</h3>
                <p className="text-xs text-slate-400">
                  Assigning to <span className="text-indigo-300 font-semibold">{assignModalUser.name}</span> ({assignModalUser.email})
                </p>
              </div>
            </div>

            <form onSubmit={handleAssignProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Select Project</label>
                <select
                  required
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Choose a company project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.company?.name || 'Company'} — {p.name} ({p.difficulty})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic AI Task Generation Toggle */}
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoGenAi}
                    onChange={(e) => setAutoGenAi(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                  />
                  <span className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Auto-Generate Dynamic AI Tasks for this Student
                  </span>
                </label>
                <p className="text-[11px] text-slate-400 ml-6">
                  Instead of giving static tickets, AI will tailor 4 custom tickets specifically to this student so no two students have the exact same problem!
                </p>

                {autoGenAi && (
                  <div className="grid grid-cols-2 gap-3 pt-2 ml-6">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Difficulty</label>
                      <select
                        value={difficultyLevel}
                        onChange={(e) => setDifficultyLevel(e.target.value)}
                        className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none"
                      >
                        <option value="BEGINNER">Junior (Intern)</option>
                        <option value="INTERMEDIATE">Mid-Level (SDE-1)</option>
                        <option value="ADVANCED">Senior (SDE-2)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Focus</label>
                      <select
                        value={focusArea}
                        onChange={(e) => setFocusArea(e.target.value)}
                        className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none"
                      >
                        <option value="Core REST APIs & Persistence">REST & Database</option>
                        <option value="Security, Auth & RBAC">Security & Auth</option>
                        <option value="Caching & Performance Optimization">Redis Caching</option>
                        <option value="High Concurrency & Bug Fixes">Concurrency & Bug Fix</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAssignModalUser(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={submittingAssign}
                  variant="primary"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-500"
                >
                  Confirm & Assign
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: VIEW USER TICKETS                                                */}
      {/* ========================================================================= */}
      {viewTicketsUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative">
            <button
              onClick={() => setViewTicketsUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Personalized Tickets for {viewTicketsUser.name}
                </h3>
                <p className="text-xs text-slate-400">{viewTicketsUser.email}</p>
              </div>
            </div>

            {loadingUserTickets ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading tickets...</div>
            ) : userTickets.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No personalized tickets found for this student. They are currently using the default company project ticket pool.
              </div>
            ) : (
              <div className="space-y-3">
                {userTickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-indigo-400">
                          {t.ticketKey}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                          {t.ticketType}
                        </span>
                        {t.isAiGenerated && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> AI
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-white">{t.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{t.description}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteTicket(t.id)}
                      title="Delete ticket"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setViewTicketsUser(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
