package com.virtualcompany.modules.ticket.entity;

import com.virtualcompany.modules.project.entity.Project;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "project_tickets")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "ticket_key", nullable = false, unique = true, length = 30)
    private String ticketKey;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "acceptance_criteria", nullable = false, columnDefinition = "TEXT")
    private String acceptanceCriteria;

    @Enumerated(EnumType.STRING)
    @Column(name = "ticket_type", nullable = false, length = 30)
    @Builder.Default
    private TicketType ticketType = TicketType.FEATURE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private TicketPriority priority = TicketPriority.MEDIUM;

    @Column(name = "estimated_hours")
    @Builder.Default
    private Integer estimatedHours = 4;

    @Column(name = "order_index", nullable = false)
    @Builder.Default
    private Integer orderIndex = 1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_user_id")
    private com.virtualcompany.modules.user.entity.User targetUser;

    @Column(name = "is_ai_generated", nullable = false)
    @Builder.Default
    private Boolean isAiGenerated = false;

    @Column(name = "difficulty_level", length = 30)
    @Builder.Default
    private String difficultyLevel = "MEDIUM";

    @Column(nullable = false, length = 30)
    @Builder.Default private String generationSource = "CURATED";

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
