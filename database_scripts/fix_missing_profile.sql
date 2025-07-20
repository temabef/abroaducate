-- Fix missing user profile for the session user
-- This will add the current session user to the profiles table

INSERT INTO profiles (
    id,
    email,
    full_name,
    created_at,
    updated_at,
    role
) VALUES (
    'f443d194-4b56-48da-9251-6c3f790f0f33',
    'solakolawole62@gmail.com',
    'Admin User',
    NOW(),
    NOW(),
    'super-admin'
) ON CONFLICT (id) DO UPDATE SET
    role = 'super-admin',
    updated_at = NOW();

-- Verify the user was added
SELECT id, email, role FROM profiles WHERE id = 'f443d194-4b56-48da-9251-6c3f790f0f33'; 