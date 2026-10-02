package com.virtualcompany.modules.superadmin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuperAdminStatsResponse {
    private long totalUsers;
    private long totalStudents;
    private long totalAdmins;
    private long totalCompanies;
    private long totalProjects;
    private long totalEnrollments;
    private long totalAiTicketsGenerated;
}
