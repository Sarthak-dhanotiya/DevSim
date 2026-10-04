ALTER TABLE projects ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE student_profiles ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;
CREATE TABLE student_journeys (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
 skills TEXT NOT NULL DEFAULT '',
 goal VARCHAR(500) NOT NULL DEFAULT '',
 weekly_hours INT NOT NULL DEFAULT 6,
 resume_name VARCHAR(255),
 resume_summary TEXT,
 assessment_score INT,
 assessment_answer TEXT,
 assignment_mode VARCHAR(20) NOT NULL DEFAULT 'AUTOMATED',
 status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
 preferred_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
 request_note VARCHAR(2000),
 admin_note VARCHAR(2000),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE student_ticket_progress ADD COLUMN review_score INT;
ALTER TABLE student_ticket_progress ADD COLUMN review_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE student_ticket_progress ADD COLUMN hints_used INT NOT NULL DEFAULT 0;
ALTER TABLE student_ticket_progress ADD COLUMN review_approved BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE project_tickets ADD COLUMN generation_source VARCHAR(30) NOT NULL DEFAULT 'CURATED';
