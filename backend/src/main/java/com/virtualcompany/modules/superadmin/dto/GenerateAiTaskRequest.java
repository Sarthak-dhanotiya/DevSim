package com.virtualcompany.modules.superadmin.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GenerateAiTaskRequest {
    @NotNull(message = "User ID is required")
    private UUID userId;

    @NotNull(message = "Project ID is required")
    private UUID projectId;

    private String difficultyLevel; // BEGINNER, INTERMEDIATE, ADVANCED
    private String focusArea;       // e.g. "Security & Auth", "Performance & Caching", "API & Database", "Bug Fixes"
    private Integer taskCount;      // default 4
}
