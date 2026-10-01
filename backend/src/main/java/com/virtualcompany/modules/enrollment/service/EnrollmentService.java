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

    @Transactional
    public EnrollmentResponse enroll(UUID userId, EnrollProjectRequest request) {
        StudentProfile student = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "userId", userId));

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", request.getProjectId()));

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
        StudentProfile student = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "userId", userId));

        return enrollmentRepository.findByStudentId(student.getId()).stream()
                .map(EnrollmentResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
