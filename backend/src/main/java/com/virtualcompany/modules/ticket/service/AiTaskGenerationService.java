package com.virtualcompany.modules.ticket.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.virtualcompany.common.exception.ResourceNotFoundException;
import com.virtualcompany.modules.enrollment.entity.StudentProjectEnrollment;
import com.virtualcompany.modules.enrollment.repository.EnrollmentRepository;
import com.virtualcompany.modules.profile.entity.StudentProfile;
import com.virtualcompany.modules.profile.repository.StudentProfileRepository;
import com.virtualcompany.modules.project.entity.Project;
import com.virtualcompany.modules.project.entity.ProjectTechnology;
import com.virtualcompany.modules.project.repository.ProjectRepository;
import com.virtualcompany.modules.ticket.dto.TicketResponse;
import com.virtualcompany.modules.ticket.entity.*;
import com.virtualcompany.modules.ticket.repository.ProjectTicketRepository;
import com.virtualcompany.modules.ticket.repository.StudentTicketProgressRepository;
import com.virtualcompany.modules.user.entity.User;
import com.virtualcompany.modules.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AiTaskGenerationService {

    private final ProjectTicketRepository ticketRepository;
    private final StudentTicketProgressRepository progressRepository;
    private final UserRepository userRepository;
    private final StudentProfileRepository profileRepository;
    private final ProjectRepository projectRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    @Value("${app.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${app.gemini.model:gemini-1.5-flash}")
    private String geminiModel;

    public AiTaskGenerationService(
            ProjectTicketRepository ticketRepository,
            StudentTicketProgressRepository progressRepository,
            UserRepository userRepository,
            StudentProfileRepository profileRepository,
            ProjectRepository projectRepository,
            EnrollmentRepository enrollmentRepository,
            ObjectMapper objectMapper
    ) {
        this.ticketRepository = ticketRepository;
        this.progressRepository = progressRepository;
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.projectRepository = projectRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder().build();
    }

    @Transactional
    public List<TicketResponse> generatePersonalizedTasks(
            UUID userId,
            UUID projectId,
            String difficultyLevel,
            String focusArea,
            Integer taskCount
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        StudentProfile profile = profileRepository.findByUserId(userId)
                .orElse(null);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        int count = (taskCount != null && taskCount >= 1 && taskCount <= 10) ? taskCount : 4;
        String difficulty = (difficultyLevel != null && !difficultyLevel.isBlank()) ? difficultyLevel.toUpperCase() : "INTERMEDIATE";
        String focus = (focusArea != null && !focusArea.isBlank()) ? focusArea : "Full Sprint Engineering Tasks";

        List<GeneratedTicketDraft> drafts = new ArrayList<>();

        // 1. Try Live Gemini Generation if API key is present
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            try {
                drafts = callGeminiForTasks(user, profile, project, difficulty, focus, count);
            } catch (Exception e) {
                log.warn("Gemini AI task generation failed, using intelligent simulation fallback: {}", e.getMessage());
            }
        }

        // 2. If Gemini didn't return or was skipped, use Smart Task Engine
        if (drafts.isEmpty()) {
            drafts = generateSmartFallbackDrafts(project, profile, difficulty, focus, count);
        }

        // 3. Persist generated tickets linked to target_user_id
        List<ProjectTicket> savedTickets = new ArrayList<>();
        int baseIndex = 1;

        for (GeneratedTicketDraft draft : drafts) {
            String safeKey = generateUniqueTicketKey(project.getSlug(), user.getId(), baseIndex);

            TicketType type = TicketType.FEATURE;
            try {
                if (draft.getTicketType() != null) {
                    type = TicketType.valueOf(draft.getTicketType().toUpperCase());
                }
            } catch (Exception ignored) {}

            TicketPriority priority = TicketPriority.MEDIUM;
            try {
                if (draft.getPriority() != null) {
                    priority = TicketPriority.valueOf(draft.getPriority().toUpperCase());
                }
            } catch (Exception ignored) {}

            ProjectTicket ticket = ProjectTicket.builder()
                    .project(project)
                    .targetUser(user)
                    .ticketKey(safeKey)
                    .title(draft.getTitle())
                    .description(draft.getDescription())
                    .acceptanceCriteria(draft.getAcceptanceCriteria())
                    .ticketType(type)
                    .priority(priority)
                    .estimatedHours(draft.getEstimatedHours() != null ? draft.getEstimatedHours() : 4)
                    .orderIndex(baseIndex++)
                    .isAiGenerated(true)
                    .difficultyLevel(difficulty)
                    .build();

            savedTickets.add(ticketRepository.save(ticket));
        }

        // 4. If user already has an enrollment for this project, bind progress immediately
        if (profile != null) {
            Optional<StudentProjectEnrollment> enrollmentOpt = enrollmentRepository
                    .findByStudentIdAndProjectId(profile.getId(), project.getId());

            if (enrollmentOpt.isPresent()) {
                StudentProjectEnrollment enrollment = enrollmentOpt.get();
                for (ProjectTicket ticket : savedTickets) {
                    StudentTicketProgress prog = StudentTicketProgress.builder()
                            .enrollment(enrollment)
                            .ticket(ticket)
                            .status(TicketStatus.TODO)
                            .build();
                    progressRepository.save(prog);
                }
            }
        }

        return savedTickets.stream()
                .map(t -> TicketResponse.fromEntity(t, null))
                .collect(Collectors.toList());
    }

    private String generateUniqueTicketKey(String projectSlug, UUID userId, int index) {
        String prefix = projectSlug != null && projectSlug.length() >= 3
                ? projectSlug.substring(0, 3).toUpperCase()
                : "DEV";
        String userSub = userId.toString().substring(0, 4).toUpperCase();
        String candidate = prefix + "-" + userSub + "-" + (100 + index);

        int retry = 0;
        while (ticketRepository.existsByTicketKey(candidate)) {
            candidate = prefix + "-" + userSub + "-" + (100 + index + (++retry));
        }
        return candidate;
    }

    private List<GeneratedTicketDraft> callGeminiForTasks(
            User user,
            StudentProfile profile,
            Project project,
            String difficulty,
            String focus,
            int count
    ) {
        String companyName = project.getCompany() != null ? project.getCompany().getName() : "Enterprise Tech";
        String industry = project.getCompany() != null ? project.getCompany().getIndustry() : "Software";
        String techStack = project.getTechnologies() != null
                ? project.getTechnologies().stream().map(ProjectTechnology::getTechnologyName).collect(Collectors.joining(", "))
                : "Java 21, Spring Boot 3, PostgreSQL";

        String studentName = profile != null ? profile.getName() : "Developer";
        String studentLevel = profile != null ? profile.getExperienceLevel().name() : "BEGINNER";

        String systemPrompt = "You are the VP of Engineering and Agile Sprint Master at " + companyName + " (" + industry + ").\n" +
                "You are designing realistic, individual sprint tickets for an incoming software engineer: " + studentName +
                " (Skill: " + studentLevel + ", Target Sprint Difficulty: " + difficulty + ").\n" +
                "Project: " + project.getName() + " - " + project.getDescription() + "\n" +
                "Tech Stack: " + techStack + "\n" +
                "Focus Area: " + focus + "\n\n" +
                "Generate exactly " + count + " UNIQUE, production-grade Jira-style engineering tickets.\n" +
                "Respond ONLY with a valid JSON array of objects with the following schema, no markdown or markdown quotes:\n" +
                "[\n" +
                "  {\n" +
                "    \"title\": \"Clear Jira Ticket Title\",\n" +
                "    \"description\": \"Real-world engineering problem scenario, why it matters, and architectural context.\",\n" +
                "    \"acceptanceCriteria\": \"- Criterion 1\\n- Criterion 2\\n- Unit/Integration test requirement\",\n" +
                "    \"ticketType\": \"FEATURE | BUG | REFACTOR | PERFORMANCE | SECURITY\",\n" +
                "    \"priority\": \"LOW | MEDIUM | HIGH | CRITICAL\",\n" +
                "    \"estimatedHours\": 4\n" +
                "  }\n" +
                "]";

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", systemPrompt)
                        ))
                )
        );

        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent?key=" + geminiApiKey;

        String responseJson = restClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(String.class);

        try {
            JsonNode root = objectMapper.readTree(responseJson);
            JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
            if (!textNode.isMissingNode()) {
                String rawText = textNode.asText().trim();
                // Strip markdown code fences if Gemini added them
                if (rawText.startsWith("```json")) {
                    rawText = rawText.substring(7);
                } else if (rawText.startsWith("```")) {
                    rawText = rawText.substring(3);
                }
                if (rawText.endsWith("```")) {
                    rawText = rawText.substring(0, rawText.length() - 3);
                }
                rawText = rawText.trim();

                return objectMapper.readValue(rawText, new TypeReference<List<GeneratedTicketDraft>>() {});
            }
        } catch (Exception e) {
            log.error("Failed to parse Gemini task JSON: {}", e.getMessage());
        }

        return Collections.emptyList();
    }

    private List<GeneratedTicketDraft> generateSmartFallbackDrafts(
            Project project,
            StudentProfile profile,
            String difficulty,
            String focus,
            int count
    ) {
        String company = project.getCompany() != null ? project.getCompany().getName() : "Enterprise";
        String proj = project.getName();

        List<GeneratedTicketDraft> pool = new ArrayList<>();

        pool.add(new GeneratedTicketDraft(
                "Implement Distributed Rate Limiter for Public API Gateways",
                company + " is experiencing intermittent traffic spikes causing resource exhaustion. Implement a sliding-window rate limiter using Redis / Bucket4j to safeguard endpoints from abusive clients.",
                "- Enforce 100 requests/minute per authenticated client API key.\n- Return HTTP 429 Too Many Requests with Retry-After header.\n- Write unit tests verifying limit enforcement and reset behavior.",
                "SECURITY", "HIGH", 5
        ));

        pool.add(new GeneratedTicketDraft(
                "Resolve Concurrency Race Condition in Flash Sale Inventory Deduction",
                "During peak flash sale checkout in " + proj + ", multiple simultaneous requests can cause inventory to drop below zero. Implement pessimistic/optimistic locking with retry semantics.",
                "- Use JPA @Version optimistic locking or SELECT FOR UPDATE pessimistic locking on stock balance.\n- Throw InsufficientStockException and handle rollback cleanly.\n- Integration test with 50 concurrent threads verifying zero overselling.",
                "BUG", "CRITICAL", 6
        ));

        pool.add(new GeneratedTicketDraft(
                "Implement Idempotent Webhook Processing with De-duplication",
                company + " integrates with external payment gateways. Payment webhook events can be delivered multiple times. Implement an idempotency store to prevent duplicate charge processing.",
                "- Verify webhook cryptographic signature header (HMAC SHA-256).\n- Store processed event IDs with TTL in database table.\n- Return HTTP 200 immediately for duplicated payloads without re-executing orders.",
                "FEATURE", "HIGH", 4
        ));

        pool.add(new GeneratedTicketDraft(
                "Implement Audit Logging & Event Sourcing for Sensitive Data Mutations",
                "Compliance requires all privilege changes and critical financial transactions to be immutably audited. Implement a Spring AOP aspect intercepting target service methods.",
                "- Capture actor userId, IP address, before/after state diff, and timestamp.\n- Persist audit events asynchronously so business latency is unaffected.\n- Provide an administrative query API with pagination and date range filters.",
                "SECURITY", "MEDIUM", 4
        ));

        pool.add(new GeneratedTicketDraft(
                "Multi-Level Redis Caching & Cache-Aside Invalidation Engine",
                "Database read latency is climbing on product catalog searches. Implement cache-aside caching with automatic invalidation upon product updates.",
                "- Configure RedisCacheManager with 15-minute TTL.\n- Annotate queries with @Cacheable and update mutations with @CacheEvict.\n- Benchmark 70% latency reduction on hot read paths.",
                "PERFORMANCE", "HIGH", 5
        ));

        pool.add(new GeneratedTicketDraft(
                "Fix Memory Leak in Background CSV Report Generation Worker",
                "Out-of-memory errors occur when exporting large customer datasets. Refactor JDBC streaming or JPA paging to process data in small batch windows rather than loading full lists into RAM.",
                "- Replace findAll() with ScrollableResults or PageRequest batch iteration.\n- Stream output directly to OutputStream.\n- Verify constant heap memory usage under 100k records.",
                "BUG", "CRITICAL", 5
        ));

        Collections.shuffle(pool);
        return pool.stream().limit(count).collect(Collectors.toList());
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class GeneratedTicketDraft {
        private String title;
        private String description;
        private String acceptanceCriteria;
        private String ticketType;
        private String priority;
        private Integer estimatedHours;
    }
}
