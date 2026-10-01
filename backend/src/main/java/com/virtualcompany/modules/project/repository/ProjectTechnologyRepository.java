package com.virtualcompany.modules.project.repository;

import com.virtualcompany.modules.project.entity.ProjectTechnology;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectTechnologyRepository extends JpaRepository<ProjectTechnology, UUID> {
    List<ProjectTechnology> findByProjectId(UUID projectId);
    void deleteByProjectId(UUID projectId);
}
