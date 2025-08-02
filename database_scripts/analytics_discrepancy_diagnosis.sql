-- ========================================
-- ANALYTICS DISCREPANCY DIAGNOSIS
-- ========================================
-- This script will help identify why the user counts don't match

-- 1. Check total users from auth.users
SELECT 'Total users in auth.users:' as description, COUNT(*) as count FROM auth.users;

-- 2. Check all subscription statuses and plan types
SELECT 
    'All subscriptions by status and plan:' as description,
    plan_type,
    status,
    COUNT(*) as count
FROM user_subscriptions 
GROUP BY plan_type, status
ORDER BY plan_type, status;

-- 3. Check active subscriptions only
SELECT 
    'Active subscriptions only:' as description,
    plan_type,
    COUNT(*) as count
FROM user_subscriptions 
WHERE status = 'active'
GROUP BY plan_type
ORDER BY plan_type;

-- 4. Check users with no subscriptions
SELECT 
    'Users with NO subscriptions:' as description,
    COUNT(*) as count
FROM auth.users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id
WHERE us.id IS NULL;

-- 5. Check users with multiple subscriptions
SELECT 
    'Users with multiple subscriptions:' as description,
    user_id,
    COUNT(*) as subscription_count
FROM user_subscriptions
GROUP BY user_id
HAVING COUNT(*) > 1
ORDER BY subscription_count DESC;

-- 6. Check users with inactive subscriptions
SELECT 
    'Users with inactive subscriptions:' as description,
    plan_type,
    status,
    COUNT(*) as count
FROM user_subscriptions 
WHERE status != 'active'
GROUP BY plan_type, status
ORDER BY plan_type, status;

-- 7. Calculate expected free users
WITH user_counts AS (
    SELECT 
        (SELECT COUNT(*) FROM auth.users) as total_users,
        (SELECT COUNT(*) FROM user_subscriptions WHERE plan_type = 'professional' AND status = 'active') as professional_users,
        (SELECT COUNT(*) FROM user_subscriptions WHERE plan_type = 'elite' AND status = 'active') as elite_users
)
SELECT 
    'Expected calculation:' as description,
    total_users,
    professional_users,
    elite_users,
    (total_users - professional_users - elite_users) as expected_free_users
FROM user_counts;

-- 8. Check for any orphaned subscriptions (users that don't exist in auth.users)
SELECT 
    'Orphaned subscriptions (users not in auth.users):' as description,
    COUNT(*) as count
FROM user_subscriptions us
LEFT JOIN auth.users u ON us.user_id = u.id
WHERE u.id IS NULL;

-- 9. Check subscription creation dates to see if there are old inactive ones
SELECT 
    'Subscription age analysis:' as description,
    plan_type,
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM user_subscriptions
GROUP BY plan_type, status
ORDER BY plan_type, status; 