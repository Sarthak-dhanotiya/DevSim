-- 1. PROJECT TICKETS TABLE
CREATE TABLE IF NOT EXISTS project_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    ticket_key VARCHAR(30) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    acceptance_criteria TEXT NOT NULL,
    ticket_type VARCHAR(30) NOT NULL DEFAULT 'FEATURE',
    priority VARCHAR(30) NOT NULL DEFAULT 'MEDIUM',
    estimated_hours INT DEFAULT 4,
    order_index INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_project_id ON project_tickets(project_id);
CREATE INDEX IF NOT EXISTS idx_tickets_order ON project_tickets(order_index);

-- 2. STUDENT TICKET PROGRESS TABLE
CREATE TABLE IF NOT EXISTS student_ticket_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES student_project_enrollments(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES project_tickets(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'TODO',
    branch_name VARCHAR(150),
    submission_notes TEXT,
    ai_review_feedback TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_enrollment_ticket UNIQUE(enrollment_id, ticket_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_enrollment ON student_ticket_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_progress_ticket ON student_ticket_progress(ticket_id);

-- 3. SEED 5 REALISTIC TICKETS FOR QuickKart Commerce Backend
INSERT INTO project_tickets (
    id,
    project_id,
    ticket_key,
    title,
    description,
    acceptance_criteria,
    ticket_type,
    priority,
    estimated_hours,
    order_index
)
VALUES
(
    'a1111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333333',
    'QK-101',
    'Implement Product Catalog REST APIs with Category Filtering & Pagination',
    'QuickKart needs a robust catalog service allowing clients to search and list products. Implement GET /api/v1/catalog/products with query parameters for category, price range, and page/size pagination.',
    '- Support pagination (page, size, sort by price or name).
- Support filtering by category ID and minimum/maximum price.
- Return HTTP 200 with standard PageResponse DTO.
- Write unit tests for ProductService and integration test for ProductController.',
    'FEATURE',
    'HIGH',
    4,
    1
),
(
    'a2222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    'QK-102',
    'Implement Shopping Cart & Stock Reservation Service',
    'Build an in-memory or persisted Cart reservation system. When an item is added to cart during checkout, temporarily reserve available inventory for 15 minutes before expiring.',
    '- Cart items must validate available quantity before adding.
- Stock reservation should prevent overselling when multiple users checkout.
- Return clear error if inventory is insufficient (HTTP 400 InsufficientStockException).',
    'FEATURE',
    'HIGH',
    6,
    2
),
(
    'a3333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    'QK-103',
    'Fix Race Condition in Inventory Decrement during Concurrent Checkout',
    'Bug Incident Report #402: Under high flash sale concurrency, inventory counts occasionally drop below 0 due to non-atomic read-then-write updates. Implement pessimistic locking or atomic database updates.',
    '- Use SELECT ... FOR UPDATE or JPA @Lock(LockModeType.PESSIMISTIC_WRITE) on the Product inventory row.
- Ensure isolation prevents negative stock under 50 concurrent requests.
- Add concurrency integration test simulating parallel checkouts.',
    'BUG',
    'CRITICAL',
    5,
    3
),
(
    'a4444444-4444-4444-4444-444444444444',
    '33333333-3333-3333-3333-333333333333',
    'QK-104',
    'Implement Order Placement with Idempotency Key Validation',
    'Clients may retry POST /api/v1/orders on network timeouts. Implement an Idempotency-Key header mechanism so duplicate requests do not charge or place duplicate orders.',
    '- Read "Idempotency-Key" header from incoming order creation requests.
- If key was processed within 24 hours, return cached response with same order ID.
- Reject requests missing idempotency key on mutation endpoint.',
    'FEATURE',
    'HIGH',
    6,
    4
),
(
    'a5555555-5555-5555-5555-555555555555',
    '33333333-3333-3333-3333-333333333333',
    'QK-105',
    'Add Spring Boot Actuator Health Checks & Custom Business Metrics',
    'Prepare the QuickKart Commerce Backend for production observability. Expose /actuator/health with custom database & disk space indicators, plus a Micrometer counter for orders placed.',
    '- Enable /actuator/health and /actuator/metrics with secure access.
- Implement custom HealthIndicator for PaymentGateway and InventoryService.
- Increment "orders.placed.total" metric whenever an order succeeds.',
    'REFACTOR',
    'MEDIUM',
    3,
    5
)
ON CONFLICT (ticket_key) DO NOTHING;
