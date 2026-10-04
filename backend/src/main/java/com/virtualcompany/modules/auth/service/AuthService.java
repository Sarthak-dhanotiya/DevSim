package com.virtualcompany.modules.auth.service;

import com.virtualcompany.common.exception.BadRequestException;
import com.virtualcompany.common.exception.DuplicateResourceException;
import com.virtualcompany.common.exception.ResourceNotFoundException;
import com.virtualcompany.common.security.JwtTokenProvider;
import com.virtualcompany.common.security.UserPrincipal;
import com.virtualcompany.common.service.EmailService;
import com.virtualcompany.modules.auth.dto.*;
import com.virtualcompany.modules.auth.entity.PasswordResetOtp;
import com.virtualcompany.modules.auth.repository.PasswordResetOtpRepository;
import com.virtualcompany.modules.profile.dto.StudentProfileResponse;
import com.virtualcompany.modules.profile.entity.ExperienceLevel;
import com.virtualcompany.modules.profile.entity.StudentProfile;
import com.virtualcompany.modules.profile.repository.StudentProfileRepository;
import com.virtualcompany.modules.user.entity.Role;
import com.virtualcompany.modules.user.entity.User;
import com.virtualcompany.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final StudentProfileRepository profileRepository;
    private final PasswordResetOtpRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final EmailService emailService;

    private static final String CHAR_POOL = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789#@!";

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new DuplicateResourceException("An account with email '" + normalizedEmail + "' already exists. Please sign in or use forgot password.");
        }

        String rawPassword = request.getPassword();

        User user = User.builder()
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role(Role.STUDENT)
                .emailVerified(false)
                .build();

        User savedUser = userRepository.save(user);

        StudentProfile profile = StudentProfile.builder()
                .user(savedUser)
                .name(request.getName().trim())
                .experienceLevel(ExperienceLevel.BEGINNER)
                .build();

        StudentProfile savedProfile = profileRepository.save(profile);

        UserPrincipal principal = UserPrincipal.create(savedUser);
        String token = tokenProvider.generateToken(principal);

        return AuthResponse.builder()
                .token(token)
                .userId(savedUser.getId())
                .email(savedUser.getEmail())
                .role(savedUser.getRole())
                .profile(StudentProfileResponse.fromEntity(savedProfile))
                .build();
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("No account found with email '" + normalizedEmail + "'"));

        String studentName = profileRepository.findByUserId(user.getId())
                .map(StudentProfile::getName)
                .orElse("Developer");

        // Generate 6-digit numeric OTP
        SecureRandom random = new SecureRandom();
        String otp = String.format("%06d", random.nextInt(1_000_000));

        PasswordResetOtp otpRecord = PasswordResetOtp.builder()
                .email(normalizedEmail)
                .otp(otp)
                .expiresAt(Instant.now().plus(10, ChronoUnit.MINUTES))
                .used(false)
                .build();

        otpRepository.save(otpRecord);

        // Send OTP email
        emailService.sendPasswordResetOtpEmail(normalizedEmail, studentName, otp);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        String otp = request.getOtp().trim();

        PasswordResetOtp otpRecord = otpRepository
                .findTopByEmailAndOtpAndUsedFalseOrderByCreatedAtDesc(normalizedEmail, otp)
                .orElseThrow(() -> new BadRequestException("Invalid or expired verification code (OTP). Please check and try again."));

        if (otpRecord.isExpired()) {
            throw new BadRequestException("This verification code has expired. Please request a new code.");
        }

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", normalizedEmail));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword().trim()));
        userRepository.save(user);

        otpRecord.setUsed(true);
        otpRepository.save(otpRecord);

        log.info("Password successfully updated for user: {}", normalizedEmail);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
        );

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        String token = tokenProvider.generateToken(principal);

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));

        StudentProfile profile = profileRepository.findByUserId(principal.getId()).orElse(null);

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .profile(StudentProfileResponse.fromEntity(profile))
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse getCurrentUser(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));

        StudentProfile profile = profileRepository.findByUserId(principal.getId()).orElse(null);

        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .profile(StudentProfileResponse.fromEntity(profile))
                .build();
    }

    private String generateSecurePassword() {
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(10);
        // Prefix with memorable project tag
        sb.append("Dev#");
        for (int i = 0; i < 6; i++) {
            sb.append(CHAR_POOL.charAt(random.nextInt(CHAR_POOL.length())));
        }
        return sb.toString();
    }
}
