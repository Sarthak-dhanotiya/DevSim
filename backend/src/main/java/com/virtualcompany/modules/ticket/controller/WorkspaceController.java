package com.virtualcompany.modules.ticket.controller;

import com.virtualcompany.common.dto.ApiResponse;
import com.virtualcompany.modules.ticket.dto.*;
import com.virtualcompany.modules.ticket.service.AiTechLeadService;
import com.virtualcompany.modules.ticket.service.TicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Workspace & Tickets", description = "Simulated development workspace, Kanban tickets, and AI Tech Lead")
public class WorkspaceController {

    private final com.virtualcompany.modules.enrollment.repository.EnrollmentRepository enrollmentRepository;
    private final com.virtualcompany.modules.ticket.repository.ProjectTicketRepository ticketRepository;
    private final com.virtualcompany.modules.ticket.repository.StudentTicketProgressRepository progressRepository;
    private final com.virtualcompany.modules.journey.JourneyRepository journeys;
    private void verifyAssignmentApproved(com.virtualcompany.common.security.UserPrincipal user) {
        if (journeys.existsByUserIdAndStatus(user.getId(), "PENDING_REVIEW")) throw new org.springframework.security.access.AccessDeniedException("Your assignment request is awaiting admin approval.");
    }
    private void verifyOwner(UUID enrollmentId, com.virtualcompany.common.security.UserPrincipal user) {
        verifyAssignmentApproved(user);
        var e = enrollmentRepository.findById(enrollmentId).orElseThrow(() -> new com.virtualcompany.common.exception.BadRequestException("Workspace not found."));
        if (!e.getStudent().getUser().getId().equals(user.getId())) throw new org.springframework.security.access.AccessDeniedException("This workspace belongs to another student.");
    }
    private final TicketService ticketService;
    private final AiTechLeadService aiTechLeadService;

    @PostMapping("/enrollments/{enrollmentId}/tickets/{ticketId}/hint")
    @org.springframework.transaction.annotation.Transactional
    public ApiResponse<java.util.Map<String, Object>> hint(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.virtualcompany.common.security.UserPrincipal user,
            @PathVariable UUID enrollmentId, @PathVariable UUID ticketId) {
        verifyOwner(enrollmentId, user);
        var t = ticketRepository.findById(ticketId).orElseThrow(() -> new com.virtualcompany.common.exception.BadRequestException("Ticket not found."));
        var e = enrollmentRepository.findById(enrollmentId).orElseThrow();
        if (!t.getProject().getId().equals(e.getProject().getId()) || (t.getTargetUser() != null && !t.getTargetUser().getId().equals(user.getId()))) throw new org.springframework.security.access.AccessDeniedException("Ticket does not belong to your workspace.");
        ticketService.getWorkspace(enrollmentId);
        var p = progressRepository.findByEnrollmentIdAndTicketId(enrollmentId, ticketId).orElseThrow();
        p.setHintsUsed(p.getHintsUsed() + 1); progressRepository.save(p);
        String hint = switch (Math.min(3, p.getHintsUsed())) {
            case 1 -> "Start with the first acceptance criterion. Write the expected input and output before implementation.\n" + t.getAcceptanceCriteria().split("\\r?\\n")[0];
            case 2 -> "Separate the normal path from invalid or empty input. Keep the domain logic small and testable. Use the technologies in the project brief.";
            default -> "Write one test for a successful case, one for invalid input and one boundary case. Then implement the smallest change that satisfies those tests.";
        };
        return ApiResponse.ok(java.util.Map.of("hint", hint, "hintsUsed", p.getHintsUsed()));
    }

    @GetMapping("/projects/{projectId}/tickets")
    @Operation(summary = "Get all tickets for a project")
    public ResponseEntity<ApiResponse<List<TicketResponse>>> getProjectTickets(
            @PathVariable UUID projectId
    ) {
        List<TicketResponse> tickets = ticketService.getProjectTickets(projectId);
        return ResponseEntity.ok(ApiResponse.ok(tickets));
    }

    @GetMapping("/enrollments/{enrollmentId}/workspace")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Get full workspace state with Kanban board tickets and progress")
    public ResponseEntity<ApiResponse<WorkspaceResponse>> getWorkspace(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.virtualcompany.common.security.UserPrincipal user,
            @PathVariable UUID enrollmentId
    ) {
        verifyOwner(enrollmentId, user);
        WorkspaceResponse workspace = ticketService.getWorkspace(enrollmentId);
        return ResponseEntity.ok(ApiResponse.ok(workspace));
    }

    @PatchMapping("/enrollments/{enrollmentId}/tickets/{ticketId}/status")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Update ticket status on Kanban board (TODO, IN_PROGRESS, IN_REVIEW, DONE)")
    public ResponseEntity<ApiResponse<TicketResponse>> updateTicketStatus(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.virtualcompany.common.security.UserPrincipal user,
            @PathVariable UUID enrollmentId,
            @PathVariable UUID ticketId,
            @Valid @RequestBody UpdateTicketStatusRequest request
    ) {
        verifyOwner(enrollmentId, user);
        TicketResponse response = ticketService.updateTicketStatus(enrollmentId, ticketId, request);
        return ResponseEntity.ok(ApiResponse.ok("Ticket status updated", response));
    }

    @PostMapping("/workspace/ai-chat")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Chat with AI Tech Lead (Alex) about architecture, Spring Boot, or ticket guidelines")
    public ResponseEntity<ApiResponse<AiChatResponse>> chatWithTechLead(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.virtualcompany.common.security.UserPrincipal user,
            @Valid @RequestBody AiChatRequest request
    ) {
        verifyAssignmentApproved(user);
        if (request.getTicketId() != null) {
            var t = ticketRepository.findById(request.getTicketId()).orElseThrow(() -> new com.virtualcompany.common.exception.BadRequestException("Ticket not found."));
            if (t.getTargetUser() != null && !t.getTargetUser().getId().equals(user.getId())) throw new org.springframework.security.access.AccessDeniedException("Ticket belongs to another student.");
        }
        AiChatResponse response = aiTechLeadService.respondToStudent(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
