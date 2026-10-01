package com.virtualcompany.modules.ticket.repository;

import com.virtualcompany.modules.ticket.entity.ProjectTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectTicketRepository extends JpaRepository<ProjectTicket, UUID> {
    List<ProjectTicket> findByProjectIdOrderByOrderIndexAsc(UUID projectId);
    Optional<ProjectTicket> findByTicketKey(String ticketKey);
    boolean existsByTicketKey(String ticketKey);
}
