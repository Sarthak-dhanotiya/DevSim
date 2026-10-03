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
        String focusLower = (focus != null) ? focus.toLowerCase() : "";

        List<GeneratedTicketDraft> pool = new ArrayList<>();

        if (focusLower.contains("security") || focusLower.contains("auth")) {
            pool.add(new GeneratedTicketDraft(
                    "Enforce Fine-Grained Role-Based Access Control (RBAC) & Method Security",
                    company + "'s " + proj + " requires strict access control between Admin, Manager, and Standard roles. Secure sensitive endpoints using Spring Security @PreAuthorize annotations.",
                    "- Define custom permission evaluator or role hierarchy in SecurityConfig.\n- Secure all modification endpoints with @PreAuthorize(\"hasRole('ADMIN')\").\n- Return HTTP 403 Forbidden with standard ErrorResponse DTO when access is denied.\n- Write unit tests for access enforcement.",
                    "SECURITY", "HIGH", 4
            ));
            pool.add(new GeneratedTicketDraft(
                    "Implement Secure Password Policy & BCrypt Cost Tuning",
                    "Enforce modern NIST password guidelines across " + company + "'s authentication system to prevent weak or breached credentials.",
                    "- Require minimum 8 characters with at least one uppercase, digit, and special character.\n- Tune BCryptPasswordEncoder strength to work factor 12.\n- Add custom Bean Validation @ValidPassword annotation on registration and reset DTOs.",
                    "SECURITY", "MEDIUM", 3
            ));
            pool.add(new GeneratedTicketDraft(
                    "Implement Distributed Rate Limiter for Public Authentication Gateways",
                    company + " is experiencing credential stuffing and brute-force attempts on " + proj + ". Implement rate limiting to throttle excessive login requests.",
                    "- Enforce 10 requests/minute per client IP on /api/v1/auth/login.\n- Return HTTP 429 Too Many Requests with Retry-After header.\n- Write integration test verifying lockout after limit exceeded.",
                    "SECURITY", "HIGH", 5
            ));
            pool.add(new GeneratedTicketDraft(
                    "Implement Audit Logging for Sensitive Resource Modifications",
                    "Compliance requires all privilege changes and critical transactions in " + proj + " to be immutably audited. Implement an AOP aspect intercepting target service methods.",
                    "- Capture actor userId, IP address, before/after state diff, and timestamp.\n- Persist audit events asynchronously so business latency is unaffected.\n- Provide an administrative query API with pagination and date range filters.",
                    "SECURITY", "MEDIUM", 4
            ));
        } else if (focusLower.contains("cache") || focusLower.contains("performance")) {
            pool.add(new GeneratedTicketDraft(
                    "Multi-Level Redis Caching & Cache-Aside Invalidation Engine",
                    "Database read latency is climbing on high-traffic queries in " + proj + ". Implement cache-aside caching with automatic invalidation upon updates.",
                    "- Configure RedisCacheManager with 15-minute TTL.\n- Annotate read queries with @Cacheable and mutations with @CacheEvict.\n- Benchmark 70% latency reduction on hot read paths.",
                    "PERFORMANCE", "HIGH", 5
            ));
            pool.add(new GeneratedTicketDraft(
                    "Optimize Database Query Execution Plans and Add Composite Indexing",
                    "Slow query logs in " + company + " show frequent full table scans on " + proj + " queries with multiple WHERE filters.",
                    "- Analyze EXPLAIN ANALYZE execution plan for slow search queries.\n- Create composite indexes on frequently filtered column pairs.\n- Verify query execution time drops under 50ms.",
                    "PERFORMANCE", "MEDIUM", 4
            ));
            pool.add(new GeneratedTicketDraft(
                    "Implement Async Non-Blocking Notification Worker with Virtual Threads",
                    "Blocking HTTP and email dispatch slows down primary user flows in " + proj + ". Refactor email/event dispatch into an async execution pipeline.",
                    "- Enable Java 21 Virtual Threads for Spring task executor.\n- Decouple synchronous calls using CompletableFuture and @Async.\n- Verify API response latency drops by at least 60%.",
                    "PERFORMANCE", "HIGH", 4
            ));
        } else if (focusLower.contains("bug") || focusLower.contains("concurrency")) {
            pool.add(new GeneratedTicketDraft(
                    "Resolve Concurrency Race Condition in Resource Reservation",
                    "Under high concurrent traffic in " + proj + ", simultaneous requests can bypass balance checks. Implement pessimistic or optimistic locking with retry semantics.",
                    "- Use JPA @Version optimistic locking or SELECT FOR UPDATE pessimistic locking.\n- Throw custom BusinessConflictException and handle rollback cleanly.\n- Integration test with 30 concurrent threads verifying zero overselling or double booking.",
                    "BUG", "CRITICAL", 6
            ));
            pool.add(new GeneratedTicketDraft(
                    "Fix Memory Leak in Background Batch Report Generation Worker",
                    "Out-of-memory errors occur when exporting large datasets in " + company + ". Refactor JDBC streaming or JPA paging to process data in small batch windows rather than loading full lists into RAM.",
                    "- Replace findAll() with ScrollableResults or PageRequest batch iteration.\n- Stream output directly to OutputStream.\n- Verify constant heap memory usage under 100k records.",
                    "BUG", "CRITICAL", 5
            ));
        } else {
            // General / CRUD / REST
            pool.add(new GeneratedTicketDraft(
                    "Implement RESTful Management APIs with Category Filtering & Pagination",
                    company + " needs a robust service in " + proj + " allowing clients to search, filter, and paginate primary resources.",
                    "- Implement GET endpoints supporting page, size, and multi-field sorting.\n- Support filtering by status and date range.\n- Return HTTP 200 with standard PageResponse DTO.\n- Write unit tests for Service and integration test for Controller.",
                    "FEATURE", "HIGH", 4
            ));
            pool.add(new GeneratedTicketDraft(
                    "Build Jakarta Bean Validation & Global Exception Handling Suite",
                    "Input payloads in " + proj + " currently allow invalid or empty fields, resulting in unexpected database 500 errors. Add strict validation rules.",
                    "- Annotate request DTOs with @NotBlank, @Size, @Email, and custom validators.\n- Catch MethodArgumentNotValidException in GlobalExceptionHandler.\n- Return uniform ErrorResponse with field-level error messages.",
                    "FEATURE", "MEDIUM", 3
            ));
            pool.add(new GeneratedTicketDraft(
                    "Implement Idempotent Event Processing with De-duplication Store",
                    company + " integrates with external webhooks and events in " + proj + ". Implement an idempotency store to prevent duplicate processing.",
                    "- Verify cryptographic signature header.\n- Store processed event IDs with TTL in database table.\n- Return HTTP 200 immediately for duplicated payloads without re-executing operations.",
                    "FEATURE", "HIGH", 4
            ));
        }

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
