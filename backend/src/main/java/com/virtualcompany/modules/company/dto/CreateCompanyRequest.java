package com.virtualcompany.modules.company.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCompanyRequest {

    @NotBlank(message = "Company name is required")
    @Size(max = 150, message = "Company name cannot exceed 150 characters")
    private String name;

    @NotBlank(message = "Slug is required")
    @Size(max = 150, message = "Slug cannot exceed 150 characters")
    private String slug;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Industry is required")
    @Size(max = 100, message = "Industry cannot exceed 100 characters")
    private String industry;

    private String companySize;

    private String logoUrl;

    @Builder.Default
    private boolean active = true;
}
