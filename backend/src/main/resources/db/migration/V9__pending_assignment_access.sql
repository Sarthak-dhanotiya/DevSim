-- Existing guided requests must wait for approval even when onboarding was previously marked complete.
UPDATE student_profiles p SET onboarding_completed = FALSE
FROM student_journeys j WHERE p.user_id = j.user_id AND j.status = 'PENDING_REVIEW';
