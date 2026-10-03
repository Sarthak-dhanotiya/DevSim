package com.virtualcompany.modules.ticket.entity;

import com.virtualcompany.modules.enrollment.entity.StudentProjectEnrollment;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "student_ticket_progress",
        uniqueConstraints = @UniqueConstraint(name = "uq_enrollment_ticket", columnNames = {"enrollment_id", "ticket_id"})
)
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentTicketProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "enrollment_id", nullable = false)
    private StudentProjectEnrollment enrollment;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    private ProjectTicket ticket;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private TicketStatus status = TicketStatus.TODO;

    @Column(name = "branch_name", length = 150)
    private String branchName;

    @Column(name = "submission_notes", columnDefinition = "TEXT")
    private String submissionNotes;

    @Column(name = "ai_review_feedback", columnDefinition = "TEXT")
    private String aiReviewFeedback;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    private Integer reviewScore;
    @Builder.Default private int reviewAttempts = 0;
    @Builder.Default private int hintsUsed = 0;
    @Builder.Default private boolean reviewApproved = false;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
