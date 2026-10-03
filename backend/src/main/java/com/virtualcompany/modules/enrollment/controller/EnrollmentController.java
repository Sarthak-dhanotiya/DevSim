package com.virtualcompany.modules.enrollment.controller;

import com.virtualcompany.common.dto.ApiResponse;
import com.virtualcompany.common.security.UserPrincipal;
import com.virtualcompany.modules.enrollment.dto.EnrollProjectRequest;
import com.virtualcompany.modules.enrollment.dto.EnrollmentResponse;
import com.virtualcompany.modules.enrollment.service.EnrollmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/enrollments")
@RequiredArgsConstructor
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Project Enrollments", description = "Endpoints for student project enrollment and active project tracking")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;
    private final com.virtualcompany.modules.profile.repository.StudentProfileRepository profiles;
    private final com.virtualcompany.modules.journey.JourneyRepository journeys;

    @PostMapping
    @org.springframework.transaction.annotation.Transactional
    @Operation(summary = "Enroll into a project (sets to IN_PROGRESS)")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> enroll(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody EnrollProjectRequest request
    ) {
        var profile = profiles.findByUserId(currentUser.getId()).orElseThrow();
        var journey = journeys.findByUserId(currentUser.getId()).orElse(null);
        if (!profile.isOnboardingCompleted() || journey == null || !journey.getStatus().equals("ASSIGNED")) throw new com.virtualcompany.common.exception.BadRequestException("Complete onboarding and receive an assignment first.");
        if (!request.getProjectId().equals(journey.getPreferredProjectId())) throw new com.virtualcompany.common.exception.BadRequestException("You already have an assigned project. Ask your admin to change the assignment.");
        EnrollmentResponse response = enrollmentService.enroll(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Enrolled into project successfully", response));
    }

    @GetMapping("/current")
    @Operation(summary = "Get currently active enrolled project for student")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> getCurrentEnrollment(
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        EnrollmentResponse response = enrollmentService.getCurrentEnrollment(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping
    @Operation(summary = "Get all project enrollments for student")
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> getStudentEnrollments(
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        List<EnrollmentResponse> responses = enrollmentService.getStudentEnrollments(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(responses));
    }
}
