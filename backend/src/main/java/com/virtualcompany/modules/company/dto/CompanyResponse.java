package com.virtualcompany.modules.company.dto;

import com.virtualcompany.modules.company.entity.VirtualCompany;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyResponse {
    private UUID id;
    private String name;
    private String slug;
    private String description;
    private String industry;
    private String companySize;
    private String logoUrl;
    private boolean active;
    private List<?> projects;

    public static CompanyResponse fromEntity(VirtualCompany company) {
        if (company == null) return null;
        return CompanyResponse.builder()
                .id(company.getId())
                .name(company.getName())
                .slug(company.getSlug())
                .description(company.getDescription())
                .industry(company.getIndustry())
                .companySize(company.getCompanySize())
                .logoUrl(company.getLogoUrl())
                .active(company.isActive())
                .build();
    }
}
