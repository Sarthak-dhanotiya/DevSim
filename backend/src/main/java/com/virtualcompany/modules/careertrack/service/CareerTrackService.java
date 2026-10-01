package com.virtualcompany.modules.careertrack.service;

import com.virtualcompany.common.exception.DuplicateResourceException;
import com.virtualcompany.common.exception.ResourceNotFoundException;
import com.virtualcompany.modules.careertrack.dto.CareerTrackResponse;
import com.virtualcompany.modules.careertrack.dto.CreateCareerTrackRequest;
import com.virtualcompany.modules.careertrack.entity.CareerTrack;
import com.virtualcompany.modules.careertrack.repository.CareerTrackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CareerTrackService {

    private final CareerTrackRepository careerTrackRepository;

    @Transactional(readOnly = true)
    public List<CareerTrackResponse> getAllTracks(boolean activeOnly) {
        List<CareerTrack> tracks = activeOnly
                ? careerTrackRepository.findByActiveTrue()
                : careerTrackRepository.findAll();

        return tracks.stream()
                .map(CareerTrackResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CareerTrackResponse getTrackBySlug(String slug) {
        CareerTrack track = careerTrackRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("CareerTrack", "slug", slug));

        return CareerTrackResponse.fromEntity(track);
    }

    @Transactional(readOnly = true)
    public CareerTrack getTrackEntityById(UUID id) {
        return careerTrackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CareerTrack", "id", id));
    }

    @Transactional
    public CareerTrackResponse createTrack(CreateCareerTrackRequest request) {
        if (careerTrackRepository.existsBySlug(request.getSlug())) {
            throw new DuplicateResourceException("Career track with slug '" + request.getSlug() + "' already exists");
        }
        if (careerTrackRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Career track with name '" + request.getName() + "' already exists");
        }

        CareerTrack track = CareerTrack.builder()
                .name(request.getName())
                .slug(request.getSlug())
                .description(request.getDescription())
                .iconUrl(request.getIconUrl())
                .active(request.isActive())
                .build();

        CareerTrack saved = careerTrackRepository.save(track);
        return CareerTrackResponse.fromEntity(saved);
    }

    @Transactional
    public CareerTrackResponse updateTrack(UUID id, CreateCareerTrackRequest request) {
        CareerTrack track = getTrackEntityById(id);

        if (!track.getSlug().equals(request.getSlug()) && careerTrackRepository.existsBySlug(request.getSlug())) {
            throw new DuplicateResourceException("Career track with slug '" + request.getSlug() + "' already exists");
        }

        track.setName(request.getName());
        track.setSlug(request.getSlug());
        track.setDescription(request.getDescription());
        track.setIconUrl(request.getIconUrl());
        track.setActive(request.isActive());

        return CareerTrackResponse.fromEntity(careerTrackRepository.save(track));
    }

    @Transactional
    public void deleteTrack(UUID id) {
        CareerTrack track = getTrackEntityById(id);
        careerTrackRepository.delete(track);
    }
}
