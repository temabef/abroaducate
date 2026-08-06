-- Check if your test signup worked correctly
-- Run this in Supabase SQL Editor

-- Find the most recent user (your test account)
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.email_confirmed_at,
  up.credits,
  up.created_at as profile_created_at,
  CASE 
    WHEN up.credits IS NOT NULL THEN '✅ Has credits'
    ELSE '❌ No profile'
  END as status
FROM auth.users u
LEFT JOIN user_profiles up ON up.user_id = u.id
ORDER BY u.created_at DESC
LIMIT 5;

-- Expected result for your test account:
-- | email              | created_at          | credits | status        |
-- |--------------------|--------------------|---------|---------------|
-- | your-test@mail.com | 2026-08-05 XX:XX:XX | 3       | ✅ Has credits |
