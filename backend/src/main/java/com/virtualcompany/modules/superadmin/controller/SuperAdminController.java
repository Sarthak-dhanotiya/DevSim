package com.virtualcompany.modules.superadmin.controller;

import com.virtualcompany.common.dto.ApiResponse;
import com.virtualcompany.modules.superadmin.dto.*;
import com.virtualcompany.modules.superadmin.service.SuperAdminService;
import com.virtualcompany.modules.ticket.dto.TicketResponse;
import com.virtualcompany.modules.ticket.service.AiTaskGenerationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/super-admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Super Admin Control Center", description = "Platform owner control for users, projects, and dynamic AI tasks")
@SecurityRequirement(name = "BearerAuth")
public class SuperAdminController {

    private final SuperAdminService superAdminService;
    private final AiTaskGenerationService aiTaskGenerationService;

    @GetMapping("/stats")
    @Operation(summary = "Get platform metrics and analytics")
    public ResponseEntity<ApiResponse<SuperAdminStatsResponse>> getStats() {
        SuperAdminStatsResponse stats = superAdminService.getStats();
        return ResponseEntity.ok(ApiResponse.ok("Platform metrics retrieved", stats));
    }

    @GetMapping("/users")
    @Operation(summary = "List all platform users with their company/project assignments")
    public ResponseEntity<ApiResponse<List<SuperAdminUserItem>>> getAllUsers() {
        List<SuperAdminUserItem> users = superAdminService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.ok("Users retrieved successfully", users));
    }

    @PostMapping("/users/{userId}/assign-project")
    @Operation(summary = "Assign or transfer a user to a specific project/company with optional dynamic AI tasks")
    public ResponseEntity<ApiResponse<SuperAdminUserItem>> assignProject(
            @PathVariable UUID userId,
            @Valid @RequestBody AssignProjectRequest request
    ) {
        SuperAdminUserItem updatedUser = superAdminService.assignProjectToUser(userId, request);
        return ResponseEntity.ok(ApiResponse.ok("Project assigned successfully to user", updatedUser));
    }

    @PatchMapping("/users/{userId}/role")
    @Operation(summary = "Promote or update user role (STUDENT, ADMIN, SUPER_ADMIN)")
    public ResponseEntity<ApiResponse<SuperAdminUserItem>> updateUserRole(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserRoleRequest request
    ) {
        SuperAdminUserItem updatedUser = superAdminService.updateUserRole(userId, request.getRole());
        return ResponseEntity.ok(ApiResponse.ok("User role updated successfully", updatedUser));
    }

    @PostMapping("/tickets/generate-ai")
    @Operation(summary = "Generate dynamic personalized AI tasks for a student")
    public ResponseEntity<ApiResponse<List<TicketResponse>>> generateAiTasks(
            @Valid @RequestBody GenerateAiTaskRequest request
    ) {
        List<TicketResponse> tickets = aiTaskGenerationService.generatePersonalizedTasks(
                request.getUserId(),
                request.getProjectId(),
                request.getDifficultyLevel(),
                request.getFocusArea(),
                request.getTaskCount()
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Dynamic AI tasks generated successfully", tickets));
    }

    @GetMapping("/users/{userId}/tickets")
    @Operation(summary = "Get all tickets assigned specifically to a user")
    public ResponseEntity<ApiResponse<List<TicketResponse>>> getUserTickets(@PathVariable UUID userId) {
        List<TicketResponse> tickets = superAdminService.getUserTickets(userId);
        return ResponseEntity.ok(ApiResponse.ok("User tickets retrieved", tickets));
    }

    @PostMapping("/tickets")
    @Operation(summary = "Manually create a custom ticket for a project or specific user")
    public ResponseEntity<ApiResponse<TicketResponse>> createManualTicket(
            @Valid @RequestBody CreateManualTicketRequest request
    ) {
        TicketResponse ticket = superAdminService.createManualTicket(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Custom ticket created successfully", ticket));
    }

    @DeleteMapping("/tickets/{ticketId}")
    @Operation(summary = "Delete an assigned ticket")
    public ResponseEntity<ApiResponse<Void>> deleteTicket(@PathVariable UUID ticketId) {
        superAdminService.deleteTicket(ticketId);
        return ResponseEntity.ok(ApiResponse.ok("Ticket deleted successfully", null));
    }
}
