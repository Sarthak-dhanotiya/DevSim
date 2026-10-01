package com.virtualcompany.modules.company.service;

import com.virtualcompany.common.exception.DuplicateResourceException;
import com.virtualcompany.common.exception.ResourceNotFoundException;
import com.virtualcompany.modules.company.dto.CompanyResponse;
import com.virtualcompany.modules.company.dto.CreateCompanyRequest;
import com.virtualcompany.modules.company.entity.VirtualCompany;
import com.virtualcompany.modules.company.repository.CompanyRepository;
import com.virtualcompany.modules.project.dto.ProjectResponse;
import com.virtualcompany.modules.project.entity.Project;
import com.virtualcompany.modules.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public List<CompanyResponse> getAllCompanies(boolean activeOnly) {
        List<VirtualCompany> companies = activeOnly
                ? companyRepository.findByActiveTrue()
                : companyRepository.findAll();

        return companies.stream()
                .map(CompanyResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CompanyResponse getCompanyBySlug(String slug) {
        VirtualCompany company = companyRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("VirtualCompany", "slug", slug));

        List<Project> projects = projectRepository.findByCompanyIdAndActiveTrue(company.getId());
        List<ProjectResponse> projectResponses = projects.stream()
                .map(ProjectResponse::fromEntity)
                .collect(Collectors.toList());

        CompanyResponse response = CompanyResponse.fromEntity(company);
        response.setProjects(projectResponses);
        return response;
    }

    @Transactional(readOnly = true)
    public VirtualCompany getCompanyEntityById(UUID id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("VirtualCompany", "id", id));
    }

    @Transactional
    public CompanyResponse createCompany(CreateCompanyRequest request) {
        if (companyRepository.existsBySlug(request.getSlug())) {
            throw new DuplicateResourceException("Company with slug '" + request.getSlug() + "' already exists");
        }
        if (companyRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Company with name '" + request.getName() + "' already exists");
        }

        VirtualCompany company = VirtualCompany.builder()
                .name(request.getName())
                .slug(request.getSlug())
                .description(request.getDescription())
                .industry(request.getIndustry())
                .companySize(request.getCompanySize() != null ? request.getCompanySize() : "50-200 employees")
                .logoUrl(request.getLogoUrl())
                .active(request.isActive())
                .build();

        VirtualCompany saved = companyRepository.save(company);
        return CompanyResponse.fromEntity(saved);
    }

    @Transactional
    public CompanyResponse updateCompany(UUID id, CreateCompanyRequest request) {
        VirtualCompany company = getCompanyEntityById(id);

        if (!company.getSlug().equals(request.getSlug()) && companyRepository.existsBySlug(request.getSlug())) {
            throw new DuplicateResourceException("Company with slug '" + request.getSlug() + "' already exists");
        }

        company.setName(request.getName());
        company.setSlug(request.getSlug());
        company.setDescription(request.getDescription());
        company.setIndustry(request.getIndustry());
        if (request.getCompanySize() != null) {
            company.setCompanySize(request.getCompanySize());
        }
        company.setLogoUrl(request.getLogoUrl());
        company.setActive(request.isActive());

        return CompanyResponse.fromEntity(companyRepository.save(company));
    }

    @Transactional
    public void deleteCompany(UUID id) {
        VirtualCompany company = getCompanyEntityById(id);
        companyRepository.delete(company);
    }
}
