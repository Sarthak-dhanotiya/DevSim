-- ====================================================================
-- DevSim Platform - V5 Super Admin & Dynamic AI Task Schema
-- ====================================================================

-- 1. ADD DYNAMIC AI & PERSONALIZED TARGETING TO PROJECT TICKETS
ALTER TABLE project_tickets ADD COLUMN IF NOT EXISTS target_user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE project_tickets ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE project_tickets ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(30) DEFAULT 'MEDIUM';

CREATE INDEX IF NOT EXISTS idx_tickets_target_user ON project_tickets(target_user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_ai_gen ON project_tickets(is_ai_generated);

-- 2. SEED DEFAULT SUPER ADMIN ACCOUNT (Email: superadmin@devsim.com / Password: password123)
INSERT INTO users (id, email, password_hash, role)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'superadmin@devsim.com',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOcd7mePz512m',
    'SUPER_ADMIN'
) ON CONFLICT (email) DO UPDATE SET role = 'SUPER_ADMIN';

INSERT INTO student_profiles (id, user_id, name, bio)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Super Admin',
    'Platform Owner and Head of Engineering'
) ON CONFLICT (user_id) DO NOTHING;
