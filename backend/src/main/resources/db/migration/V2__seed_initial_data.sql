-- 1. SEED CAREER TRACK: Java Backend Developer
INSERT INTO career_tracks (id, name, slug, description, icon_url, is_active)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Java Backend Developer',
    'java-backend-developer',
    'Learn real-world backend engineering by working on Java, Spring Boot, PostgreSQL, Redis, APIs and production-style projects.',
    '/icons/java.svg',
    true
) ON CONFLICT (slug) DO NOTHING;

-- 2. SEED VIRTUAL COMPANY: QuickKart
INSERT INTO virtual_companies (id, name, slug, description, industry, company_size, logo_url, is_active)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'QuickKart',
    'quickkart',
    'A growing e-commerce technology company building scalable backend systems for customers, products, orders and payments.',
    'E-Commerce',
    '50-200 employees',
    '/companies/quickkart.svg',
    true
) ON CONFLICT (slug) DO NOTHING;

-- 3. SEED PROJECT: QuickKart Commerce Backend
INSERT INTO projects (
    id,
    company_id,
    career_track_id,
    name,
    slug,
    short_description,
    description,
    difficulty,
    estimated_duration,
    is_active
)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'QuickKart Commerce Backend',
    'quickkart-commerce-backend',
    'Build and maintain backend services for an e-commerce platform including products, customers, orders and inventory.',
    'Build and maintain backend services for an e-commerce platform including products, customers, orders and inventory. You will develop robust REST APIs, handle data persistence with PostgreSQL, implement secure authentication, and write clean production-quality Java code following industry engineering standards.',
    'BEGINNER',
    '4 weeks',
    true
) ON CONFLICT (slug) DO NOTHING;

-- 4. SEED PROJECT TECHNOLOGIES
INSERT INTO project_technologies (id, project_id, technology_name)
VALUES
    (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Java 21'),
    (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Spring Boot'),
    (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'PostgreSQL'),
    (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'REST API'),
    (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Git'),
    (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Maven')
ON CONFLICT (project_id, technology_name) DO NOTHING;
