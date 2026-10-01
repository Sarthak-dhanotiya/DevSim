package com.virtualcompany.modules.profile.dto;

import com.virtualcompany.modules.profile.entity.ExperienceLevel;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    @Size(max = 150, message = "Name cannot exceed 150 characters")
    private String name;

    @Size(max = 255, message = "College name cannot exceed 255 characters")
    private String collegeName;

    private Integer graduationYear;

    @Size(max = 50, message = "Current year cannot exceed 50 characters")
    private String currentYear;

    private ExperienceLevel experienceLevel;

    private String bio;

    @Size(max = 255, message = "GitHub URL cannot exceed 255 characters")
    private String githubUrl;

    @Size(max = 255, message = "LinkedIn URL cannot exceed 255 characters")
    private String linkedinUrl;

    private UUID selectedCareerTrackId;
}
