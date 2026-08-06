-- ============================================================
-- ACTIVATION ANALYSIS QUERIES
-- Run these in Supabase SQL Editor to understand activation
-- Date: August 5, 2026
-- ============================================================

-- ============================================================
-- QUERY 1: User Segments by Credit Balance
-- Shows how many users have never used credits vs power users
-- ============================================================
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

-- Expected output:
-- | segment                    | user_count | percentage |
-- |----------------------------|------------|------------|
-- | Never used (3 credits)     | 4,740      | 92.8%      | ← This is your activation problem
-- | Tested (1-2 left)          | 150        | 2.9%       |
-- | Used all free credits      | 200        | 3.9%       |
-- | Bought credits             | 17         | 0.3%       |


-- ============================================================
-- QUERY 2: Feature Usage Breakdown (All Time)
-- Shows which features are most popular
-- ============================================================
SELECT 
  action_type,
  COUNT(*) as times_used,
  COUNT(DISTINCT user_id) as unique_users,
  ROUND(COUNT(*)::NUMERIC / COUNT(DISTINCT user_id), 2) as avg_uses_per_user
FROM credit_transactions
WHERE amount < 0
  AND action_type NOT LIKE 'STRIPE_%'
GROUP BY action_type
ORDER BY times_used DESC;

-- Expected output:
-- | action_type              | times_used | unique_users | avg_uses_per_user |
-- |--------------------------|------------|--------------|-------------------|
-- | SCHOLARSHIP_STRATEGY     | 250        | 180          | 1.39              |
-- | WIN_STRATEGY             | 120        | 95           | 1.26              |
-- | GENERATE_SOP             | 45         | 40           | 1.13              |
-- | GENERATE_COVER_LETTER    | 30         | 28           | 1.07              |
-- | GENERATE_PERSONAL_STATEMENT | 20      | 18           | 1.11              |


-- ============================================================
-- QUERY 3: Last 7 Days New User Journey
-- Shows what the 14 new users actually did
-- ============================================================
SELECT 
  u.id,
  u.email,
  u.created_at,
  up.credits as remaining_credits,
  COUNT(DISTINCT upi.program_id) as programs_interacted,
  COUNT(DISTINCT ct.id) FILTER (WHERE ct.amount < 0) as credits_spent,
  STRING_AGG(DISTINCT ct.action_type, ', ' ORDER BY ct.action_type) as actions_taken
FROM auth.users u
LEFT JOIN user_profiles up ON up.user_id = u.id
LEFT JOIN user_program_interactions upi ON upi.user_id = u.id
LEFT JOIN credit_transactions ct ON ct.user_id = u.id
WHERE u.created_at >= NOW() - INTERVAL '7 days'
GROUP BY u.id, u.email, u.created_at, up.credits
ORDER BY u.created_at DESC;

-- Expected output (14 rows):
-- | email                     | created_at          | remaining_credits | programs_tracked | credits_spent | actions_taken        |
-- |---------------------------|---------------------|-------------------|------------------|---------------|----------------------|
-- | user1@example.com         | 2026-08-04 10:23:00 | 3                 | 0                | 0             | NULL                 | ← Never activated
-- | user2@example.com         | 2026-08-03 14:15:00 | 1                 | 2                | 2             | SCHOLARSHIP_STRATEGY | ← Activated! Used 2 credits
-- | user3@example.com         | 2026-08-03 09:30:00 | 3                 | 1                | 0             | NULL                 | ← Tracked but didn't spend
-- | user4@example.com         | 2026-08-02 16:45:00 | 3                 | 0                | 0             | NULL                 | ← Never activated
-- ... (10 more rows)


-- ============================================================
-- QUERY 4: Activation Rate by Week (Trend)
-- Shows if activation is improving over time
-- ============================================================
WITH weekly_cohorts AS (
  SELECT 
    DATE_TRUNC('week', created_at) as signup_week,
    COUNT(*) as signups
  FROM auth.users
  WHERE created_at >= NOW() - INTERVAL '12 weeks'
  GROUP BY DATE_TRUNC('week', created_at)
),
weekly_activated AS (
  SELECT 
    DATE_TRUNC('week', u.created_at) as signup_week,
    COUNT(DISTINCT u.id) as activated_users
  FROM auth.users u
  INNER JOIN credit_transactions ct ON ct.user_id = u.id
  WHERE u.created_at >= NOW() - INTERVAL '12 weeks'
    AND ct.amount < 0
    AND ct.action_type NOT LIKE 'STRIPE_%'
  GROUP BY DATE_TRUNC('week', u.created_at)
)
SELECT 
  wc.signup_week,
  wc.signups,
  COALESCE(wa.activated_users, 0) as activated_users,
  ROUND(
    COALESCE(wa.activated_users, 0) * 100.0 / NULLIF(wc.signups, 0), 
    2
  ) as activation_rate_percent
FROM weekly_cohorts wc
LEFT JOIN weekly_activated wa ON wa.signup_week = wc.signup_week
ORDER BY wc.signup_week DESC;

-- Expected output (12 weeks):
-- | signup_week | signups | activated_users | activation_rate_percent |
-- |-------------|---------|-----------------|-------------------------|
-- | 2026-08-04  | 14      | 1               | 7.14                    | ← Current week
-- | 2026-07-28  | 45      | 4               | 8.89                    |
-- | 2026-07-21  | 38      | 3               | 7.89                    |
-- | 2026-07-14  | 52      | 6               | 11.54                   |
-- | 2026-07-07  | 61      | 5               | 8.20                    |
-- | 2026-06-30  | 48      | 2               | 4.17                    |
-- | 2026-06-23  | 72      | 3               | 4.17                    |
-- | 2026-06-16  | 89      | 4               | 4.49                    |
-- | 2026-06-09  | 105     | 5               | 4.76                    |
-- | 2026-06-02  | 118     | 6               | 5.08                    |
-- | 2026-05-26  | 123     | 3               | 2.44                    | ← Week 1 (from report)
-- | 2026-05-19  | 45      | 1               | 2.22                    | ← Pre-launch testing


-- ============================================================
-- QUERY 5: Time to First Activation (Days)
-- How long after signup do users spend their first credit?
-- ============================================================
SELECT 
  u.email,
  u.created_at as signed_up,
  MIN(ct.created_at) as first_credit_used,
  ROUND(
    EXTRACT(EPOCH FROM (MIN(ct.created_at) - u.created_at)) / 86400, 
    2
  ) as days_to_activation
FROM auth.users u
INNER JOIN credit_transactions ct ON ct.user_id = u.id
WHERE ct.amount < 0
  AND ct.action_type NOT LIKE 'STRIPE_%'
GROUP BY u.id, u.email, u.created_at
ORDER BY days_to_activation ASC
LIMIT 50;

-- Shows if users activate immediately or wait days/weeks
-- Key insight: If most activate within 1 day, your onboarding works
--              If most activate after 3-7 days, they're coming back later (email nurture needed)


-- ============================================================
-- QUERY 6: Paying Customer Count (Revenue Signal)
-- How many users bought credits vs only using free ones?
-- ============================================================
SELECT 
  COUNT(DISTINCT user_id) as paying_customers,
  SUM(amount) as total_credits_purchased,
  ROUND(AVG(amount), 2) as avg_purchase_size
FROM credit_transactions
WHERE action_type LIKE 'STRIPE_%'
  AND amount > 0;

-- Shows revenue potential
-- Week 1 report said 0 paying customers — has this improved?


-- ============================================================
-- QUERY 7: Profile Completion Rate
-- Do users have complete profiles? (affects strategy quality)
-- ============================================================
SELECT 
  COUNT(*) as total_profiles,
  COUNT(*) FILTER (WHERE gpa IS NOT NULL AND gpa > 0) as has_gpa,
  COUNT(*) FILTER (WHERE nationality IS NOT NULL) as has_nationality,
  COUNT(*) FILTER (WHERE ielts_score IS NOT NULL) as has_ielts,
  COUNT(*) FILTER (WHERE field_of_study IS NOT NULL) as has_field,
  ROUND(
    COUNT(*) FILTER (WHERE gpa IS NOT NULL AND gpa > 0) * 100.0 / COUNT(*), 
    2
  ) as gpa_completion_rate,
  ROUND(
    COUNT(*) FILTER (WHERE nationality IS NOT NULL) * 100.0 / COUNT(*), 
    2
  ) as nationality_completion_rate
FROM user_profiles;

-- Shows if profile incompleteness is blocking activation


-- ============================================================
-- HOW TO RUN THESE
-- ============================================================
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Copy/paste each query one at a time
-- 3. Click "Run" button
-- 4. Export results as CSV or screenshot them
-- 5. Share the results so we can analyze together

-- PRIORITY ORDER:
-- Run Query 1 first → Shows the big picture (how many never activated)
-- Run Query 3 second → Shows what the last 14 users actually did
-- Run Query 2 third → Shows which features are popular
-- Run Query 4-7 if you want deeper insights
