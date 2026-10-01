package com.virtualcompany.modules.project.controller;

import com.virtualcompany.common.dto.ApiResponse;
import com.virtualcompany.modules.project.dto.ProjectResponse;
import com.virtualcompany.modules.project.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
@Tag(name = "Projects", description = "Endpoints for browsing industry-style simulated projects")
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    @Operation(summary = "Get projects with optional filters by company or career track")
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getProjects(
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) UUID trackId
    ) {
        List<ProjectResponse> projects = projectService.getProjects(companyId, trackId);
        return ResponseEntity.ok(ApiResponse.ok(projects));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Get project details by slug")
    public ResponseEntity<ApiResponse<ProjectResponse>> getProjectBySlug(@PathVariable String slug) {
        ProjectResponse project = projectService.getProjectBySlug(slug);
        return ResponseEntity.ok(ApiResponse.ok(project));
    }
}
