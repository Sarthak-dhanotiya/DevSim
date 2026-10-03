package com.virtualcompany.modules.profile.dto;

import com.virtualcompany.modules.careertrack.dto.CareerTrackResponse;
import com.virtualcompany.modules.profile.entity.ExperienceLevel;
import com.virtualcompany.modules.profile.entity.StudentProfile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentProfileResponse {
    private boolean onboardingCompleted;
    private UUID id;
    private UUID userId;
    private String name;
    private String email;
    private String collegeName;
    private Integer graduationYear;
    private String currentYear;
    private ExperienceLevel experienceLevel;
    private String bio;
    private String githubUrl;
    private String linkedinUrl;
    private CareerTrackResponse selectedCareerTrack;

    public static StudentProfileResponse fromEntity(StudentProfile profile) {
        if (profile == null) return null;
        return StudentProfileResponse.builder()
                .onboardingCompleted(profile.isOnboardingCompleted())
                .id(profile.getId())
                .userId(profile.getUser() != null ? profile.getUser().getId() : null)
                .name(profile.getName())
                .email(profile.getUser() != null ? profile.getUser().getEmail() : null)
                .collegeName(profile.getCollegeName())
                .graduationYear(profile.getGraduationYear())
                .currentYear(profile.getCurrentYear())
                .experienceLevel(profile.getExperienceLevel())
                .bio(profile.getBio())
                .githubUrl(profile.getGithubUrl())
                .linkedinUrl(profile.getLinkedinUrl())
                .selectedCareerTrack(CareerTrackResponse.fromEntity(profile.getSelectedCareerTrack()))
                .build();
    }
}
