package com.virtualcompany.modules.auth.repository;

import com.virtualcompany.modules.auth.entity.PasswordResetOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, UUID> {

    Optional<PasswordResetOtp> findTopByEmailAndOtpAndUsedFalseOrderByCreatedAtDesc(String email, String otp);
}
