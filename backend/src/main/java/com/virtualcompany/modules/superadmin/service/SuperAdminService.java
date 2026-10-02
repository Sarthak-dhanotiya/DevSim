package com.virtualcompany.modules.superadmin.service;

import com.virtualcompany.common.exception.ResourceNotFoundException;
import com.virtualcompany.modules.company.repository.CompanyRepository;
import com.virtualcompany.modules.enrollment.dto.EnrollProjectRequest;
import com.virtualcompany.modules.enrollment.entity.EnrollmentStatus;
import com.virtualcompany.modules.enrollment.entity.StudentProjectEnrollment;
import com.virtualcompany.modules.enrollment.repository.EnrollmentRepository;
import com.virtualcompany.modules.enrollment.service.EnrollmentService;
import com.virtualcompany.modules.profile.entity.ExperienceLevel;
import com.virtualcompany.modules.profile.entity.StudentProfile;
import com.virtualcompany.modules.profile.repository.StudentProfileRepository;
import com.virtualcompany.modules.project.entity.Project;
import com.virtualcompany.modules.project.repository.ProjectRepository;
import com.virtualcompany.modules.superadmin.dto.*;
import com.virtualcompany.modules.ticket.dto.TicketResponse;
import com.virtualcompany.modules.ticket.entity.ProjectTicket;
import com.virtualcompany.modules.ticket.entity.StudentTicketProgress;
import com.virtualcompany.modules.ticket.entity.TicketStatus;
import com.virtualcompany.modules.ticket.repository.ProjectTicketRepository;
import com.virtualcompany.modules.ticket.repository.StudentTicketProgressRepository;
import com.virtualcompany.modules.ticket.service.AiTaskGenerationService;
import com.virtualcompany.modules.user.entity.Role;
import com.virtualcompany.modules.user.entity.User;
import com.virtualcompany.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SuperAdminService {

    private final UserRepository userRepository;
    private final StudentProfileRepository profileRepository;
    private final CompanyRepository companyRepository;
    private final ProjectRepository projectRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ProjectTicketRepository ticketRepository;
    private final StudentTicketProgressRepository progressRepository;
    private final EnrollmentService enrollmentService;
    private final AiTaskGenerationService aiTaskGenerationService;

    @Transactional(readOnly = true)
    public SuperAdminStatsResponse getStats() {
        long totalUsers = userRepository.count();
        long totalStudents = userRepository.countByRole(Role.STUDENT);
        long totalAdmins = userRepository.countByRole(Role.ADMIN) + userRepository.countByRole(Role.SUPER_ADMIN);
        long totalCompanies = companyRepository.count();
        long totalProjects = projectRepository.count();
        long totalEnrollments = enrollmentRepository.count();
        long totalAiTickets = ticketRepository.countByIsAiGeneratedTrue();

        return SuperAdminStatsResponse.builder()
                .totalUsers(totalUsers)
                .totalStudents(totalStudents)
                .totalAdmins(totalAdmins)
                .totalCompanies(totalCompanies)
                .totalProjects(totalProjects)
                .totalEnrollments(totalEnrollments)
                .totalAiTicketsGenerated(totalAiTickets)
                .build();
    }

    @Transactional(readOnly = true)
    public List<SuperAdminUserItem> getAllUsers() {
        List<User> users = userRepository.findAllByOrderByCreatedAtDesc();

        return users.stream().map(user -> {
            StudentProfile profile = profileRepository.findByUserId(user.getId()).orElse(null);

            // Find user's active or latest enrollment
            StudentProjectEnrollment activeEnrollment = null;
            if (profile != null) {
                activeEnrollment = enrollmentRepository
                        .findFirstByStudentIdAndStatusOrderByStartedAtDesc(profile.getId(), EnrollmentStatus.IN_PROGRESS)
                        .orElse(null);

                if (activeEnrollment == null) {
                    activeEnrollment = enrollmentRepository
                            .findFirstByStudentIdOrderByStartedAtDesc(profile.getId())
                            .orElse(null);
                }
            }

            int completedTickets = 0;
            int totalTickets = 0;
            if (activeEnrollment != null) {
                List<StudentTicketProgress> progressList = progressRepository.findByEnrollmentId(activeEnrollment.getId());
                totalTickets = progressList.size();
                completedTickets = (int) progressList.stream()
                        .filter(p -> p.getStatus() == TicketStatus.DONE)
                        .count();
            }

            List<ProjectTicket> userTickets = ticketRepository.findByTargetUserIdOrderByOrderIndexAsc(user.getId());
            boolean hasPersonalizedAiTickets = userTickets.stream().anyMatch(t -> Boolean.TRUE.equals(t.getIsAiGenerated()));

            return SuperAdminUserItem.builder()
                    .userId(user.getId())
                    .email(user.getEmail())
                    .role(user.getRole())
                    .createdAt(user.getCreatedAt())
                    .name(profile != null ? profile.getName() : "Anonymous")
                    .collegeName(profile != null ? profile.getCollegeName() : null)
                    .experienceLevel(profile != null && profile.getExperienceLevel() != null ? profile.getExperienceLevel().name() : "BEGINNER")
                    .enrollmentId(activeEnrollment != null ? activeEnrollment.getId() : null)
                    .assignedProjectId(activeEnrollment != null ? activeEnrollment.getProject().getId() : null)
                    .assignedProjectName(activeEnrollment != null ? activeEnrollment.getProject().getName() : null)
                    .assignedCompanyId(activeEnrollment != null && activeEnrollment.getProject().getCompany() != null
                            ? activeEnrollment.getProject().getCompany().getId() : null)
                    .assignedCompanyName(activeEnrollment != null && activeEnrollment.getProject().getCompany() != null
                            ? activeEnrollment.getProject().getCompany().getName() : null)
                    .enrollmentStatus(activeEnrollment != null ? activeEnrollment.getStatus().name() : "NOT_ASSIGNED")
                    .completedTicketsCount(completedTickets)
                    .totalTicketsCount(totalTickets)
                    .hasPersonalizedAiTickets(hasPersonalizedAiTickets)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public SuperAdminUserItem assignProjectToUser(UUID userId, AssignProjectRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Ensure profile exists
        profileRepository.findByUserId(userId).orElseGet(() -> {
            StudentProfile newProfile = StudentProfile.builder()
                    .user(user)
                    .name(user.getEmail().split("@")[0])
                    .experienceLevel(ExperienceLevel.BEGINNER)
                    .build();
            return profileRepository.save(newProfile);
        });

        // Enroll user in project
        enrollmentService.enroll(userId, new EnrollProjectRequest(request.getProjectId()));

        // If requested, generate dynamic AI tasks immediately for this user!
        if (request.isAutoGenerateAiTasks()) {
            aiTaskGenerationService.generatePersonalizedTasks(
                    userId,
                    request.getProjectId(),
                    request.getDifficultyLevel(),
                    request.getFocusArea(),
                    4
            );
        }

        // Return updated user item
        return getAllUsers().stream()
                .filter(u -> u.getUserId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }

    @Transactional
    public SuperAdminUserItem updateUserRole(UUID userId, Role newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setRole(newRole);
        userRepository.save(user);

        return getAllUsers().stream()
                .filter(u -> u.getUserId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getUserTickets(UUID userId) {
        List<ProjectTicket> tickets = ticketRepository.findByTargetUserIdOrderByOrderIndexAsc(userId);
        return tickets.stream()
                .map(t -> TicketResponse.fromEntity(t, null))
                .collect(Collectors.toList());
    }

    @Transactional
    public TicketResponse createManualTicket(CreateManualTicketRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", request.getProjectId()));

        User targetUser = null;
        if (request.getTargetUserId() != null) {
            targetUser = userRepository.findById(request.getTargetUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getTargetUserId()));
        }

        String prefix = project.getSlug() != null && project.getSlug().length() >= 3
                ? project.getSlug().substring(0, 3).toUpperCase()
                : "MAN";
        String candidateKey = prefix + "-" + (100 + (int)(Math.random() * 900));
        while (ticketRepository.existsByTicketKey(candidateKey)) {
            candidateKey = prefix + "-" + (100 + (int)(Math.random() * 900));
        }

        ProjectTicket ticket = ProjectTicket.builder()
                .project(project)
                .targetUser(targetUser)
                .ticketKey(candidateKey)
                .title(request.getTitle())
                .description(request.getDescription())
                .acceptanceCriteria(request.getAcceptanceCriteria())
                .ticketType(request.getTicketType() != null ? request.getTicketType() : com.virtualcompany.modules.ticket.entity.TicketType.FEATURE)
                .priority(request.getPriority() != null ? request.getPriority() : com.virtualcompany.modules.ticket.entity.TicketPriority.MEDIUM)
                .estimatedHours(request.getEstimatedHours() != null ? request.getEstimatedHours() : 4)
                .isAiGenerated(false)
                .difficultyLevel("MANUAL")
                .build();

        ProjectTicket saved = ticketRepository.save(ticket);

        // If target user is enrolled, create progress record
        if (targetUser != null) {
            StudentProfile profile = profileRepository.findByUserId(targetUser.getId()).orElse(null);
            if (profile != null) {
                Optional<StudentProjectEnrollment> enrollmentOpt = enrollmentRepository
                        .findByStudentIdAndProjectId(profile.getId(), project.getId());
                if (enrollmentOpt.isPresent()) {
                    StudentTicketProgress prog = StudentTicketProgress.builder()
                            .enrollment(enrollmentOpt.get())
                            .ticket(saved)
                            .status(TicketStatus.TODO)
                            .build();
                    progressRepository.save(prog);
                }
            }
        }

        return TicketResponse.fromEntity(saved, null);
    }

    @Transactional
    public void deleteTicket(UUID ticketId) {
        ProjectTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("ProjectTicket", "id", ticketId));
        ticketRepository.delete(ticket);
    }
}
