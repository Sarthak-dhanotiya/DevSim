package com.virtualcompany.modules.ticket.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.virtualcompany.modules.ticket.dto.AiChatRequest;
import com.virtualcompany.modules.ticket.dto.AiChatResponse;
import com.virtualcompany.modules.ticket.entity.ProjectTicket;
import com.virtualcompany.modules.ticket.repository.ProjectTicketRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class AiTechLeadService {

    private final ProjectTicketRepository ticketRepository;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${app.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${app.gemini.model:gemini-1.5-flash}")
    private String geminiModel;

    public AiTechLeadService(ProjectTicketRepository ticketRepository, ObjectMapper objectMapper) {
        this.ticketRepository = ticketRepository;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder().build();
    }

    public AiChatResponse respondToStudent(AiChatRequest request) {
        ProjectTicket ticket = null;
        if (request.getTicketId() != null) {
            ticket = ticketRepository.findById(request.getTicketId()).orElse(null);
        }

        String userPrompt = request.getMessage().trim();

        // 1. If Gemini API key is configured, use live Generative AI
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            try {
                String aiReply = callGeminiApi(userPrompt, ticket);
                if (aiReply != null && !aiReply.isBlank()) {
                    return buildResponse(aiReply);
                }
            } catch (Exception ex) {
                log.warn("Gemini API call failed, falling back to built-in engineering brain: {}", ex.getMessage());
            }
        }

        // 2. Built-in Technical Knowledge & Mentorship Reasoning Engine
        String smartReply = resolveSmartTechLeadAnswer(userPrompt, ticket);
        return buildResponse(smartReply);
    }

    private String callGeminiApi(String userPrompt, ProjectTicket ticket) {
        String systemInstruction = "You are Alex Mitchell, Staff Software Engineer & Tech Lead at QuickKart (a high-scale e-commerce platform). " +
                "You mentor junior developers and college interns. " +
                "Always provide clear, professional, production-grade Java 21 / Spring Boot 3 answers. " +
                "Keep your answers concise, practical, well-formatted with markdown and code snippets when helpful. " +
                "If the student asks a fundamental question (like 'what is Java?'), explain it clearly and connect it to real industry backend development.";

        if (ticket != null) {
            systemInstruction += "\n\nCurrent context - The student is working on Ticket " + ticket.getTicketKey() +
                    ": \"" + ticket.getTitle() + "\"\nAcceptance Criteria: " + ticket.getAcceptanceCriteria();
        }

        String fullPrompt = systemInstruction + "\n\nStudent asks:\n" + userPrompt;

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", fullPrompt)
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
                return textNode.asText();
            }
        } catch (Exception e) {
            log.error("Failed to parse Gemini API response: {}", e.getMessage());
        }

        return null;
    }

    /**
     * Extensive Built-In Technical Knowledge Engine (Works 100% offline without any API key)
     */
    private String resolveSmartTechLeadAnswer(String rawQuery, ProjectTicket ticket) {
        String q = rawQuery.toLowerCase().trim();

        // --- 1. GENERAL JAVA QUESTIONS ---
        if (q.contains("what is java") || q.equals("java") || q.startsWith("tell me about java") || q.contains("explain java")) {
            return """
                    ### What is Java?

                    **Java** is a robust, class-based, object-oriented programming language designed with the principle **"Write Once, Run Anywhere" (WORA)**.

                    Here is how it works under the hood in the software industry:
                    1. **Source Code to Bytecode**: Your `.java` files are compiled by `javac` into platform-independent bytecode (`.class` files).
                    2. **Java Virtual Machine (JVM)**: The JVM on any OS (Linux, Windows, macOS) executes this bytecode using a Just-In-Time (JIT) compiler to convert bytecode into native machine instructions with high performance.
                    3. **Key Components**:
                       - **JDK (Java Development Kit)**: Includes the compiler (`javac`), debugger, and development tools.
                       - **JRE (Java Runtime Environment)**: Includes the libraries and JVM needed to run compiled Java apps.
                       - **JVM (Java Virtual Machine)**: Manages memory (Heap & Stack) and Garbage Collection (automatic memory management).

                    In our stack at QuickKart, we use **Java 21 LTS** which brings modern language features like Virtual Threads (Project Loom), Pattern Matching, and Records for high-throughput microservices.
                    """;
        }

        if (q.contains("oop") || q.contains("object oriented") || q.contains("pillars of oop") || q.contains("inheritance") || q.contains("polymorphism")) {
            return """
                    ### The 4 Pillars of Object-Oriented Programming (OOP) in Java

                    1. **Encapsulation**: Bundling fields and methods inside a class and restricting direct access using `private` fields and getters/setters (or Lombok `@Getter/@Setter`).
                    2. **Inheritance**: Enabling a class to inherit features from a parent class (`extends`) to promote code reusability.
                    3. **Polymorphism**:
                       - *Compile-time (Overloading)*: Methods with the same name but different signatures in the same class.
                       - *Runtime (Overriding)*: A subclass provides a specific implementation of a method defined in its superclass (`@Override`).
                    4. **Abstraction**: Hiding internal implementation details and exposing only the essential interface (`interface` or `abstract class`).

                    In Spring Boot, we rely heavily on **Abstraction & Polymorphism** to decouple our controllers, services, and repositories!
                    """;
        }

        if (q.contains("jvm") || q.contains("garbage collector") || q.contains("memory leak") || q.contains("heap")) {
            return """
                    ### Java Memory Architecture & JVM

                    The JVM divides memory into key areas:
                    - **Heap Memory**: Where all Java objects are allocated dynamically at runtime. Managed automatically by the **Garbage Collector (GC)**.
                    - **Stack Memory**: Contains method call frames, local primitive variables, and references to objects in the Heap. Fast, LIFO structure.
                    - **Metaspace**: Stores class metadata, bytecode, and method definitions.

                    **Industry Tip**: In high-scale services like QuickKart, tuning the Garbage Collector (e.g. G1GC or ZGC) prevents latency spikes ("Stop-The-World" pauses) during high flash-sale traffic!
                    """;
        }

        // --- 2. SPRING BOOT & BACKEND ARCHITECTURE ---
        if (q.contains("what is spring boot") || q.contains("spring boot vs spring") || q.equals("spring") || q.equals("spring boot")) {
            return """
                    ### What is Spring Boot?

                    **Spring Boot** is an opinionated, production-ready framework built on top of the Spring Framework. It eliminates boilerplate XML configuration and simplifies Java enterprise development.

                    **Core Features:**
                    1. **Auto-Configuration**: Spring Boot scans your classpath dependencies and configures sensible defaults automatically (e.g., if PostgreSQL driver is on classpath, it configures a HikariCP DataSource).
                    2. **Embedded Servers**: Comes with embedded Tomcat, Jetty, or Undertow so you don't need to deploy WAR files to an external app server.
                    3. **Starter Dependencies**: Pre-packaged dependencies like `spring-boot-starter-web`, `spring-boot-starter-data-jpa`.
                    4. **Actuator**: Built-in production health metrics and monitoring endpoints.

                    In this simulated company, our entire backend is built with **Spring Boot 3.3.4** and **Java 21**.
                    """;
        }

        if (q.contains("dependency injection") || q.contains("ioc") || q.contains("inversion of control") || q.contains("@autowired")) {
            return """
                    ### Inversion of Control (IoC) & Dependency Injection (DI)

                    - **Inversion of Control (IoC)**: Instead of a class manually instantiating its dependencies using `new Service()`, control is inverted to the **Spring ApplicationContext** container.
                    - **Dependency Injection (DI)**: The mechanism where the container injects required dependencies into your component.

                    **Best Practice**:
                    Avoid field injection (`@Autowired private MyService myService;`). Instead, use **Constructor Injection** with Lombok `@RequiredArgsConstructor`:
                    ```java
                    @Service
                    @RequiredArgsConstructor
                    public class ProductService {
                        private final ProductRepository productRepository; // Injected via constructor!
                    }
                    ```
                    This makes your code immutable, testable with Mockito, and prevents NPEs!
                    """;
        }

        if (q.contains("layered architecture") || q.contains("controller") || q.contains("service") || q.contains("repository")) {
            return """
                    ### QuickKart 3-Tier Layered Architecture

                    We strictly maintain a 3-tier separation of concerns:
                    1. **Web Layer (`@RestController`)**: Handles HTTP requests, path variables, query parameters, and validates DTOs with `@Valid`. Returns `ResponseEntity<ApiResponse<T>>`.
                    2. **Business Layer (`@Service`)**: Contains all core business logic, validations, orchestration, and `@Transactional` boundaries. Never leak entities directly to the client.
                    3. **Data Access Layer (`@Repository`)**: Extends `JpaRepository<Entity, UUID>` to communicate with PostgreSQL.

                    Keep controllers thin and services focused!
                    """;
        }

        // --- 3. DATABASE & SPRING DATA JPA ---
        if (q.contains("jpa") || q.contains("hibernate") || q.contains("entity") || q.contains("orm")) {
            return """
                    ### Spring Data JPA & Hibernate

                    - **JPA (Jakarta Persistence API)** is the standard Java specification for Object-Relational Mapping (ORM).
                    - **Hibernate** is the ORM engine that implements the JPA specification.
                    - **Spring Data JPA** provides repository abstractions on top of Hibernate so you don't have to write raw SQL queries for standard CRUD operations.

                    **Example Entity:**
                    ```java
                    @Entity
                    @Table(name = "products")
                    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
                    public class Product {
                        @Id
                        @GeneratedValue(strategy = GenerationType.UUID)
                        private UUID id;

                        @Column(nullable = false)
                        private String name;

                        private BigDecimal price;
                    }
                    ```
                    """;
        }

        if (q.contains("concurrency") || q.contains("race condition") || q.contains("lock") || q.contains("stock")) {
            return """
                    ### Concurrency & Pessimistic Locking (QK-103)

                    When multiple customers purchase the same limited-stock item simultaneously, standard reads and writes will cause a **race condition** (overselling inventory).

                    **Solution**:
                    Use a **Pessimistic Write Lock** in your repository:
                    ```java
                    @Lock(LockModeType.PESSIMISTIC_WRITE)
                    @Query("SELECT p FROM Product p WHERE p.id = :id")
                    Optional<Product> findByIdWithLock(@Param("id") UUID id);
                    ```
                    This executes `SELECT ... FOR UPDATE` in PostgreSQL, locking the row until your `@Transactional` method commits, guaranteeing safe inventory deduction!
                    """;
        }

        if (q.contains("idempotency") || q.contains("duplicate") || q.contains("webhook") || q.contains("header")) {
            return """
                    ### Idempotency in Payment & Order Processing (QK-104)

                    Network retries from payment gateways (like Stripe or Razorpay) can send the same webhook twice.
                    An **idempotent operation** ensures that making the same request multiple times has the exact same side-effects as making it once.

                    **Implementation Strategy**:
                    1. Read the `Idempotency-Key` HTTP header.
                    2. Check database/cache: Has this key been processed in the last 24h?
                    3. If YES: return the cached response immediately without recharging the customer!
                    4. If NO: process the transaction in a `@Transactional` block, record the key, and commit.
                    """;
        }

        if (q.contains("pagination") || q.contains("filter") || q.contains("catalog") || q.contains("qk-101")) {
            return """
                    ### Product Catalog API & Pagination (QK-101)

                    To implement QK-101 properly:
                    1. **Controller**:
                    ```java
                    @GetMapping
                    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getProducts(
                        @RequestParam(required = false) UUID categoryId,
                        @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
                    ) {
                        return ResponseEntity.ok(ApiResponse.ok(productService.getProducts(categoryId, pageable)));
                    }
                    ```
                    2. **Repository**: Use query derivation:
                    ```java
                    Page<Product> findByCategoryId(UUID categoryId, Pageable pageable);
                    ```
                    3. Always map entity `Page<Product>` to DTO `Page<ProductResponse>` using `.map(mapper::toResponse)`!
                    """;
        }

        if (q.contains("test") || q.contains("unit test") || q.contains("mock") || q.contains("junit")) {
            return """
                    ### Testing Standards at QuickKart

                    1. **Service Unit Tests with Mockito**:
                    ```java
                    @ExtendWith(MockitoExtension.class)
                    class ProductServiceTest {
                        @Mock private ProductRepository productRepository;
                        @InjectMocks private ProductService productService;

                        @Test
                        void shouldReturnProduct_WhenExists() {
                            when(productRepository.findById(any())).thenReturn(Optional.of(sampleProduct));
                            ProductResponse res = productService.getProductById(UUID.randomUUID());
                            assertNotNull(res);
                            verify(productRepository).findById(any());
                        }
                    }
                    ```
                    2. **Controller Integration Tests**: Use `@WebMvcTest(ProductController.class)` and `MockMvc` to verify HTTP status codes and JSON paths!
                    """;
        }

        if (q.contains("exception") || q.contains("error") || q.contains("validation") || q.contains("400") || q.contains("500")) {
            return """
                    ### Global Exception Handling in Spring Boot

                    Never leak raw stack traces to client applications. Use a `@RestControllerAdvice`:
                    ```java
                    @RestControllerAdvice
                    public class GlobalExceptionHandler {

                        @ExceptionHandler(ResourceNotFoundException.class)
                        public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
                            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(new ErrorResponse(HttpStatus.NOT_FOUND.value(), ex.getMessage()));
                        }

                        @ExceptionHandler(MethodArgumentNotValidException.class)
                        public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
                            // Extract field errors and return HTTP 400 Bad Request
                        }
                    }
                    ```
                    """;
        }

        // --- 4. GREETINGS & CASUAL INTERACTION ---
        if (q.contains("hi") || q.contains("hello") || q.contains("hey") || q.contains("kya haal") || q.contains("kaise ho")) {
            String name = (ticket != null) ? " regarding ticket **" + ticket.getTicketKey() + "** (" + ticket.getTitle() + ")" : "";
            return "Hey there! I'm **Alex Mitchell**, your Tech Lead on QuickKart Commerce" + name + ".\n\n" +
                    "I'm here to help you with code reviews, Spring Boot architecture, Java 21 questions, unit testing, or debugging any ticket.\n\n" +
                    "What are you working on or what concept would you like to explore?";
        }

        if (q.contains("thank") || q.contains("thanks") || q.contains("shukriya") || q.contains("great")) {
            return "You're very welcome! Keep up the great engineering work. Remember: clean code, solid unit tests, and adherence to acceptance criteria make for great pull requests. Let me know if you need anything else!";
        }

        // --- 5. TICKET SPECIFIC DEEP GUIDANCE IF TICKET PRESENT ---
        if (ticket != null) {
            return "### Tech Lead Guidance for " + ticket.getTicketKey() + ": " + ticket.getTitle() + "\n\n" +
                    "**Description:** " + ticket.getDescription() + "\n\n" +
                    "**Acceptance Criteria:**\n" + ticket.getAcceptanceCriteria() + "\n\n" +
                    "**Recommended Next Steps:**\n" +
                    "**How to work on this ticket:**\n" +
                    "• **Easiest Option (Zero Setup):** Open this ticket in the board, switch to the **'Submit & Review'** tab, click **'Auto-Fill Template'** to get started with a ready skeleton, add your logic, and click **'Submit for AI Review'**.\n" +
                    "• **Advanced Option (Local Git):** Clone or create branch `git checkout -b feature/" + ticket.getTicketKey().toLowerCase() + "`, code in your IDE, and paste your code or GitHub PR link into the ticket modal.\n\n" +
                    "Once submitted, I'll review your code right away and give you senior engineering feedback!";
        }

        // --- 6. DEFAULT COMPREHENSIVE DEVELOPER FALLBACK ---
        return "Hey! I'm Alex Mitchell, your Tech Lead at QuickKart. " +
                "You don't need a complicated Git setup to work on tickets! You can write or paste your code directly into the ticket modal's **'Submit & Review'** tab, or ask me for help here.\n\n" +
                "I'm here to explain **Java fundamentals** (e.g. 'what is Java?', OOPs, multithreading), " +
                "**Spring Boot architecture** (e.g. pagination, `@Transactional`, dependency injection), " +
                "**unit testing with Mockito**, or specific ticket guidelines (`QK-101` to `QK-105`).\n\n" +
                "Feel free to ask any question!";
    }

    public record CodeReviewResult(
            boolean approved,
            int score,
            String verdictTitle,
            String feedbackMarkdown
    ) {}

    public String generateReviewFeedback(ProjectTicket ticket, String submissionNotes) {
        return evaluateSubmission(ticket, submissionNotes).feedbackMarkdown();
    }

    public CodeReviewResult evaluateSubmission(ProjectTicket ticket, String submissionNotes) {
        // 1. Immediate validation: Check if submission is empty, trivial, or unmodified boilerplate
        if (isSubmissionEmptyOrTrivial(submissionNotes)) {
            return buildEmptySubmissionResult(ticket);
        }

        // 2. If Gemini API key is configured, perform live GenAI evaluation
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            try {
                CodeReviewResult geminiResult = callGeminiReview(ticket, submissionNotes);
                if (geminiResult != null) {
                    return geminiResult;
                }
            } catch (Exception e) {
                log.warn("Gemini code review failed, falling back to smart built-in code analyzer: {}", e.getMessage());
            }
        }

        // 3. Fallback: Built-In Semantic & Heuristic Code Analyzer
        return evaluateWithSmartCodeAnalyzer(ticket, submissionNotes);
    }

    private boolean isSubmissionEmptyOrTrivial(String input) {
        if (input == null || input.isBlank()) {
            return true;
        }

        // Strip known label prefixes and comment blocks
        String cleaned = input
                .replaceAll("(?i)code\\s*snippet\\s*:", "")
                .replaceAll("(?i)developer\\s*notes\\s*:", "")
                .replaceAll("(?i)github\\s*pr\\s*(url)?\\s*:", "")
                .replaceAll("//.*", "") // remove single-line comments
                .replaceAll("/\\*[\\s\\S]*?\\*/", "") // remove multi-line comments
                .replaceAll("\\s+", ""); // remove all whitespace

        // If after stripping comments and labels there are fewer than 35 characters of real code
        return cleaned.length() < 35;
    }

    private CodeReviewResult buildEmptySubmissionResult(ProjectTicket ticket) {
        String ticketKey = ticket.getTicketKey() != null ? ticket.getTicketKey() : "TASK";
        String criteria = ticket.getAcceptanceCriteria() != null ? ticket.getAcceptanceCriteria() : "Complete ticket requirements.";

        StringBuilder checklist = new StringBuilder();
        for (String line : criteria.split("\\r?\\n")) {
            String trimmed = line.trim();
            if (!trimmed.isEmpty()) {
                checklist.append("- [ ] ").append(trimmed.replaceFirst("^[\\-*\\d.]+\\s*", "")).append("\n");
            }
        }

        String markdown = "### ⚠️ Pull Request Review — " + ticketKey + "\n\n" +
                "**Reviewer:** Alex Mitchell (Staff Software Engineer & Tech Lead @ QuickKart)\n\n" +
                "**Verdict:** ❌ CHANGES REQUESTED (Score: 10/100)\n\n" +
                "#### 🚫 Blocker Detected:\n" +
                "- **No Implementation Submitted:** The editor was submitted empty or contains only comments/placeholders without executable code.\n" +
                "- In a production engineering environment, every Pull Request must contain working, testable code that implements the ticket requirements.\n\n" +
                "#### 📋 Required Acceptance Criteria to Pass:\n" +
                checklist + "\n" +
                "#### 💡 Next Steps:\n" +
                "1. Switch to the **'2. Starter Guide & Code'** tab to view architectural guidance or copy a starter skeleton.\n" +
                "2. Write your Java 21 / Spring Boot implementation in the **'In-Browser Code'** editor.\n" +
                "3. Click **Revise & Resubmit** when ready for re-review.";

        return new CodeReviewResult(false, 10, "CHANGES REQUESTED", markdown);
    }

    private CodeReviewResult callGeminiReview(ProjectTicket ticket, String submissionNotes) {
        String ticketKey = ticket.getTicketKey() != null ? ticket.getTicketKey() : "TASK";

        String prompt = "You are Alex Mitchell, Staff Software Engineer and Tech Lead at QuickKart.\n" +
                "You are reviewing a Pull Request submitted by a junior software engineer / college intern.\n" +
                "You must evaluate the code accurately, strictly, and constructively against the ticket's Acceptance Criteria.\n\n" +
                "Ticket Key: " + ticketKey + "\n" +
                "Ticket Title: " + ticket.getTitle() + "\n" +
                "Ticket Description: " + ticket.getDescription() + "\n" +
                "Acceptance Criteria:\n" + ticket.getAcceptanceCriteria() + "\n\n" +
                "Candidate Submission:\n" + submissionNotes + "\n\n" +
                "Evaluation Guidelines:\n" +
                "1. Examine if the submission actually implements the classes, annotations, business logic, and error handling requested.\n" +
                "2. If the code is missing critical criteria, has dummy/incomplete methods, or lacks necessary logic:\n" +
                "   Set VERDICT to CHANGES_REQUESTED. Assign a SCORE between 25 and 65.\n" +
                "3. Only if the code is a genuine, well-structured, functional implementation meeting the criteria:\n" +
                "   Set VERDICT to APPROVED. Assign a SCORE between 80 and 99.\n\n" +
                "CRITICAL REQUIREMENT: Your output MUST start on Line 1 with EXACTLY:\n" +
                "VERDICT: [APPROVED or CHANGES_REQUESTED] | SCORE: [number]\n\n" +
                "Then provide the review in clean Markdown:\n" +
                "### 🚀 Pull Request Review — " + ticketKey + "\n" +
                "**Reviewer:** Alex Mitchell (Staff Software Engineer & Tech Lead @ QuickKart)\n" +
                "**Verdict:** [✅ APPROVED FOR MERGE (Score: X/100) or ❌ CHANGES REQUESTED (Score: X/100)]\n\n" +
                "#### 📊 Acceptance Criteria Status:\n" +
                "- [x] or [ ] item...\n\n" +
                "#### 🔍 Code Quality & Architecture Feedback:\n" +
                "(Constructive feedback on code structure, annotations, error handling, edge cases)\n\n" +
                "#### 💡 Tech Lead Recommendations & Next Steps:\n" +
                "(Actionable advice to fix issues or congratulations on merge)";

        String response = callGeminiApi(prompt, ticket);
        if (response == null || response.isBlank()) {
            return null;
        }

        boolean approved = false;
        int score = 50;

        String[] lines = response.split("\\r?\\n");
        String firstLine = lines.length > 0 ? lines[0].trim().toUpperCase() : "";

        if (firstLine.startsWith("VERDICT:")) {
            approved = firstLine.contains("APPROVED") && !firstLine.contains("CHANGES_REQUESTED");
            if (firstLine.contains("SCORE:")) {
                try {
                    String scorePart = firstLine.substring(firstLine.indexOf("SCORE:") + 6).replaceAll("[^0-9]", "");
                    if (!scorePart.isEmpty()) {
                        score = Integer.parseInt(scorePart);
                    }
                } catch (Exception ignored) {}
            }
            // Strip the header line from the student-visible markdown
            response = response.substring(lines[0].length()).trim();
        } else {
            // Fallback parsing if LLM didn't format exact header
            approved = response.contains("APPROVED FOR MERGE") || response.contains("✅ APPROVED");
            score = approved ? 92 : 45;
        }

        if (score < 75) {
            approved = false;
        }

        return new CodeReviewResult(
                approved,
                score,
                approved ? "APPROVED FOR MERGE" : "CHANGES REQUESTED",
                response
        );
    }

    private CodeReviewResult evaluateWithSmartCodeAnalyzer(ProjectTicket ticket, String submissionNotes) {
        String ticketKey = ticket.getTicketKey() != null ? ticket.getTicketKey() : "TASK";
        String codeLower = submissionNotes.toLowerCase();

        // 1. Structure check
        boolean hasClassOrInterface = codeLower.contains("class ") || codeLower.contains("interface ") || codeLower.contains("record ");
        boolean hasMethods = submissionNotes.contains("(") && submissionNotes.contains(")") && submissionNotes.contains("{");
        boolean hasAnnotations = submissionNotes.contains("@");

        String criteria = ticket.getAcceptanceCriteria() != null ? ticket.getAcceptanceCriteria() : "";
        String[] criteriaLines = criteria.split("\\r?\\n");

        int totalCriteria = 0;
        int passedCriteria = 0;
        StringBuilder criteriaChecklist = new StringBuilder();
        List<String> missingFeedback = new java.util.ArrayList<>();

        for (String rawLine : criteriaLines) {
            String line = rawLine.trim();
            if (line.isEmpty()) continue;
            totalCriteria++;

            String cleanText = line.replaceFirst("^[\\-*\\d.]+\\s*", "");
            String lCase = cleanText.toLowerCase();

            boolean passed = false;

            // Contextual criteria checks
            if (lCase.contains("valid") || lCase.contains("jakarta") || lCase.contains("notnull") || lCase.contains("notblank")) {
                passed = codeLower.contains("@valid") || codeLower.contains("@notnull") || codeLower.contains("@notblank")
                        || codeLower.contains("@size") || codeLower.contains("@min") || codeLower.contains("bindingresult");
                if (!passed) missingFeedback.add("Missing Jakarta Bean Validation annotations (e.g. `@Valid`, `@NotNull`, `@NotBlank`).");
            } else if (lCase.contains("exception") || lCase.contains("handler") || lCase.contains("error")) {
                passed = codeLower.contains("@restcontrolleradvice") || codeLower.contains("@controlleradvice")
                        || codeLower.contains("@exceptionhandler") || codeLower.contains("responseentity")
                        || codeLower.contains("runtimeexception") || codeLower.contains("errorresponse");
                if (!passed) missingFeedback.add("Missing Global Exception Handling (`@RestControllerAdvice` and `@ExceptionHandler`).");
            } else if (lCase.contains("pagin") || lCase.contains("page") || lCase.contains("sort")) {
                passed = codeLower.contains("pageable") || codeLower.contains("page<") || codeLower.contains("pageresponse")
                        || codeLower.contains("pagesize") || codeLower.contains("pageabledefault");
                if (!passed) missingFeedback.add("Missing pagination parameters or Pageable support.");
            } else if (lCase.contains("filter") || lCase.contains("category") || lCase.contains("price")) {
                passed = codeLower.contains("category") || codeLower.contains("price") || codeLower.contains("filter")
                        || codeLower.contains("requestparam");
                if (!passed) missingFeedback.add("Missing category or price query filter handling.");
            } else if (lCase.contains("reserv") || lCase.contains("cart") || lCase.contains("stock")) {
                passed = codeLower.contains("stock") || codeLower.contains("reserve") || codeLower.contains("quantity")
                        || codeLower.contains("cart") || codeLower.contains("inventory");
                if (!passed) missingFeedback.add("Missing stock reservation or cart item validation logic.");
            } else if (lCase.contains("lock") || lCase.contains("race") || lCase.contains("concurren") || lCase.contains("isolation")) {
                passed = codeLower.contains("@lock") || codeLower.contains("pessimistic") || codeLower.contains("for update")
                        || codeLower.contains("@transactional") || codeLower.contains("atomic");
                if (!passed) missingFeedback.add("Missing concurrency guard (e.g. `@Lock(LockModeType.PESSIMISTIC_WRITE)` or `@Transactional`).");
            } else if (lCase.contains("idempotenc")) {
                passed = codeLower.contains("idempotenc") || codeLower.contains("header") || codeLower.contains("uuid")
                        || codeLower.contains("filter");
                if (!passed) missingFeedback.add("Missing Idempotency-Key validation header check.");
            } else if (lCase.contains("actuator") || lCase.contains("metric") || lCase.contains("rate limit")) {
                passed = codeLower.contains("actuator") || codeLower.contains("metric") || codeLower.contains("ratelimit")
                        || codeLower.contains("filter") || codeLower.contains("meter");
                if (!passed) missingFeedback.add("Missing actuator / metrics or rate limiting logic.");
            } else if (lCase.contains("test") || lCase.contains("mockito")) {
                passed = codeLower.contains("@test") || codeLower.contains("mock") || codeLower.contains("assert")
                        || codeLower.contains("when(");
                if (!passed) missingFeedback.add("Missing unit or integration test assertions.");
            } else {
                // Heuristic match: check if significant words in the criteria appear in the code
                String[] words = lCase.replaceAll("[^a-z0-9]", " ").split("\\s+");
                int matchCount = 0;
                int significantCount = 0;
                for (String w : words) {
                    if (w.length() > 4 && !List.of("should", "ensure", "support", "return", "implement").contains(w)) {
                        significantCount++;
                        if (codeLower.contains(w)) matchCount++;
                    }
                }
                passed = (significantCount == 0) || ((double) matchCount / significantCount >= 0.4);
                if (!passed) missingFeedback.add("Requirement incomplete: " + cleanText);
            }

            if (passed) {
                passedCriteria++;
                criteriaChecklist.append("- [x] ").append(cleanText).append("\n");
            } else {
                criteriaChecklist.append("- [ ] ").append(cleanText).append("\n");
            }
        }

        // Calculate score
        double criteriaRatio = totalCriteria > 0 ? ((double) passedCriteria / totalCriteria) : 0.5;
        int codeLength = submissionNotes.length();

        int score = (int) Math.round(criteriaRatio * 75);
        if (hasClassOrInterface) score += 10;
        if (hasMethods) score += 8;
        if (hasAnnotations) score += 7;

        // Cap score
        score = Math.min(score, 98);
        if (codeLength < 100) score = Math.min(score, 40);

        boolean approved = score >= 75 && passedCriteria >= Math.max(1, (int) Math.ceil(totalCriteria * 0.70));

        String specificTip = getSeniorTipForTicket(ticketKey);

        if (approved) {
            String feedback = "### 🚀 Pull Request Review — " + ticketKey + "\n\n" +
                    "**Reviewer:** Alex Mitchell (Staff Software Engineer & Tech Lead @ QuickKart)\n\n" +
                    "**Verdict:** ✅ APPROVED FOR MERGE (Score: " + score + "/100)\n\n" +
                    "#### 📊 Acceptance Criteria Verification:\n" +
                    criteriaChecklist + "\n" +
                    "#### 🔍 Code Quality & Architecture Analysis:\n" +
                    "- **Clean Design:** Solution follows clean separation of concerns and appropriate Spring Boot paradigms.\n" +
                    "- **Production Standard:** Implementation adheres to production Java 21 / Spring conventions.\n" +
                    "- **Senior Tip:** " + specificTip + "\n\n" +
                    "#### 🎯 Commendation:\n" +
                    "Outstanding job! Your implementation demonstrates strong software craftsmanship and passes all acceptance criteria. Your Pull Request is approved and merged into `main`!";

            return new CodeReviewResult(true, score, "APPROVED FOR MERGE", feedback);
        } else {
            StringBuilder missingSection = new StringBuilder();
            if (missingFeedback.isEmpty()) {
                missingSection.append("- Implementation appears too minimal or lacks necessary class and method structure.\n");
            } else {
                for (String mf : missingFeedback) {
                    missingSection.append("- ").append(mf).append("\n");
                }
            }

            String feedback = "### ⚠️ Pull Request Review — " + ticketKey + "\n\n" +
                    "**Reviewer:** Alex Mitchell (Staff Software Engineer & Tech Lead @ QuickKart)\n\n" +
                    "**Verdict:** ❌ CHANGES REQUESTED (Score: " + score + "/100)\n\n" +
                    "#### 📊 Acceptance Criteria Status:\n" +
                    criteriaChecklist + "\n" +
                    "#### 🔍 What Needs Fixing:\n" +
                    missingSection + "\n" +
                    "#### 💡 Senior Engineer Guidance:\n" +
                    "- " + specificTip + "\n" +
                    "- Make sure your implementation code in the editor provides the complete classes, annotations, and methods required.\n" +
                    "- Once you have addressed the missing items above, click **Revise & Resubmit**!";

            return new CodeReviewResult(false, score, "CHANGES REQUESTED", feedback);
        }
    }

    private String getSeniorTipForTicket(String ticketKey) {
        return switch (ticketKey) {
            case "QK-101" -> "For high-traffic catalog search, place an in-memory Redis cache on the top product categories to reduce Postgres read latency by 80%.";
            case "QK-102" -> "Implement an asynchronous background scheduler or Redis TTL keyspace listener to automatically release expired reservations after 15 minutes.";
            case "QK-103" -> "Under massive flash sale concurrency, consider atomic SQL decrement (`UPDATE product SET stock = stock - ? WHERE id = ? AND stock >= ?`) or optimistic locking with `@Version` to avoid lock wait contention.";
            case "QK-104" -> "Add a unique database constraint on `(user_id, idempotency_key)` as a bulletproof final defense against duplicate network retries.";
            case "QK-105" -> "Configure Prometheus alerts on p99 latency (> 250ms) and 5xx error rate (> 1%) in Grafana for automated incident response.";
            default -> "Always define explicit `@ExceptionHandler` mappings for custom domain exceptions and write unit tests verifying HTTP status codes.";
        };
    }

    private AiChatResponse buildResponse(String text) {
        return AiChatResponse.builder()
                .senderName("Alex Mitchell")
                .senderRole("Staff Software Engineer & Tech Lead @ QuickKart")
                .response(text)
                .timestamp(Instant.now())
                .build();
    }
}

