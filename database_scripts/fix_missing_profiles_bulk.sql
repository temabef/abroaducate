-- Fix missing profiles for all users in auth.users
-- This will create profile entries for users who registered but don't have profiles

INSERT INTO profiles (id, email, full_name, created_at, updated_at, role)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
    au.created_at,
    au.updated_at,
    'user' as role
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
AND au.email IS NOT NULL;

-- Verify the fix
SELECT 
    'Total users in auth.users' as description,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'Total users in profiles' as description,
    COUNT(*) as count
FROM profiles
UNION ALL
SELECT 
    'Users missing from profiles' as description,
    COUNT(*) as count
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL; 