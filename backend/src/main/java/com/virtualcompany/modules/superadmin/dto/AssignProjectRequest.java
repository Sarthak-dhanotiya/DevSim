package com.virtualcompany.modules.superadmin.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignProjectRequest {
    @NotNull(message = "Project ID is required")
    private UUID projectId;

    private boolean autoGenerateAiTasks;
    private String difficultyLevel;
    private String focusArea;
}
