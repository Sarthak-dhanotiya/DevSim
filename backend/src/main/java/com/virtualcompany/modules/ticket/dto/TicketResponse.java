package com.virtualcompany.modules.ticket.dto;

import com.virtualcompany.modules.ticket.entity.ProjectTicket;
import com.virtualcompany.modules.ticket.entity.StudentTicketProgress;
import com.virtualcompany.modules.ticket.entity.TicketPriority;
import com.virtualcompany.modules.ticket.entity.TicketStatus;
import com.virtualcompany.modules.ticket.entity.TicketType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponse {
    private String generationSource;
    private Integer reviewScore;
    private int reviewAttempts;
    private int hintsUsed;
    private UUID id;
    private String ticketKey;
    private String title;
    private String description;
    private String acceptanceCriteria;
    private TicketType ticketType;
    private TicketPriority priority;
    private Integer estimatedHours;
    private Integer orderIndex;
    private Boolean isAiGenerated;
    private String difficultyLevel;
    private UUID targetUserId;

    // Student's personal progress on this ticket
    private TicketStatus status;
    private String branchName;
    private String submissionNotes;
    private String aiReviewFeedback;
    private Instant startedAt;
    private Instant completedAt;

    public static TicketResponse fromEntity(ProjectTicket ticket, StudentTicketProgress progress) {
        TicketResponse.TicketResponseBuilder builder = TicketResponse.builder()
                .generationSource(ticket.getGenerationSource())
                .id(ticket.getId())
                .ticketKey(ticket.getTicketKey())
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .acceptanceCriteria(ticket.getAcceptanceCriteria())
                .ticketType(ticket.getTicketType())
                .priority(ticket.getPriority())
                .estimatedHours(ticket.getEstimatedHours())
                .orderIndex(ticket.getOrderIndex())
                .isAiGenerated(ticket.getIsAiGenerated())
                .difficultyLevel(ticket.getDifficultyLevel())
                .targetUserId(ticket.getTargetUser() != null ? ticket.getTargetUser().getId() : null)
                .status(progress != null ? progress.getStatus() : TicketStatus.TODO);

        if (progress != null) {
            builder.reviewScore(progress.getReviewScore()).reviewAttempts(progress.getReviewAttempts()).hintsUsed(progress.getHintsUsed()).branchName(progress.getBranchName())
                    .submissionNotes(progress.getSubmissionNotes())
                    .aiReviewFeedback(progress.getAiReviewFeedback())
                    .startedAt(progress.getStartedAt())
                    .completedAt(progress.getCompletedAt());
        }

        return builder.build();
    }
}
