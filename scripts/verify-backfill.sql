-- Verify the backfill worked correctly
-- Run this in Supabase SQL Editor

-- 1. Check if all users now have profiles
SELECT 
  COUNT(*) as total_users,
  COUNT(up.user_id) as users_with_profiles,
  COUNT(*) - COUNT(up.user_id) as users_without_profiles
FROM auth.users u
LEFT JOIN user_profiles up ON up.user_id = u.id;

-- Expected: users_without_profiles = 0

-- 2. Check credit distribution after backfill
SELECT 
  credits,
  COUNT(*) as user_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM user_profiles
GROUP BY credits
ORDER BY credits DESC;

-- Expected to see:
-- credits = 3 for most users (backfilled + new)
-- credits = 2, 1, 0 for activated users
-- credits > 3 for paying customers

-- 3. Re-run Query 1 to see the new segments
WITH segments AS (
  SELECT 
    CASE 
      WHEN credits = 3 THEN 'Never used (3 credits)'
      WHEN credits BETWEEN 1 AND 2 THEN 'Tested (1-2 left)'
      WHEN credits = 0 THEN 'Used all free credits'
      WHEN credits > 3 THEN 'Bought credits'
      ELSE 'Unknown'
    END as segment,
    CASE 
      WHEN credits = 3 THEN 1
      WHEN credits BETWEEN 1 AND 2 THEN 2
      WHEN credits = 0 THEN 3
      WHEN credits > 3 THEN 4
      ELSE 5
    END as sort_order
  FROM user_profiles
)
SELECT 
  segment,
  COUNT(*) as user_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM segments
GROUP BY segment, sort_order
ORDER BY sort_order;

-- This will show if the 5,206 "null" users are now in "Never used (3 credits)"
