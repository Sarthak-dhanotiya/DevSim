package com.virtualcompany.modules.auth.service;

import com.virtualcompany.common.exception.DuplicateResourceException;
import com.virtualcompany.common.exception.ResourceNotFoundException;
import com.virtualcompany.common.security.JwtTokenProvider;
import com.virtualcompany.common.security.UserPrincipal;
import com.virtualcompany.modules.auth.dto.AuthResponse;
import com.virtualcompany.modules.auth.dto.LoginRequest;
import com.virtualcompany.modules.auth.dto.RegisterRequest;
import com.virtualcompany.modules.profile.dto.StudentProfileResponse;
import com.virtualcompany.modules.profile.entity.ExperienceLevel;
import com.virtualcompany.modules.profile.entity.StudentProfile;
import com.virtualcompany.modules.profile.repository.StudentProfileRepository;
import com.virtualcompany.modules.user.entity.Role;
import com.virtualcompany.modules.user.entity.User;
import com.virtualcompany.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final StudentProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new DuplicateResourceException("An account with email '" + normalizedEmail + "' already exists");
        }

        User user = User.builder()
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.STUDENT)
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
}
