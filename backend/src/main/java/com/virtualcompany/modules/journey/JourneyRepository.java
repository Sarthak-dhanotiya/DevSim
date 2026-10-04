package com.virtualcompany.modules.journey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface JourneyRepository extends JpaRepository<StudentJourney, UUID> {
    boolean existsByUserIdAndStatus(UUID userId, String status);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<StudentJourney> findByUserId(UUID userId);
    List<StudentJourney> findByStatusOrderByUpdatedAtAsc(String status);
}
