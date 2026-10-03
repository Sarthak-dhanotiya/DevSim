package com.virtualcompany.modules.project.dto;

import com.virtualcompany.modules.project.entity.Difficulty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProjectRequest {

    private UUID companyId;

    @NotNull(message = "Career Track ID is required")
    private UUID careerTrackId;

    @NotBlank(message = "Project name is required")
    @Size(max = 200, message = "Project name cannot exceed 200 characters")
    private String name;

    @NotBlank(message = "Slug is required")
    @Size(max = 200, message = "Slug cannot exceed 200 characters")
    private String slug;

    @NotBlank(message = "Short description is required")
    @Size(max = 500, message = "Short description cannot exceed 500 characters")
    private String shortDescription;

    @NotBlank(message = "Description is required")
    private String description;

    @Builder.Default
    private Difficulty difficulty = Difficulty.BEGINNER;

    @Builder.Default
    private String estimatedDuration = "4 weeks";

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private List<String> technologies = new ArrayList<>();
}
