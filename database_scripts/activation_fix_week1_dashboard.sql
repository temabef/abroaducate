-- ========================================
-- ACTIVATION FIX — WEEK 1 EFFECTIVENESS CHECK
-- ========================================
-- Run this entire script in Supabase SQL Editor
-- Copy all results and paste into Slack/doc for review
-- Expected runtime: <5 seconds
-- ========================================

-- ========================================
-- 1. TRIGGER STATUS CHECK
-- ========================================
-- Verify the auto-profile-creation trigger is active
SELECT 
  '1. TRIGGER STATUS' as check_name,
  COUNT(*) as trigger_exists,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ Trigger is active'
    ELSE '❌ TRIGGER MISSING — FIX IMMEDIATELY'
  END as status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- ========================================
-- 2. MISSING PROFILES CHECK
-- ========================================
-- All users should have profiles (credits should never be null)
SELECT 
  '2. MISSING PROFILES' as check_name,
  COUNT(*) as users_without_profiles,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ All users have profiles'
    ELSE '❌ SOME USERS MISSING PROFILES — CHECK TRIGGER'
  END as status
FROM auth.users u
LEFT JOIN user_profiles up ON up.user_id = u.id
WHERE up.credits IS NULL;

-- ========================================
-- 3. NEW SIGNUPS PROFILE CREATION (LAST 7 DAYS)
-- ========================================
-- Verify every new signup gets a profile automatically
SELECT 
  '3. NEW SIGNUPS PROFILE CHECK' as check_name,
  DATE(u.created_at) as date,
  COUNT(u.id) as signups,
  COUNT(up.user_id) as profiles_created,
  COUNT(u.id) - COUNT(up.user_id) as missing_profiles,
  CASE 
    WHEN COUNT(u.id) - COUNT(up.user_id) = 0 THEN '✅'
    ELSE '❌ MISSING PROFILES'
  END as status
FROM auth.users u
LEFT JOIN user_profiles up ON up.user_id = u.id
WHERE u.created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(u.created_at)
ORDER BY date DESC;

-- ========================================
-- 4. ACTIVATION RATE — BEFORE VS AFTER FIX
-- ========================================
-- Compare activation in the week before vs week after fix
-- Fix deployed: 2026-07-29
WITH fix_date AS (
  SELECT '2026-07-29'::date as fix_deployed
),
before_fix AS (
  SELECT 
    COUNT(DISTINCT u.id) as signups,
    COUNT(DISTINCT ct.user_id) as activated
  FROM auth.users u
  LEFT JOIN credit_transactions ct 
    ON ct.user_id = u.id 
    AND ct.amount < 0
    AND ct.action_type NOT LIKE 'STRIPE_%'
  CROSS JOIN fix_date
  WHERE u.created_at >= fix_date.fix_deployed - INTERVAL '7 days'
    AND u.created_at < fix_date.fix_deployed
),
after_fix AS (
  SELECT 
    COUNT(DISTINCT u.id) as signups,
    COUNT(DISTINCT ct.user_id) as activated
  FROM auth.users u
  LEFT JOIN credit_transactions ct 
    ON ct.user_id = u.id 
    AND ct.amount < 0
    AND ct.action_type NOT LIKE 'STRIPE_%'
  CROSS JOIN fix_date
  WHERE u.created_at >= fix_date.fix_deployed
    AND u.created_at < fix_date.fix_deployed + INTERVAL '7 days'
)
SELECT 
  '4. ACTIVATION COMPARISON' as check_name,
  'Before Fix (July 22-28)' as period,
  signups,
  activated,
  ROUND(activated * 100.0 / NULLIF(signups, 0), 2) as activation_rate,
  CASE 
    WHEN ROUND(activated * 100.0 / NULLIF(signups, 0), 2) < 15 THEN '⚠️ Low activation (expected)'
    ELSE '✅ Baseline established'
  END as status
FROM before_fix
UNION ALL
SELECT 
  '4. ACTIVATION COMPARISON' as check_name,
  'After Fix (July 29-Aug 4)' as period,
  signups,
  activated,
  ROUND(activated * 100.0 / NULLIF(signups, 0), 2) as activation_rate,
  CASE 
    WHEN ROUND(activated * 100.0 / NULLIF(signups, 0), 2) >= 25 THEN '🎉 EXCELLENT (25%+)'
    WHEN ROUND(activated * 100.0 / NULLIF(signups, 0), 2) >= 15 THEN '✅ GOOD (15-25%)'
    WHEN ROUND(activated * 100.0 / NULLIF(signups, 0), 2) >= 10 THEN '⚠️ IMPROVEMENT NEEDED (10-15%)'
    ELSE '❌ FIX NOT WORKING (<10%)'
  END as status
FROM after_fix;

-- ========================================
-- 5. DAILY ACTIVATION RATE TREND (LAST 14 DAYS)
-- ========================================
-- Day-by-day view to see when activation improved
WITH daily_stats AS (
  SELECT 
    DATE(u.created_at) as signup_date,
    COUNT(DISTINCT u.id) as signups,
    COUNT(DISTINCT CASE 
      WHEN ct.created_at IS NOT NULL THEN ct.user_id 
    END) as activated_users
  FROM auth.users u
  LEFT JOIN credit_transactions ct 
    ON ct.user_id = u.id 
    AND ct.amount < 0
    AND ct.action_type NOT LIKE 'STRIPE_%'
  WHERE u.created_at >= NOW() - INTERVAL '14 days'
  GROUP BY DATE(u.created_at)
)
SELECT 
  '5. DAILY ACTIVATION TREND' as check_name,
  signup_date,
  signups,
  activated_users,
  ROUND(activated_users * 100.0 / NULLIF(signups, 0), 2) as activation_rate,
  CASE 
    WHEN signup_date < '2026-07-29' THEN '❌ Before Fix'
    ELSE '✅ After Fix'
  END as period
FROM daily_stats
ORDER BY signup_date DESC;

-- ========================================
-- 6. FEATURE USAGE BREAKDOWN (LAST 7 DAYS)
-- ========================================
-- What features are users activating with?
SELECT 
  '6. FEATURE USAGE' as check_name,
  action_type,
  COUNT(*) as total_uses,
  COUNT(DISTINCT user_id) as unique_users,
  ROUND(AVG(ABS(amount)), 2) as avg_credits_per_use,
  CASE 
    WHEN action_type = 'SCHOLARSHIP_STRATEGY' THEN '🎯 Most popular (1 credit)'
    WHEN action_type IN ('SOP', 'COVER_LETTER', 'PERSONAL_STATEMENT') THEN '📄 Document generation (2 credits)'
    WHEN action_type = 'WIN_STRATEGY' THEN '💎 Premium feature (3 credits)'
    ELSE '🔧 Other'
  END as notes
FROM credit_transactions
WHERE amount < 0
  AND action_type NOT LIKE 'STRIPE_%'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY action_type
ORDER BY total_uses DESC;

-- ========================================
-- 7. USER SEGMENTS BY CREDIT BALANCE
-- ========================================
-- See credit distribution across all users
WITH user_segments AS (
  SELECT 
    CASE 
      WHEN credits >= 20 THEN '💰 Bought Credits (20+)'
      WHEN credits BETWEEN 4 AND 19 THEN '🛒 Small Purchase (4-19)'
      WHEN credits = 3 THEN '🆕 Never Activated (3 credits)'
      WHEN credits BETWEEN 1 AND 2 THEN '✅ Tested Once (1-2 left)'
      WHEN credits = 0 THEN '🔥 Used All (0 credits)'
      ELSE '❓ Unknown'
    END as segment,
    COUNT(*) as users,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
  FROM user_profiles
  GROUP BY 
    CASE 
      WHEN credits >= 20 THEN '💰 Bought Credits (20+)'
      WHEN credits BETWEEN 4 AND 19 THEN '🛒 Small Purchase (4-19)'
      WHEN credits = 3 THEN '🆕 Never Activated (3 credits)'
      WHEN credits BETWEEN 1 AND 2 THEN '✅ Tested Once (1-2 left)'
      WHEN credits = 0 THEN '🔥 Used All (0 credits)'
      ELSE '❓ Unknown'
    END
)
SELECT 
  '7. USER SEGMENTS' as check_name,
  segment,
  users,
  percentage
FROM user_segments
ORDER BY 
  CASE 
    WHEN segment LIKE '%Never%' THEN 1
    WHEN segment LIKE '%Tested%' THEN 2
    WHEN segment LIKE '%Used All%' THEN 3
    WHEN segment LIKE '%Small%' THEN 4
    WHEN segment LIKE '%Bought%' THEN 5
    ELSE 6
  END;

-- ========================================
-- 8. OVERALL PLATFORM ACTIVATION STATS
-- ========================================
-- High-level view of all-time activation
WITH total_users AS (
  SELECT COUNT(*) as total FROM user_profiles
),
activated_users AS (
  SELECT COUNT(DISTINCT user_id) as total 
  FROM credit_transactions 
  WHERE amount < 0 
    AND action_type NOT LIKE 'STRIPE_%'
),
paying_users AS (
  SELECT COUNT(DISTINCT user_id) as total 
  FROM credit_transactions 
  WHERE action_type LIKE 'STRIPE_%'
)
SELECT 
  '8. OVERALL STATS' as check_name,
  tu.total as total_users,
  au.total as activated_users,
  pu.total as paying_users,
  ROUND(au.total * 100.0 / tu.total, 2) as lifetime_activation_rate,
  ROUND(pu.total * 100.0 / tu.total, 2) as conversion_to_paid_rate
FROM total_users tu, activated_users au, paying_users pu;

-- ========================================
-- 9. RECENT ACTIVATION ACTIONS (LAST 10)
-- ========================================
-- See the most recent activations to verify everything is working
SELECT 
  '9. RECENT ACTIVATIONS' as check_name,
  ct.created_at,
  au.email,
  ct.action_type,
  ABS(ct.amount) as credits_spent,
  up.credits as credits_remaining
FROM credit_transactions ct
JOIN user_profiles up ON up.user_id = ct.user_id
JOIN auth.users au ON au.id = ct.user_id
WHERE ct.amount < 0
  AND ct.action_type NOT LIKE 'STRIPE_%'
ORDER BY ct.created_at DESC
LIMIT 10;

-- ========================================
-- 10. SUMMARY & NEXT STEPS
-- ========================================
-- Auto-generated recommendations based on activation rate
WITH activation_check AS (
  SELECT 
    COUNT(DISTINCT u.id) as signups,
    COUNT(DISTINCT ct.user_id) as activated,
    ROUND(COUNT(DISTINCT ct.user_id) * 100.0 / NULLIF(COUNT(DISTINCT u.id), 0), 2) as rate
  FROM auth.users u
  LEFT JOIN credit_transactions ct 
    ON ct.user_id = u.id 
    AND ct.amount < 0
    AND ct.action_type NOT LIKE 'STRIPE_%'
  WHERE u.created_at >= '2026-07-29'
)
SELECT 
  '10. SUMMARY & NEXT STEPS' as check_name,
  CASE 
    WHEN rate >= 25 THEN '🎉 FIX IS WORKING! Activation at ' || rate || '% (target: 25%+). Continue optimizing discovery and trust signals.'
    WHEN rate >= 15 THEN '✅ FIX IS EFFECTIVE. Activation at ' || rate || '% (target: 15-25%). Next: Improve feature discovery on programs page.'
    WHEN rate >= 10 THEN '⚠️ PARTIAL IMPROVEMENT. Activation at ' || rate || '% (target: 15%+). Next: Add sample strategy preview + onboarding banner.'
    ELSE '❌ FIX NOT EFFECTIVE. Activation at ' || rate || '% (target: 15%+). Check trigger status and investigate behavioral blockers.'
  END as recommendation,
  signups as new_users_last_7_days,
  activated as activated_users,
  rate as activation_rate
FROM activation_check;

-- ========================================
-- END OF DASHBOARD
-- ========================================
-- Copy all results and save to: docs/ACTIVATION_FIX_WEEK1_RESULTS.md
-- Compare to expected targets in: docs/ACTIVATION_FIX_WEEK1_CHECK.md
-- ========================================
