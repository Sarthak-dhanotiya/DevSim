package com.virtualcompany.modules.superadmin.dto;

import com.virtualcompany.modules.ticket.entity.TicketPriority;
import com.virtualcompany.modules.ticket.entity.TicketType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateManualTicketRequest {
    @NotNull(message = "Project ID is required")
    private UUID projectId;

    private UUID targetUserId; // null for all students in project, or specific UUID

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Acceptance criteria is required")
    private String acceptanceCriteria;

    private TicketType ticketType = TicketType.FEATURE;
    private TicketPriority priority = TicketPriority.MEDIUM;
    private Integer estimatedHours = 4;
}
