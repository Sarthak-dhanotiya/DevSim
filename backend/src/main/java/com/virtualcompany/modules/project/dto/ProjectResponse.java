package com.virtualcompany.modules.project.dto;

import com.virtualcompany.modules.careertrack.dto.CareerTrackResponse;
import com.virtualcompany.modules.company.dto.CompanyResponse;
import com.virtualcompany.modules.project.entity.Difficulty;
import com.virtualcompany.modules.project.entity.Project;
import com.virtualcompany.modules.project.entity.ProjectTechnology;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectResponse {
    private UUID id;
    private String githubTemplateRepo;
    private String githubRepoMode;
    private String name;
    private String slug;
    private String shortDescription;
    private String description;
    private Difficulty difficulty;
    private String estimatedDuration;
    private boolean active;
    private CompanyResponse company;
    private CareerTrackResponse careerTrack;
    private List<String> technologies;

    public static ProjectResponse fromEntity(Project project) {
        if (project == null) return null;

        List<String> techList = project.getTechnologies() != null
                ? project.getTechnologies().stream()
                .map(ProjectTechnology::getTechnologyName)
                .collect(Collectors.toList())
                : Collections.emptyList();

        return ProjectResponse.builder()
                .id(project.getId())
                .githubTemplateRepo(project.getGithubTemplateRepo())
                .githubRepoMode(project.getGithubRepoMode())
                .name(project.getName())
                .slug(project.getSlug())
                .shortDescription(project.getShortDescription())
                .description(project.getDescription())
                .difficulty(project.getDifficulty())
                .estimatedDuration(project.getEstimatedDuration())
                .active(project.isActive())
                .company(CompanyResponse.fromEntity(project.getCompany()))
                .careerTrack(CareerTrackResponse.fromEntity(project.getCareerTrack()))
                .technologies(techList)
                .build();
    }
}
