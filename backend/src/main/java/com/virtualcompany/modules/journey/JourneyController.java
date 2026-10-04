package com.virtualcompany.modules.journey;
import com.virtualcompany.common.dto.ApiResponse;
import com.virtualcompany.common.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.*;

@RestController @RequestMapping("/api/v1") @RequiredArgsConstructor
public class JourneyController {
    private final JourneyService service;
    private final ResumeParser parser;
    private final RegistrationVerification verification;
    @PostMapping("/journey/assessment/skip") public Object skip(@AuthenticationPrincipal UserPrincipal user){return ApiResponse.ok(service.skipAssessment(user.getId()));}
    @GetMapping("/journey") public ApiResponse<JourneyService.State> state(@AuthenticationPrincipal UserPrincipal user) { return ApiResponse.ok(service.state(user.getId())); }
    @PutMapping("/journey") public ApiResponse<JourneyService.State> save(@AuthenticationPrincipal UserPrincipal user, @Valid @RequestBody JourneyRequest request) { return ApiResponse.ok(service.save(user.getId(), request)); }
    @PostMapping("/journey/resume") public ApiResponse<ResumeParser.ParsedResume> upload(@AuthenticationPrincipal UserPrincipal user, @RequestParam("file") MultipartFile file) {
        var parsed = parser.parse(file); service.resume(user.getId(), parsed); return ApiResponse.ok(parsed);
    }
    @PostMapping("/journey/assessment") public ApiResponse<JourneyService.AssessmentResult> assessment(@AuthenticationPrincipal UserPrincipal user, @RequestBody JourneyService.AssessmentRequest request) { return ApiResponse.ok(service.assess(user.getId(), request)); }
    public record CompleteRequest(UUID projectId) {}
    @PostMapping("/journey/complete") public ApiResponse<JourneyService.State> complete(@AuthenticationPrincipal UserPrincipal user, @RequestBody CompleteRequest request) { verification.requireVerified(user.getId()); return ApiResponse.ok(service.complete(user.getId(), request.projectId())); }
    @PostMapping("/journey/next-sprint") public ApiResponse<Map<String, Object>> next(@AuthenticationPrincipal UserPrincipal user) { return ApiResponse.ok(service.nextSprint(user.getId())); }
    @GetMapping("/journey/evidence") public ApiResponse<Map<String, Object>> evidence(@AuthenticationPrincipal UserPrincipal user) { return ApiResponse.ok(service.evidence(user.getId())); }
    @PreAuthorize("hasRole('SUPER_ADMIN')") @GetMapping("/super-admin/assignment-requests") public ApiResponse<List<JourneyService.RequestItem>> requests() { return ApiResponse.ok(service.requests()); }
    @PreAuthorize("hasRole('SUPER_ADMIN')") @PostMapping("/super-admin/assignment-requests/{userId}/review") public ApiResponse<JourneyService.State> review(@PathVariable UUID userId, @RequestBody JourneyService.ReviewRequest request) { return ApiResponse.ok(service.review(userId, request)); }
}
