package com.virtualcompany.modules.careertrack.controller;

import com.virtualcompany.common.dto.ApiResponse;
import com.virtualcompany.modules.careertrack.dto.CareerTrackResponse;
import com.virtualcompany.modules.careertrack.dto.CreateCareerTrackRequest;
import com.virtualcompany.modules.careertrack.service.CareerTrackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/career-tracks")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin - Career Tracks", description = "Admin management for career tracks")
@SecurityRequirement(name = "BearerAuth")
public class AdminCareerTrackController {

    private final CareerTrackService careerTrackService;

    @PostMapping
    @Operation(summary = "Create a new career track")
    public ResponseEntity<ApiResponse<CareerTrackResponse>> createTrack(
            @Valid @RequestBody CreateCareerTrackRequest request
    ) {
        CareerTrackResponse response = careerTrackService.createTrack(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Career track created successfully", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing career track")
    public ResponseEntity<ApiResponse<CareerTrackResponse>> updateTrack(
            @PathVariable UUID id,
            @Valid @RequestBody CreateCareerTrackRequest request
    ) {
        CareerTrackResponse response = careerTrackService.updateTrack(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Career track updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a career track")
    public ResponseEntity<ApiResponse<Void>> deleteTrack(@PathVariable UUID id) {
        careerTrackService.deleteTrack(id);
        return ResponseEntity.ok(ApiResponse.ok("Career track deleted successfully", null));
    }
}
