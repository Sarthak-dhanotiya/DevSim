package com.virtualcompany.modules.careertrack.dto;

import com.virtualcompany.modules.careertrack.entity.CareerTrack;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CareerTrackResponse {
    private UUID id;
    private String name;
    private String slug;
    private String description;
    private String iconUrl;
    private boolean active;

    public static CareerTrackResponse fromEntity(CareerTrack track) {
        if (track == null) return null;
        return CareerTrackResponse.builder()
                .id(track.getId())
                .name(track.getName())
                .slug(track.getSlug())
                .description(track.getDescription())
                .iconUrl(track.getIconUrl())
                .active(track.isActive())
                .build();
    }
}
