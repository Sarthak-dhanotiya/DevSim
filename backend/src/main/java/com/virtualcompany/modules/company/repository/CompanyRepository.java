package com.virtualcompany.modules.company.repository;

import com.virtualcompany.modules.company.entity.VirtualCompany;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompanyRepository extends JpaRepository<VirtualCompany, UUID> {
    Optional<VirtualCompany> findBySlug(String slug);
    List<VirtualCompany> findByActiveTrue();
    boolean existsBySlug(String slug);
    boolean existsByName(String name);
}
