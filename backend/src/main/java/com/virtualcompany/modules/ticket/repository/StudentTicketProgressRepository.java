package com.virtualcompany.modules.ticket.repository;

import com.virtualcompany.modules.ticket.entity.StudentTicketProgress;
import com.virtualcompany.modules.ticket.entity.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentTicketProgressRepository extends JpaRepository<StudentTicketProgress, UUID> {
    List<StudentTicketProgress> findByEnrollmentId(UUID enrollmentId);
    Optional<StudentTicketProgress> findByEnrollmentIdAndTicketId(UUID enrollmentId, UUID ticketId);
    long countByEnrollmentIdAndStatus(UUID enrollmentId, TicketStatus status);
}
