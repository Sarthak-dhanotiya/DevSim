package com.virtualcompany.modules.careertrack.controller;

import com.virtualcompany.common.dto.ApiResponse;
import com.virtualcompany.modules.careertrack.dto.CareerTrackResponse;
import com.virtualcompany.modules.careertrack.service.CareerTrackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/career-tracks")
@RequiredArgsConstructor
@Tag(name = "Career Tracks", description = "Endpoints for exploring available career paths")
public class CareerTrackController {

    private final CareerTrackService careerTrackService;

    @GetMapping
    @Operation(summary = "Get all active career tracks")
    public ResponseEntity<ApiResponse<List<CareerTrackResponse>>> getAllTracks(
            @RequestParam(defaultValue = "true") boolean activeOnly
    ) {
        List<CareerTrackResponse> tracks = careerTrackService.getAllTracks(activeOnly);
        return ResponseEntity.ok(ApiResponse.ok(tracks));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Get career track by slug")
    public ResponseEntity<ApiResponse<CareerTrackResponse>> getTrackBySlug(@PathVariable String slug) {
        CareerTrackResponse track = careerTrackService.getTrackBySlug(slug);
        return ResponseEntity.ok(ApiResponse.ok(track));
    }
}
