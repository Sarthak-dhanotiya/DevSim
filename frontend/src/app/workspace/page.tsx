'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/Button';
import { Badge, DifficultyBadge, PriorityBadge } from '@/components/ui/Badge';
import { api } from '@/lib/api/client';
import {
  Enrollment,
  ProjectTicket,
  WorkspaceData,
  TicketStatus,
  AiChatMessage,
} from '@/lib/types';
import {
  Briefcase,
  GitBranch,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  X,
  AlertCircle,
  FileCode,
  Layers,
  ChevronRight,
  Terminal,
} from 'lucide-react';

export default function WorkspacePage() {
  return (
    <AuthGuard>
      <WorkspaceContent />
    </AuthGuard>
  );
}

const COLUMNS: { id: TicketStatus; label: string; countColor: string }[] = [
  { id: 'TODO', label: 'To Do', countColor: 'text-slate-500 bg-slate-100 dark:bg-slate-800' },
  { id: 'IN_PROGRESS', label: 'In Progress', countColor: 'text-blue-700 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-300' },
  { id: 'IN_REVIEW', label: 'In Review', countColor: 'text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300' },
  { id: 'DONE', label: 'Done', countColor: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300' },
];

function WorkspaceContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [currentEnrollment, setCurrentEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<ProjectTicket | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [copiedBranch, setCopiedBranch] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // AI Tech Lead Chat Drawer State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatTicketId, setChatTicketId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<
    { sender: 'user' | 'lead'; name: string; text: string; time: string }[]
  >([
    {
      sender: 'lead',
      name: 'Alex Mitchell (Tech Lead)',
      text: "Hey! I'm Alex, your Tech Lead for this project. If you have questions about Java, Spring Boot architecture, unit testing, or specific tickets, ask me here.",
      time: 'Just now',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    loadWorkspace();
  }, []);

  async function loadWorkspace() {
    try {
      setLoading(true);
      const enrollmentRes = await api.getCurrentEnrollment();
      const enrollment = enrollmentRes.data;

      if (!enrollment) {
        setLoading(false);
        return;
      }

      setCurrentEnrollment(enrollment);
      const wsRes = await api.getWorkspace(enrollment.id);
      setWorkspace(wsRes.data);
    } catch (err) {
      console.error('Failed to load workspace:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(ticket: ProjectTicket, newStatus: TicketStatus) {
    if (!workspace) return;
    try {
      setIsUpdatingStatus(true);
      const res = await api.updateTicketStatus(workspace.enrollmentId, ticket.id, {
        status: newStatus,
        submissionNotes: submissionNotes || ticket.submissionNotes || undefined,
      });

      // Update state locally
      const updatedTickets = workspace.tickets.map((t) =>
        t.id === ticket.id ? res.data : t
      );

      const completed = updatedTickets.filter((t) => t.status === 'DONE').length;
      const total = updatedTickets.length;
      const progress = Math.round((completed / total) * 100);

      setWorkspace({
        ...workspace,
        tickets: updatedTickets,
        completedTickets: completed,
        progressPercentage: progress,
      });

      setSelectedTicket(res.data);
    } catch (err) {
      console.error('Failed to update ticket status:', err);
      alert('Failed to update ticket status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleSendChatMessage(overrideMsg?: string) {
    const messageToSend = overrideMsg || inputMessage;
    if (!messageToSend.trim()) return;

    const userMsg = {
      sender: 'user' as const,
      name: user?.profile?.name || 'You',
      text: messageToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!overrideMsg) setInputMessage('');
    setIsSendingMessage(true);

    try {
      const res = await api.chatWithTechLead({
        ticketId: chatTicketId || selectedTicket?.id || undefined,
        message: messageToSend,
      });

      const leadMsg = {
        sender: 'lead' as const,
        name: `${res.data.senderName} (${res.data.senderRole})`,
        text: res.data.response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => [...prev, leadMsg]);
    } catch (err) {
      console.error('AI chat failed:', err);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'lead',
          name: 'Alex Mitchell (Tech Lead)',
          text: 'Sorry, I ran into a network issue reviewing that. Make sure the Spring Boot service layer and DTO tests are passing, and ask me again!',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSendingMessage(false);
    }
  }

  function copyBranchCommand(ticketKey: string) {
    const branch = `feature/${ticketKey.toLowerCase()}-${workspace?.project?.slug || 'task'}`;
    navigator.clipboard.writeText(`git checkout -b ${branch}`);
    setCopiedBranch(true);
    setTimeout(() => setCopiedBranch(false), 2000);
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 dark:border-t-white rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Loading engineering workspace...</p>
      </div>
    );
  }

  if (!workspace || !currentEnrollment) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="p-8 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 space-y-4">
          <Briefcase className="w-10 h-10 text-slate-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            No Active Project Enrolled
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            You need to enroll in a project before opening the engineering workspace. Browse available projects and pick one to begin your simulated internship.
          </p>
          <div className="pt-2">
            <Link href="/projects">
              <Button variant="primary">Browse Projects</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tickets = workspace.tickets || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. TOP WORKSPACE BAR */}
      <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mb-1">
            <span>{workspace.company?.name}</span>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-medium">{workspace.project?.name}</span>
            <span>/</span>
            <span>Sprint Board</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Engineering Workspace
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Role: <strong>Java Backend Engineer</strong> • Company: <strong>{workspace.company?.name}</strong>
          </p>
        </div>

        {/* Progress & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Progress Mini Card */}
          <div className="min-w-[180px] p-2.5 rounded border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-500">Sprint Progress</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">
                {workspace.progressPercentage}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-slate-900 dark:bg-slate-200 h-full rounded-full transition-all duration-300"
                style={{ width: `${workspace.progressPercentage}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {workspace.completedTickets} of {workspace.totalTickets} tickets done
            </div>
          </div>

          {/* AI Tech Lead Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-2 border-slate-300 dark:border-slate-700"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>AI Tech Lead (Alex)</span>
          </Button>

          <Link href="/dashboard">
            <Button variant="secondary" size="sm">
              Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. SPRINT BOARD (KANBAN) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colTickets = tickets.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className="flex flex-col rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 min-h-[500px]"
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {col.label}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${col.countColor}`}
                >
                  {colTickets.length}
                </span>
              </div>

              {/* Ticket Cards */}
              <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                {colTickets.length === 0 ? (
                  <div className="h-28 flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded">
                    No tickets
                  </div>
                ) : (
                  colTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setSubmissionNotes(ticket.submissionNotes || '');
                      }}
                      className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600 transition-colors cursor-pointer shadow-none space-y-2.5"
                    >
                      {/* Ticket Key & Priority */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-semibold text-slate-500">
                          {ticket.ticketKey}
                        </span>
                        <PriorityBadge priority={ticket.priority} />
                      </div>

                      {/* Ticket Title */}
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                        {ticket.title}
                      </h4>

                      {/* Bottom row: Type & Estimated Hours */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="capitalize">{ticket.ticketType.toLowerCase()}</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {ticket.estimatedHours}h
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. TICKET DETAIL MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {selectedTicket.ticketKey}
                </span>
                <PriorityBadge priority={selectedTicket.priority} />
                <span className="text-xs text-slate-400 capitalize">
                  {selectedTicket.ticketType.toLowerCase()}
                </span>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs sm:text-sm">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {selectedTicket.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Acceptance Criteria */}
              <div className="p-4 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                <span className="font-semibold text-xs text-slate-900 dark:text-white uppercase tracking-wider block">
                  Acceptance Criteria
                </span>
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line font-mono bg-white dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800">
                  {selectedTicket.acceptanceCriteria}
                </div>
              </div>

              {/* Git Branch Command */}
              <div className="p-3.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" /> Simulated Git Branch Command
                  </span>
                  <button
                    onClick={() => copyBranchCommand(selectedTicket.ticketKey)}
                    className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                  >
                    {copiedBranch ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Command
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-xs text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 p-2 rounded select-all">
                  git checkout -b feature/{selectedTicket.ticketKey.toLowerCase()}-{workspace.project?.slug || 'task'}
                </div>
              </div>

              {/* Submission Notes / PR Comments */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Implementation Notes / Pull Request Description
                </label>
                <textarea
                  rows={3}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Describe your solution (e.g. Created ProductController with @Validated, added GlobalExceptionHandler, wrote 4 JUnit tests)..."
                  className="w-full text-xs p-2.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
                />
              </div>

              {/* AI Tech Lead Review Feedback (if available) */}
              {selectedTicket.aiReviewFeedback && (
                <div className="p-4 rounded border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 dark:text-blue-300">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Tech Lead PR Review (Alex Mitchell)</span>
                  </div>
                  <p className="text-xs text-blue-950 dark:text-blue-200 leading-relaxed whitespace-pre-line">
                    {selectedTicket.aiReviewFeedback}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer / Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Current Status: <strong className="text-slate-900 dark:text-white">{selectedTicket.status}</strong>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedTicket.status === 'TODO' && (
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusChange(selectedTicket, 'IN_PROGRESS')}
                  >
                    Start Ticket (In Progress)
                  </Button>
                )}

                {selectedTicket.status === 'IN_PROGRESS' && (
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusChange(selectedTicket, 'IN_REVIEW')}
                  >
                    Submit for PR Review
                  </Button>
                )}

                {selectedTicket.status === 'IN_REVIEW' && (
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusChange(selectedTicket, 'DONE')}
                  >
                    Approve & Merge (Done)
                  </Button>
                )}

                {selectedTicket.status === 'DONE' && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusChange(selectedTicket, 'IN_PROGRESS')}
                  >
                    Reopen Ticket
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setChatTicketId(selectedTicket.id);
                    setIsChatOpen(true);
                  }}
                >
                  Ask Alex About Ticket
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. AI TECH LEAD CHAT DRAWER */}
      {isChatOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold flex items-center justify-center text-xs">
                AM
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Alex Mitchell</h3>
                <p className="text-[11px] text-slate-500">Staff Engineer & Tech Lead</p>
              </div>
            </div>

            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Context Selector */}
          <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/60 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Context:</span>
            <select
              value={chatTicketId || 'GENERAL'}
              onChange={(e) => setChatTicketId(e.target.value === 'GENERAL' ? null : e.target.value)}
              className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none max-w-[260px] truncate"
            >
              <option value="GENERAL">General Engineering / Java / Spring</option>
              {tickets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.ticketKey}: {t.title.slice(0, 28)}...
                </option>
              ))}
            </select>
          </div>

          {/* Quick Prompt Suggestion Chips */}
          <div className="p-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex gap-1.5 overflow-x-auto text-[11px]">
            <button
              onClick={() => handleSendChatMessage('What is Java?')}
              className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 whitespace-nowrap hover:border-slate-400"
            >
              What is Java?
            </button>
            <button
              onClick={() => handleSendChatMessage('What is Spring Boot and why do we use it?')}
              className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 whitespace-nowrap hover:border-slate-400"
            >
              What is Spring Boot?
            </button>
            <button
              onClick={() => handleSendChatMessage('Explain 4 pillars of OOP in Java with examples')}
              className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 whitespace-nowrap hover:border-slate-400"
            >
              OOP Pillars?
            </button>
            <button
              onClick={() => handleSendChatMessage('How should I structure the controller and service layer?')}
              className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 whitespace-nowrap hover:border-slate-400"
            >
              Architecture?
            </button>
            <button
              onClick={() => handleSendChatMessage('How should I write unit tests for the service with Mockito?')}
              className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 whitespace-nowrap hover:border-slate-400"
            >
              Unit tests?
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <span className="text-[10px] text-slate-400 mb-1 px-1">{msg.name}</span>
                <div
                  className={`p-3 rounded-lg text-xs leading-relaxed max-w-[88%] whitespace-pre-line ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.time}</span>
              </div>
            ))}

            {isSendingMessage && (
              <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                <div className="w-3 h-3 border-2 border-slate-300 border-t-slate-900 dark:border-t-white rounded-full animate-spin" />
                <span>Alex is typing review guidance...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendChatMessage();
              }}
              placeholder="Ask Alex a technical or ticket question..."
              className="flex-1 text-xs px-3 py-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
            />
            <Button
              size="sm"
              variant="primary"
              disabled={isSendingMessage || !inputMessage.trim()}
              onClick={() => handleSendChatMessage()}
              className="px-3"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
