package com.virtualcompany.modules.enrollment.repository;

import com.virtualcompany.modules.enrollment.entity.EnrollmentStatus;
import com.virtualcompany.modules.enrollment.entity.StudentProjectEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EnrollmentRepository extends JpaRepository<StudentProjectEnrollment, UUID> {
    List<StudentProjectEnrollment> findByStudentId(UUID studentId);
    Optional<StudentProjectEnrollment> findByStudentIdAndProjectId(UUID studentId, UUID projectId);
    Optional<StudentProjectEnrollment> findFirstByStudentIdAndStatusOrderByStartedAtDesc(UUID studentId, EnrollmentStatus status);
    Optional<StudentProjectEnrollment> findFirstByStudentIdOrderByStartedAtDesc(UUID studentId);
    boolean existsByStudentIdAndProjectId(UUID studentId, UUID projectId);
}
