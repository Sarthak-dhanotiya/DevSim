package com.virtualcompany.modules.ticket.service;

import com.virtualcompany.common.exception.BadRequestException;
import com.virtualcompany.common.exception.ResourceNotFoundException;
import com.virtualcompany.modules.company.dto.CompanyResponse;
import com.virtualcompany.modules.enrollment.entity.EnrollmentStatus;
import com.virtualcompany.modules.enrollment.entity.StudentProjectEnrollment;
import com.virtualcompany.modules.enrollment.repository.EnrollmentRepository;
import com.virtualcompany.modules.project.dto.ProjectResponse;
import com.virtualcompany.modules.ticket.dto.TicketResponse;
import com.virtualcompany.modules.ticket.dto.UpdateTicketStatusRequest;
import com.virtualcompany.modules.ticket.dto.WorkspaceResponse;
import com.virtualcompany.modules.ticket.entity.ProjectTicket;
import com.virtualcompany.modules.ticket.entity.StudentTicketProgress;
import com.virtualcompany.modules.ticket.entity.TicketStatus;
import com.virtualcompany.modules.ticket.repository.ProjectTicketRepository;
import com.virtualcompany.modules.ticket.repository.StudentTicketProgressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final ProjectTicketRepository ticketRepository;
    private final StudentTicketProgressRepository progressRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AiTechLeadService aiTechLeadService;

    @Transactional(readOnly = true)
    public List<TicketResponse> getProjectTickets(UUID projectId) {
        List<ProjectTicket> tickets = ticketRepository.findByProjectIdOrderByOrderIndexAsc(projectId);
        return tickets.stream().filter(t -> t.getTargetUser() == null)
                .map(t -> TicketResponse.fromEntity(t, null))
                .collect(Collectors.toList());
    }

    @Transactional
    public WorkspaceResponse getWorkspace(UUID enrollmentId) {
        StudentProjectEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", "id", enrollmentId));

        UUID projectId = enrollment.getProject().getId();
        UUID userId = enrollment.getStudent().getUser() != null ? enrollment.getStudent().getUser().getId() : null;

        List<ProjectTicket> projectTickets = new ArrayList<>();
        if (userId != null) {
            projectTickets = ticketRepository.findByProjectIdAndTargetUserIdOrderByOrderIndexAsc(projectId, userId);
        }
        if (projectTickets.isEmpty()) {
            projectTickets = ticketRepository.findByProjectIdAndTargetUserIsNullOrderByOrderIndexAsc(projectId);
        }

        List<StudentTicketProgress> existingProgress = progressRepository.findByEnrollmentId(enrollmentId);

        Map<UUID, StudentTicketProgress> progressMap = existingProgress.stream()
                .collect(Collectors.toMap(p -> p.getTicket().getId(), p -> p));

        List<TicketResponse> ticketResponses = new ArrayList<>();
        int completedCount = 0;
        String nextTicketKey = null;

        for (ProjectTicket ticket : projectTickets) {
            StudentTicketProgress prog = progressMap.get(ticket.getId());

            // Initialize progress as TODO if not already tracked
            if (prog == null) {
                prog = StudentTicketProgress.builder()
                        .enrollment(enrollment)
                        .ticket(ticket)
                        .status(TicketStatus.TODO)
                        .build();
                prog = progressRepository.save(prog);
            }

            if (prog.getStatus() == TicketStatus.DONE) {
                completedCount++;
            } else if (nextTicketKey == null) {
                nextTicketKey = ticket.getTicketKey();
            }

            ticketResponses.add(TicketResponse.fromEntity(ticket, prog));
        }

        int total = projectTickets.size();
        int progressPercentage = total > 0 ? (int) Math.round(((double) completedCount / total) * 100) : 0;

        if (progressPercentage == 100 && enrollment.getStatus() != EnrollmentStatus.COMPLETED) {
            enrollment.setStatus(EnrollmentStatus.COMPLETED);
            enrollment.setCompletedAt(Instant.now());
            enrollmentRepository.save(enrollment);
        }

        return WorkspaceResponse.builder()
                .enrollmentId(enrollment.getId())
                .project(ProjectResponse.fromEntity(enrollment.getProject()))
                .company(CompanyResponse.fromEntity(enrollment.getProject().getCompany()))
                .tickets(ticketResponses)
                .totalTickets(total)
                .completedTickets(completedCount)
                .progressPercentage(progressPercentage)
                .suggestedNextTicketKey(nextTicketKey)
                .build();
    }

    @Transactional
    public TicketResponse updateTicketStatus(
            UUID enrollmentId,
            UUID ticketId,
            UpdateTicketStatusRequest request
    ) {
        StudentProjectEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", "id", enrollmentId));

        ProjectTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("ProjectTicket", "id", ticketId));

        if (!ticket.getProject().getId().equals(enrollment.getProject().getId()) || (ticket.getTargetUser() != null && !ticket.getTargetUser().getId().equals(enrollment.getStudent().getUser().getId()))) throw new BadRequestException("Ticket does not belong to this workspace.");

        StudentTicketProgress progress = progressRepository
                .findByEnrollmentIdAndTicketId(enrollmentId, ticketId)
                .orElseGet(() -> StudentTicketProgress.builder()
                        .enrollment(enrollment)
                        .ticket(ticket)
                        .status(TicketStatus.TODO)
                        .build());

        TicketStatus newStatus = request.getStatus();

        if (progress.getStatus() == TicketStatus.DONE) {
            if (newStatus == TicketStatus.IN_PROGRESS) {
                // Allow student to reopen ticket to practice or re-test
                progress.setStatus(TicketStatus.IN_PROGRESS);
                progress.setReviewApproved(false);
                progress.setCompletedAt(null);
            } else {
                throw new BadRequestException("Completed submissions cannot be edited or modified while marked DONE. Reopen first to revise.");
            }
        }

        if (request.getSubmissionNotes() != null) {
            progress.setSubmissionNotes(request.getSubmissionNotes().trim());
        }

        if (newStatus == TicketStatus.DONE) {
            // Workflow Gate: Student cannot manually bypass code review to mark ticket DONE
            if (!progress.isReviewApproved()) {
                throw new BadRequestException("Ticket cannot be marked DONE without passing AI Tech Lead Code Review.");
            }
            progress.setStatus(TicketStatus.DONE);
            progress.setCompletedAt(Instant.now());
        } else if (newStatus == TicketStatus.IN_REVIEW) {
            // Strict Tech Lead code review
            AiTechLeadService.CodeReviewResult reviewResult = aiTechLeadService.evaluateSubmission(ticket, progress.getSubmissionNotes());
            progress.setReviewAttempts(progress.getReviewAttempts() + 1);
            progress.setReviewScore(reviewResult.score());
            progress.setReviewApproved(reviewResult.approved());
            progress.setAiReviewFeedback(reviewResult.feedbackMarkdown());

            if (reviewResult.approved()) {
                progress.setStatus(TicketStatus.DONE);
                progress.setCompletedAt(Instant.now());
            } else {
                // Keep IN_PROGRESS so student can review feedback, revise code, and resubmit
                progress.setStatus(TicketStatus.IN_PROGRESS);
            }
        } else {
            progress.setStatus(newStatus);
            if (newStatus == TicketStatus.IN_PROGRESS && progress.getStartedAt() == null) {
                progress.setStartedAt(Instant.now());
                if (progress.getBranchName() == null) {
                    String cleanTitle = ticket.getTitle().toLowerCase()
                            .replaceAll("[^a-z0-9]+", "-")
                            .replaceAll("^-|-$", "");
                    String branch = "feature/" + ticket.getTicketKey().toLowerCase() + "-" + cleanTitle;
                    progress.setBranchName(branch.substring(0, Math.min(branch.length(), 150)));
                }
            }
        }

        StudentTicketProgress saved = progressRepository.save(progress);
        return TicketResponse.fromEntity(ticket, saved);
    }
}
