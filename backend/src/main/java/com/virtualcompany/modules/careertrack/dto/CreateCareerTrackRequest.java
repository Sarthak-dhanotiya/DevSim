package com.virtualcompany.modules.careertrack.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCareerTrackRequest {

    @NotBlank(message = "Career track name is required")
    @Size(max = 100, message = "Name cannot exceed 100 characters")
    private String name;

    @NotBlank(message = "Slug is required")
    @Size(max = 100, message = "Slug cannot exceed 100 characters")
    private String slug;

    @NotBlank(message = "Description is required")
    private String description;

    private String iconUrl;

    @Builder.Default
    private boolean active = true;
}
