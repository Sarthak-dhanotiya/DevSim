package com.virtualcompany.modules.project.service;

import com.virtualcompany.common.exception.DuplicateResourceException;
import com.virtualcompany.common.exception.ResourceNotFoundException;
import com.virtualcompany.modules.careertrack.entity.CareerTrack;
import com.virtualcompany.modules.careertrack.repository.CareerTrackRepository;
import com.virtualcompany.modules.company.entity.VirtualCompany;
import com.virtualcompany.modules.company.repository.CompanyRepository;
import com.virtualcompany.modules.project.dto.CreateProjectRequest;
import com.virtualcompany.modules.project.dto.ProjectResponse;
import com.virtualcompany.modules.project.entity.Project;
import com.virtualcompany.modules.project.entity.ProjectTechnology;
import com.virtualcompany.modules.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final CompanyRepository companyRepository;
    private final CareerTrackRepository careerTrackRepository;

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjects(UUID companyId, UUID trackId) {
        List<Project> projects;

        if (companyId != null && trackId != null) {
            projects = projectRepository.findByCompanyIdAndCareerTrackIdAndActiveTrue(companyId, trackId);
        } else if (companyId != null) {
            projects = projectRepository.findByCompanyIdAndActiveTrue(companyId);
        } else if (trackId != null) {
            projects = projectRepository.findByCareerTrackIdAndActiveTrue(trackId);
        } else {
            projects = projectRepository.findByActiveTrue();
        }

        return projects.stream()
                .map(ProjectResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProjectBySlug(String slug) {
        Project project = projectRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "slug", slug));

        return ProjectResponse.fromEntity(project);
    }

    @Transactional(readOnly = true)
    public Project getProjectEntityById(UUID id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", id));
    }

    @Transactional
    public ProjectResponse createProject(CreateProjectRequest request) {
        if (projectRepository.existsBySlug(request.getSlug())) {
            throw new DuplicateResourceException("Project with slug '" + request.getSlug() + "' already exists");
        }

        VirtualCompany company = companyRepository.findById(request.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("VirtualCompany", "id", request.getCompanyId()));

        CareerTrack track = careerTrackRepository.findById(request.getCareerTrackId())
                .orElseThrow(() -> new ResourceNotFoundException("CareerTrack", "id", request.getCareerTrackId()));

        Project project = Project.builder()
                .company(company)
                .careerTrack(track)
                .name(request.getName())
                .slug(request.getSlug())
                .shortDescription(request.getShortDescription())
                .description(request.getDescription())
                .difficulty(request.getDifficulty())
                .estimatedDuration(request.getEstimatedDuration())
                .active(request.isActive())
                .technologies(new ArrayList<>())
                .build();

        if (request.getTechnologies() != null) {
            for (String techName : request.getTechnologies()) {
                ProjectTechnology tech = ProjectTechnology.builder()
                        .project(project)
                        .technologyName(techName.trim())
                        .build();
                project.getTechnologies().add(tech);
            }
        }

        Project saved = projectRepository.save(project);
        return ProjectResponse.fromEntity(saved);
    }

    @Transactional
    public ProjectResponse updateProject(UUID id, CreateProjectRequest request) {
        Project project = getProjectEntityById(id);

        if (!project.getSlug().equals(request.getSlug()) && projectRepository.existsBySlug(request.getSlug())) {
            throw new DuplicateResourceException("Project with slug '" + request.getSlug() + "' already exists");
        }

        VirtualCompany company = companyRepository.findById(request.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("VirtualCompany", "id", request.getCompanyId()));

        CareerTrack track = careerTrackRepository.findById(request.getCareerTrackId())
                .orElseThrow(() -> new ResourceNotFoundException("CareerTrack", "id", request.getCareerTrackId()));

        project.setCompany(company);
        project.setCareerTrack(track);
        project.setName(request.getName());
        project.setSlug(request.getSlug());
        project.setShortDescription(request.getShortDescription());
        project.setDescription(request.getDescription());
        project.setDifficulty(request.getDifficulty());
        project.setEstimatedDuration(request.getEstimatedDuration());
        project.setActive(request.isActive());

        // Update technologies
        project.getTechnologies().clear();
        if (request.getTechnologies() != null) {
            for (String techName : request.getTechnologies()) {
                ProjectTechnology tech = ProjectTechnology.builder()
                        .project(project)
                        .technologyName(techName.trim())
                        .build();
                project.getTechnologies().add(tech);
            }
        }

        Project updated = projectRepository.save(project);
        return ProjectResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteProject(UUID id) {
        Project project = getProjectEntityById(id);
        projectRepository.delete(project);
    }
}
