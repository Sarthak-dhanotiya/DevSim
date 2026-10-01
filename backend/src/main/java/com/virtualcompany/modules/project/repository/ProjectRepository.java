package com.virtualcompany.modules.project.repository;

import com.virtualcompany.modules.project.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {
    Optional<Project> findBySlug(String slug);
    List<Project> findByActiveTrue();
    List<Project> findByCompanyIdAndActiveTrue(UUID companyId);
    List<Project> findByCareerTrackIdAndActiveTrue(UUID careerTrackId);
    List<Project> findByCompanyIdAndCareerTrackIdAndActiveTrue(UUID companyId, UUID careerTrackId);
    boolean existsBySlug(String slug);
}
