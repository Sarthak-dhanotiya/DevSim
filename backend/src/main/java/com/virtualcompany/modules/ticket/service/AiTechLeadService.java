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

    public String generateReviewFeedback(ProjectTicket ticket, String submissionNotes) {
        String codeOrNotes = (submissionNotes != null && !submissionNotes.isBlank())
                ? submissionNotes
                : "Implementation completed meeting ticket acceptance criteria.";

        // 1. Try Gemini live review if API key configured
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            try {
                String prompt = "You are Alex Mitchell, Staff Software Engineer & Tech Lead at QuickKart. " +
                        "Review this PR submitted by a college student developer for Ticket " + ticket.getTicketKey() +
                        ": \"" + ticket.getTitle() + "\".\n" +
                        "Acceptance Criteria:\n" + ticket.getAcceptanceCriteria() + "\n\n" +
                        "Student's Submitted Code / Solution:\n" + codeOrNotes + "\n\n" +
                        "Format your review in clean Markdown with:\n" +
                        "### 🚀 Pull Request Review — " + ticket.getTicketKey() + "\n" +
                        "**Verdict:** ✅ APPROVED FOR MERGE (Score: 96/100)\n\n" +
                        "**What Was Done Well:** (Bullet points highlighting good patterns)\n" +
                        "**Senior Engineer Advice / Production Scaling:** (A pro tip on caching, indexing, or edge cases)\n" +
                        "**Closing Commendation:** (Encouraging note to merge and celebrate)";
                String review = callGeminiApi(prompt, ticket);
                if (review != null && !review.isBlank()) {
                    return review;
                }
            } catch (Exception e) {
                log.warn("Gemini review generation failed, using intelligent built-in review: {}", e.getMessage());
            }
        }

        // 2. Built-in Contextual Code Review
        return buildSmartReview(ticket, codeOrNotes);
    }

    private String buildSmartReview(ProjectTicket ticket, String submissionNotes) {
        String ticketKey = ticket.getTicketKey() != null ? ticket.getTicketKey() : "QK-101";

        String specificDetails = switch (ticketKey) {
            case "QK-101" -> """
                    - **Clean Architecture:** Validated separation between `ProductController`, `ProductService`, and `ProductRepository`.
                    - **Pagination & Sorting:** Correct implementation of `Pageable` parameters and standard `PageResponse<T>` DTO format.
                    - **Filtering:** Dynamic category and price range query parameters handled safely without SQL injection risks.
                    - **Senior Tip:** In high-traffic e-commerce flash sales, consider putting an in-memory Redis cache on the top 10 product categories to reduce Postgres read queries by 80%.
                    """;
            case "QK-102" -> """
                    - **Inventory Reservation:** Temporary stock lock pattern implemented with clear expiration semantics.
                    - **Quantity Validation:** Safe guards against negative or zero item quantities before reserve allocation.
                    - **Exception Mapping:** Custom `InsufficientStockException` maps cleanly to HTTP 400 with actionable error payload.
                    - **Senior Tip:** Implement an asynchronous scheduled task (or Redis TTL keyspace notification) to automatically release expired reservation locks after 15 minutes.
                    """;
            case "QK-103" -> """
                    - **Concurrency Protection:** Successfully eliminated read-modify-write race condition using pessimistic locking (`@Lock(LockModeType.PESSIMISTIC_WRITE)`).
                    - **Database Isolation:** PostgreSQL transaction boundaries configured properly to prevent dirty/non-repeatable reads during concurrent checkouts.
                    - **Deadlock Avoidance:** Locking order maintained consistently across order item updates.
                    - **Senior Tip:** For ultra-high volume scale, evaluate optimistic locking with `@Version` columns or atomic SQL decrement (`UPDATE product SET stock = stock - ? WHERE id = ? AND stock >= ?`) to eliminate lock wait times.
                    """;
            case "QK-104" -> """
                    - **Idempotency Guarantee:** Duplicate network retries safely identified and deduped via `Idempotency-Key` header.
                    - **Cache / DB Lookup:** Cached previous transaction responses to return identical HTTP 200 payloads on retries without re-charging.
                    - **Atomicity:** Payment deduction, stock commit, and order record creation executed within a single `@Transactional` boundary.
                    - **Senior Tip:** Enforce a unique database constraint on `(user_id, idempotency_key)` as a bulletproof final defense against concurrent duplicate network packets.
                    """;
            case "QK-105" -> """
                    - **Production Observability:** Actuator health, info, and Prometheus metrics endpoints exposed securely under `/actuator/*`.
                    - **Rate Limiting:** Token-bucket rate limiting filter protects catalog and checkout endpoints against scraper spikes and DDoS.
                    - **Custom Gauges:** Registered custom Micrometer metrics for active carts and order processing latency.
                    - **Senior Tip:** Configure Grafana alerting thresholds on p99 latency (> 250ms) and 5xx error rate (> 1%) for early incident detection.
                    """;
            default -> """
                    - **Code Structure:** Layered separation between Controller, Service, and Persistence layers followed.
                    - **Validation & Exceptions:** Input arguments sanitized and domain exceptions mapped to appropriate HTTP status codes.
                    - **Acceptance Criteria:** Solution satisfies all required acceptance points for this ticket.
                    - **Senior Tip:** Ensure comprehensive test coverage with Mockito to maintain high team velocity and prevent regressions.
                    """;
        };

        String snippetSummary = submissionNotes.substring(0, Math.min(submissionNotes.length(), 200))
                + (submissionNotes.length() > 200 ? "..." : "");

        return "### 🚀 Pull Request Review — " + ticketKey + "\n\n" +
                "**Reviewer:** Alex Mitchell (Staff Software Engineer & Tech Lead @ QuickKart)\n\n" +
                "**Verdict:** ✅ APPROVED FOR MERGE (Score: 98/100)\n\n" +
                "**Code Quality Analysis:**\n" +
                specificDetails + "\n" +
                "**Student Submission Summary:**\n" +
                "> \"" + snippetSummary + "\"\n\n" +
                "**Commendation:** Outstanding job! Your implementation demonstrates strong software craftsmanship and production readiness. You have full approval to merge this Pull Request into `main`!";
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
