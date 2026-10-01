package com.virtualcompany.modules.profile.service;

import com.virtualcompany.common.exception.ResourceNotFoundException;
import com.virtualcompany.modules.careertrack.entity.CareerTrack;
import com.virtualcompany.modules.careertrack.repository.CareerTrackRepository;
import com.virtualcompany.modules.profile.dto.StudentProfileResponse;
import com.virtualcompany.modules.profile.dto.UpdateProfileRequest;
import com.virtualcompany.modules.profile.entity.StudentProfile;
import com.virtualcompany.modules.profile.repository.StudentProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final StudentProfileRepository profileRepository;
    private final CareerTrackRepository careerTrackRepository;

    @Transactional(readOnly = true)
    public StudentProfileResponse getProfileByUserId(UUID userId) {
        StudentProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "userId", userId));

        return StudentProfileResponse.fromEntity(profile);
    }

    @Transactional(readOnly = true)
    public StudentProfile getProfileEntityByUserId(UUID userId) {
        return profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "userId", userId));
    }

    @Transactional
    public StudentProfileResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        StudentProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "userId", userId));

        if (request.getName() != null && !request.getName().isBlank()) {
            profile.setName(request.getName().trim());
        }
        if (request.getCollegeName() != null) {
            profile.setCollegeName(request.getCollegeName().trim());
        }
        if (request.getGraduationYear() != null) {
            profile.setGraduationYear(request.getGraduationYear());
        }
        if (request.getCurrentYear() != null) {
            profile.setCurrentYear(request.getCurrentYear().trim());
        }
        if (request.getExperienceLevel() != null) {
            profile.setExperienceLevel(request.getExperienceLevel());
        }
        if (request.getBio() != null) {
            profile.setBio(request.getBio().trim());
        }
        if (request.getGithubUrl() != null) {
            profile.setGithubUrl(request.getGithubUrl().trim());
        }
        if (request.getLinkedinUrl() != null) {
            profile.setLinkedinUrl(request.getLinkedinUrl().trim());
        }

        if (request.getSelectedCareerTrackId() != null) {
            CareerTrack careerTrack = careerTrackRepository.findById(request.getSelectedCareerTrackId())
                    .orElseThrow(() -> new ResourceNotFoundException("CareerTrack", "id", request.getSelectedCareerTrackId()));
            profile.setSelectedCareerTrack(careerTrack);
        }

        StudentProfile updated = profileRepository.save(profile);
        return StudentProfileResponse.fromEntity(updated);
    }
}
