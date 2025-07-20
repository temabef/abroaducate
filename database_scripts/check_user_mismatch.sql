-- Check for user ID mismatches between auth.users and profiles
-- This will help identify if there are users in auth.users that aren't in profiles

-- Get all users from auth.users
SELECT 
    id,
    email,
    created_at,
    raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC;

-- Get all users from profiles
SELECT 
    id,
    email,
    created_at,
    role
FROM profiles 
ORDER BY created_at DESC;

-- Check for users in auth.users but not in profiles
SELECT 
    au.id,
    au.email,
    au.created_at,
    'Missing from profiles' as status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC;

-- Check for users in profiles but not in auth.users
SELECT 
    p.id,
    p.email,
    p.created_at,
    'Missing from auth.users' as status
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.id IS NULL
ORDER BY p.created_at DESC; 