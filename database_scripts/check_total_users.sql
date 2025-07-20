-- Check total number of users in profiles table
SELECT COUNT(*) as total_users FROM profiles;

-- Check recent users
SELECT 
    id,
    email,
    full_name,
    created_at,
    role
FROM profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if there are users missing from profiles but in auth.users
SELECT 
    COUNT(*) as auth_users_count
FROM auth.users;

-- Check for users in auth.users but not in profiles
SELECT 
    COUNT(*) as missing_from_profiles
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL; 