-- SQL Queries to Check User Counts for Super Page Dashboard
-- Copy and paste these queries in your Supabase SQL Editor

-- 1. Total users in auth.users (all registered users)
SELECT 
  COUNT(*) as total_auth_users,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_signups_30_days,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_signups_7_days,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN 1 END) as recent_signups_1_day
FROM auth.users;

-- 2. Users with profiles (completed profiles)
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_profiles_30_days
FROM profiles;

-- 3. Users with active subscriptions
SELECT 
  COUNT(*) as total_subscriptions,
  COUNT(CASE WHEN plan_type = 'professional' AND status = 'active' THEN 1 END) as professional_users,
  COUNT(CASE WHEN plan_type = 'elite' AND status = 'active' THEN 1 END) as elite_users,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as total_active_subscriptions
FROM user_subscriptions;

-- 4. Newsletter subscribers
SELECT 
  COUNT(*) as total_newsletter_subscribers,
  COUNT(CASE WHEN status = 'subscribed' THEN 1 END) as active_subscribers
FROM newsletter_subscribers;

-- 5. Active users (users who signed in recently)
SELECT 
  COUNT(*) as active_users_30_days
FROM auth.users 
WHERE last_sign_in_at >= NOW() - INTERVAL '30 days';

-- 6. Complete user breakdown
SELECT 
  'Total Auth Users' as metric,
  COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
  'Users with Profiles' as metric,
  COUNT(*) as count
FROM profiles
UNION ALL
SELECT 
  'Active Subscriptions' as metric,
  COUNT(*) as count
FROM user_subscriptions WHERE status = 'active'
UNION ALL
SELECT 
  'Newsletter Subscribers' as metric,
  COUNT(*) as count
FROM newsletter_subscribers WHERE status = 'subscribed'
UNION ALL
SELECT 
  'Active Users (30 days)' as metric,
  COUNT(*) as count
FROM auth.users WHERE last_sign_in_at >= NOW() - INTERVAL '30 days';

-- 7. Daily signup trend (last 30 days)
SELECT 
  DATE(created_at) as signup_date,
  COUNT(*) as new_users
FROM auth.users 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY signup_date DESC;

-- 8. Authentication method breakdown
SELECT 
  CASE 
    WHEN raw_user_meta_data->>'provider' = 'google' THEN 'Google'
    WHEN raw_user_meta_data->>'provider' = 'email' THEN 'Email'
    ELSE 'Other'
  END as auth_method,
  COUNT(*) as count
FROM auth.users
GROUP BY auth_method; 