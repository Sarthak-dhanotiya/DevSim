package com.virtualcompany.modules.journey;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "student_journeys") @Getter @Setter @NoArgsConstructor
public class StudentJourney {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(nullable = false, unique = true) private UUID userId;
    @Column(columnDefinition = "TEXT", nullable = false) private String skills = "";
    @Column(nullable = false, length = 500) private String goal = "";
    @Column(nullable = false) private int weeklyHours = 6;
    private String resumeName;
    @Column(columnDefinition = "TEXT") private String resumeSummary;
    private Integer assessmentScore;
    @Column(nullable=false) private boolean assessmentSkipped;
    @Column(columnDefinition = "TEXT") private String assessmentAnswer;
    @Column(nullable = false) private String assignmentMode = "AUTOMATED";
    @Column(nullable = false) private String status = "DRAFT";
    private UUID preferredProjectId;
    @Column(length = 2000) private String requestNote;
    @Column(length = 2000) private String adminNote;
    private Instant updatedAt = Instant.now();
    @PreUpdate @PrePersist void timestamp() { updatedAt = Instant.now(); }
}
