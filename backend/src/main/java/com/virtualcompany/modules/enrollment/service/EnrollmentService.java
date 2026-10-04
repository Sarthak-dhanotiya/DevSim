package com.virtualcompany.modules.enrollment.service;

import com.virtualcompany.common.exception.ResourceNotFoundException;
import com.virtualcompany.modules.enrollment.dto.EnrollProjectRequest;
import com.virtualcompany.modules.enrollment.dto.EnrollmentResponse;
import com.virtualcompany.modules.enrollment.entity.EnrollmentStatus;
import com.virtualcompany.modules.enrollment.entity.StudentProjectEnrollment;
import com.virtualcompany.modules.enrollment.repository.EnrollmentRepository;
import com.virtualcompany.modules.profile.entity.StudentProfile;
import com.virtualcompany.modules.profile.repository.StudentProfileRepository;
import com.virtualcompany.modules.project.entity.Project;
import com.virtualcompany.modules.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final StudentProfileRepository profileRepository;
    private final ProjectRepository projectRepository;
    private final com.virtualcompany.modules.journey.JourneyRepository journeys;

    @Transactional
    public EnrollmentResponse enroll(UUID userId, EnrollProjectRequest request) {
        StudentProfile student = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "userId", userId));
        if (!student.getUser().isEmailVerified()) throw new com.virtualcompany.common.exception.BadRequestException("Verify your email before joining a project.");

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", request.getProjectId()));

        if (!project.isActive()) throw new com.virtualcompany.common.exception.BadRequestException("Project is inactive.");
        for (var other : enrollmentRepository.findByStudentId(student.getId())) {
            if (!other.getProject().getId().equals(project.getId()) && other.getStatus() == EnrollmentStatus.IN_PROGRESS) {
                other.setStatus(EnrollmentStatus.NOT_STARTED); enrollmentRepository.save(other);
            }
        }

        // Check if student already has an enrollment for this project
        Optional<StudentProjectEnrollment> existing = enrollmentRepository
                .findByStudentIdAndProjectId(student.getId(), project.getId());

        StudentProjectEnrollment enrollment;
        if (existing.isPresent()) {
            enrollment = existing.get();
            enrollment.setStatus(EnrollmentStatus.IN_PROGRESS);
            enrollment.setStartedAt(Instant.now());
        } else {
            enrollment = StudentProjectEnrollment.builder()
                    .student(student)
                    .project(project)
                    .status(EnrollmentStatus.IN_PROGRESS)
                    .startedAt(Instant.now())
                    .build();
        }

        StudentProjectEnrollment saved = enrollmentRepository.save(enrollment);
        return EnrollmentResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public EnrollmentResponse getCurrentEnrollment(UUID userId) {
        if (journeys.existsByUserIdAndStatus(userId, "PENDING_REVIEW")) return null;
        StudentProfile student = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "userId", userId));

        // Prefer IN_PROGRESS enrollment, otherwise latest
        Optional<StudentProjectEnrollment> enrollment = enrollmentRepository
                .findFirstByStudentIdAndStatusOrderByStartedAtDesc(student.getId(), EnrollmentStatus.IN_PROGRESS);

        if (enrollment.isEmpty()) {
            enrollment = enrollmentRepository.findFirstByStudentIdOrderByStartedAtDesc(student.getId());
        }

        return enrollment.map(EnrollmentResponse::fromEntity).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getStudentEnrollments(UUID userId) {
        if (journeys.existsByUserIdAndStatus(userId, "PENDING_REVIEW")) return List.of();
        StudentProfile student = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "userId", userId));

        return enrollmentRepository.findByStudentId(student.getId()).stream()
                .map(EnrollmentResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
