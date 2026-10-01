package com.virtualcompany.modules.careertrack.repository;

import com.virtualcompany.modules.careertrack.entity.CareerTrack;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CareerTrackRepository extends JpaRepository<CareerTrack, UUID> {
    Optional<CareerTrack> findBySlug(String slug);
    List<CareerTrack> findByActiveTrue();
    boolean existsBySlug(String slug);
    boolean existsByName(String name);
}
