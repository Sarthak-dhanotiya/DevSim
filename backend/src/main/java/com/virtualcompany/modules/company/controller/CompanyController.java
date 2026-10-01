package com.virtualcompany.modules.company.controller;

import com.virtualcompany.common.dto.ApiResponse;
import com.virtualcompany.modules.company.dto.CompanyResponse;
import com.virtualcompany.modules.company.service.CompanyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/companies")
@RequiredArgsConstructor
@Tag(name = "Virtual Companies", description = "Endpoints for exploring simulated virtual software companies")
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping
    @Operation(summary = "Get all active virtual companies")
    public ResponseEntity<ApiResponse<List<CompanyResponse>>> getAllCompanies(
            @RequestParam(defaultValue = "true") boolean activeOnly
    ) {
        List<CompanyResponse> companies = companyService.getAllCompanies(activeOnly);
        return ResponseEntity.ok(ApiResponse.ok(companies));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Get virtual company by slug with its projects")
    public ResponseEntity<ApiResponse<CompanyResponse>> getCompanyBySlug(@PathVariable String slug) {
        CompanyResponse company = companyService.getCompanyBySlug(slug);
        return ResponseEntity.ok(ApiResponse.ok(company));
    }
}
