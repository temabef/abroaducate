-- Check if user has a profile
SELECT 
  au.id as user_id,
  au.email,
  up.credits,
  f.rating,
  f.created_at as feedback_date
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
LEFT JOIN early_user_feedback f ON au.id = f.user_id
WHERE au.email = 'ebenezerkojoofosu@gmail.com';

-- If profile exists but credits are null, update to 20
UPDATE user_profiles
SET credits = 20
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'ebenezerkojoofosu@gmail.com'
)
AND credits IS NULL;

-- If no profile exists, create one with 20 credits
INSERT INTO user_profiles (user_id, credits, workspace_data)
SELECT 
  id,
  20,
  '{}'::jsonb
FROM auth.users
WHERE email = 'ebenezerkojoofosu@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET credits = 20;

-- Verify the fix
SELECT 
  au.email,
  up.credits,
  f.rating,
  f.credits_awarded
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
LEFT JOIN early_user_feedback f ON au.id = f.user_id
WHERE au.email = 'ebenezerkojoofosu@gmail.com';
