package com.virtualcompany.modules.company.controller;

import com.virtualcompany.common.dto.ApiResponse;
import com.virtualcompany.modules.company.dto.CompanyResponse;
import com.virtualcompany.modules.company.dto.CreateCompanyRequest;
import com.virtualcompany.modules.company.service.CompanyService;
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
@RequestMapping("/api/v1/admin/companies")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@Tag(name = "Admin - Virtual Companies", description = "Admin management for virtual companies")
@SecurityRequirement(name = "BearerAuth")
public class AdminCompanyController {

    private final CompanyService companyService;

    @PostMapping
    @Operation(summary = "Create a new virtual company")
    public ResponseEntity<ApiResponse<CompanyResponse>> createCompany(
            @Valid @RequestBody CreateCompanyRequest request
    ) {
        CompanyResponse response = companyService.createCompany(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Company created successfully", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing virtual company")
    public ResponseEntity<ApiResponse<CompanyResponse>> updateCompany(
            @PathVariable UUID id,
            @Valid @RequestBody CreateCompanyRequest request
    ) {
        CompanyResponse response = companyService.updateCompany(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Company updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a virtual company")
    public ResponseEntity<ApiResponse<Void>> deleteCompany(@PathVariable UUID id) {
        companyService.deleteCompany(id);
        return ResponseEntity.ok(ApiResponse.ok("Company deleted successfully", null));
    }
}
