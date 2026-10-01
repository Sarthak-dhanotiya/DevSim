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

    private final TicketService ticketService;
    private final AiTechLeadService aiTechLeadService;

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
            @PathVariable UUID enrollmentId
    ) {
        WorkspaceResponse workspace = ticketService.getWorkspace(enrollmentId);
        return ResponseEntity.ok(ApiResponse.ok(workspace));
    }

    @PatchMapping("/enrollments/{enrollmentId}/tickets/{ticketId}/status")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Update ticket status on Kanban board (TODO, IN_PROGRESS, IN_REVIEW, DONE)")
    public ResponseEntity<ApiResponse<TicketResponse>> updateTicketStatus(
            @PathVariable UUID enrollmentId,
            @PathVariable UUID ticketId,
            @Valid @RequestBody UpdateTicketStatusRequest request
    ) {
        TicketResponse response = ticketService.updateTicketStatus(enrollmentId, ticketId, request);
        return ResponseEntity.ok(ApiResponse.ok("Ticket status updated", response));
    }

    @PostMapping("/workspace/ai-chat")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Chat with AI Tech Lead (Alex) about architecture, Spring Boot, or ticket guidelines")
    public ResponseEntity<ApiResponse<AiChatResponse>> chatWithTechLead(
            @Valid @RequestBody AiChatRequest request
    ) {
        AiChatResponse response = aiTechLeadService.respondToStudent(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
