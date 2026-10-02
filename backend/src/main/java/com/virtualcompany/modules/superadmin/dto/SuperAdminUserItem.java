package com.virtualcompany.modules.superadmin.dto;

import com.virtualcompany.modules.user.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuperAdminUserItem {
    private UUID userId;
    private String email;
    private Role role;
    private Instant createdAt;

    // Profile details
    private String name;
    private String collegeName;
    private String experienceLevel;

    // Current Assignment details
    private UUID enrollmentId;
    private UUID assignedProjectId;
    private String assignedProjectName;
    private UUID assignedCompanyId;
    private String assignedCompanyName;
    private String enrollmentStatus;
    private int completedTicketsCount;
    private int totalTicketsCount;
    private boolean hasPersonalizedAiTickets;
}
