package com.virtualcompany.modules.profile.controller;

import com.virtualcompany.common.dto.ApiResponse;
import com.virtualcompany.common.security.UserPrincipal;
import com.virtualcompany.modules.profile.dto.StudentProfileResponse;
import com.virtualcompany.modules.profile.dto.UpdateProfileRequest;
import com.virtualcompany.modules.profile.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Student Profile", description = "Endpoints for viewing and updating the student profile")
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    @Operation(summary = "Get current student profile")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> getCurrentProfile(
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        StudentProfileResponse profile = profileService.getProfileByUserId(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @PutMapping
    @Operation(summary = "Update current student profile")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> updateProfile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        StudentProfileResponse updated = profileService.updateProfile(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully", updated));
    }
}
