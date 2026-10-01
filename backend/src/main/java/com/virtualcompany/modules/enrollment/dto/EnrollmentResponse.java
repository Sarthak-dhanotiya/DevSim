package com.virtualcompany.modules.enrollment.dto;

import com.virtualcompany.modules.enrollment.entity.EnrollmentStatus;
import com.virtualcompany.modules.enrollment.entity.StudentProjectEnrollment;
import com.virtualcompany.modules.project.dto.ProjectResponse;
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
public class EnrollmentResponse {
    private UUID id;
    private UUID studentId;
    private ProjectResponse project;
    private EnrollmentStatus status;
    private Instant startedAt;
    private Instant completedAt;

    public static EnrollmentResponse fromEntity(StudentProjectEnrollment enrollment) {
        if (enrollment == null) return null;
        return EnrollmentResponse.builder()
                .id(enrollment.getId())
                .studentId(enrollment.getStudent() != null ? enrollment.getStudent().getId() : null)
                .project(ProjectResponse.fromEntity(enrollment.getProject()))
                .status(enrollment.getStatus())
                .startedAt(enrollment.getStartedAt())
                .completedAt(enrollment.getCompletedAt())
                .build();
    }
}
