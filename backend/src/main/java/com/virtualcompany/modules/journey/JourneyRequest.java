package com.virtualcompany.modules.journey;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.*;
@Data
public class JourneyRequest {
    @NotEmpty @Size(max = 40) private List<@NotBlank @Size(max = 60) String> skills;
    @NotBlank @Size(max = 500) private String goal;
    @Min(1) @Max(40) private int weeklyHours = 6;
    @NotNull private UUID careerTrackId;
    @Pattern(regexp = "BEGINNER|INTERMEDIATE|ADVANCED") @NotNull private String experienceLevel;
    @Pattern(regexp = "AUTOMATED|GUIDED") @NotNull private String assignmentMode;
    private UUID projectId;
    @Size(max = 2000) private String requestNote;
}
