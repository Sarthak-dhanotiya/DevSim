package com.virtualcompany.modules.ticket.dto;

import com.virtualcompany.modules.company.dto.CompanyResponse;
import com.virtualcompany.modules.project.dto.ProjectResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceResponse {
    private UUID enrollmentId;
    private ProjectResponse project;
    private CompanyResponse company;
    private List<TicketResponse> tickets;
    private int totalTickets;
    private int completedTickets;
    private int progressPercentage;
    private String suggestedNextTicketKey;
}
