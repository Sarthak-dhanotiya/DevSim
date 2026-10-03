-- ====================================================================
-- DevSim Platform - V6 Fix Super Admin Valid BCrypt Password
-- ====================================================================

-- Update existing superadmin record with verified BCrypt hash for "password123"
UPDATE users
SET password_hash = '$2a$10$g4v51enQFNSjysDXO/uWXOLQMLMIJVC9WzVqWoIzKq6g0eOWWID5C',
    role = 'SUPER_ADMIN'
WHERE LOWER(email) = 'superadmin@devsim.com';

-- Ensure user exists if not already present
INSERT INTO users (id, email, password_hash, role)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'superadmin@devsim.com',
    '$2a$10$g4v51enQFNSjysDXO/uWXOLQMLMIJVC9WzVqWoIzKq6g0eOWWID5C',
    'SUPER_ADMIN'
) ON CONFLICT (email) DO UPDATE 
SET password_hash = EXCLUDED.password_hash,
    role = 'SUPER_ADMIN';

-- Ensure profile exists
INSERT INTO student_profiles (id, user_id, name, bio)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Super Admin',
    'Platform Owner and Head of Engineering'
) ON CONFLICT (user_id) DO NOTHING;
