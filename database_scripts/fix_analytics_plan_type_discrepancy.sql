-- ========================================
-- FIX ANALYTICS PLAN TYPE DISCREPANCY
-- ========================================
-- This fixes the issue where analytics don't account for all plan types

-- 1. First, let's see what plan types exist in the database
SELECT 'Current plan types in user_subscriptions:' as description;
SELECT DISTINCT plan_type, COUNT(*) as count 
FROM user_subscriptions 
GROUP BY plan_type 
ORDER BY plan_type;

-- 2. Check if there are any 'basic' or 'pro' subscriptions that should be counted
SELECT 'Old plan type subscriptions:' as description;
SELECT 
    plan_type,
    status,
    COUNT(*) as count
FROM user_subscriptions 
WHERE plan_type IN ('basic', 'pro')
GROUP BY plan_type, status
ORDER BY plan_type, status;

-- 3. Update the analytics function to account for ALL plan types
CREATE OR REPLACE FUNCTION get_dashboard_analytics()
RETURNS TABLE (
    total_users BIGINT,
    active_users_30d BIGINT,
    new_users_30d BIGINT,
    free_users BIGINT,
    professional_users BIGINT,
    elite_users BIGINT,
    total_premium_users BIGINT,
    total_sops BIGINT,
    total_cover_letters BIGINT,
    total_personal_statements BIGINT,
    total_documents BIGINT,
    total_ai_usage BIGINT,
    reviews_count BIGINT,
    grammar_checks_count BIGINT,
    tone_analysis_count BIGINT,
    plagiarism_checks_count BIGINT,
    text_enhancements_count BIGINT,
    word_optimizations_count BIGINT,
    total_scholarships BIGINT,
    total_applications BIGINT,
    admin_users_count BIGINT
) AS $$
DECLARE
    thirty_days_ago TIMESTAMPTZ := NOW() - INTERVAL '30 days';
    total_users_count BIGINT := 0;
    active_count BIGINT := 0;
    new_count BIGINT := 0;
    professional_count BIGINT := 0;
    elite_count BIGINT := 0;
    free_count BIGINT := 0;
    sops_count BIGINT := 0;
    cover_letters_count BIGINT := 0;
    personal_statements_count BIGINT := 0;
    scholarships_count BIGINT := 0;
    applications_count BIGINT := 0;
    admin_count BIGINT := 0;
    ai_usage_count BIGINT := 0;
BEGIN
    -- Get total users from auth.users (most reliable)
    SELECT COUNT(*) INTO total_users_count FROM auth.users;
    
    -- Get subscription counts - account for ALL plan types
    SELECT 
        COUNT(*) FILTER (WHERE plan_type IN ('professional', 'basic') AND status = 'active'),
        COUNT(*) FILTER (WHERE plan_type IN ('elite', 'pro') AND status = 'active')
    INTO professional_count, elite_count
    FROM user_subscriptions;
    
    -- Calculate free users (users with no active subscriptions)
    free_count := total_users_count - professional_count - elite_count;
    
    -- Get active users (who created documents in last 30 days)
    SELECT COUNT(DISTINCT user_id) INTO active_count
    FROM (
        SELECT user_id FROM sops WHERE created_at >= thirty_days_ago
        UNION
        SELECT user_id FROM cover_letters WHERE created_at >= thirty_days_ago
        UNION 
        SELECT user_id FROM personal_statements WHERE created_at >= thirty_days_ago
    ) active_users_union;
    
    -- Get new users (last 30 days)
    SELECT COUNT(*) INTO new_count 
    FROM auth.users 
    WHERE created_at >= thirty_days_ago;
    
    -- Get document counts
    SELECT COUNT(*) INTO sops_count FROM sops;
    SELECT COUNT(*) INTO cover_letters_count FROM cover_letters;
    SELECT COUNT(*) INTO personal_statements_count FROM personal_statements;
    
    -- Get scholarship data
    SELECT COUNT(*) INTO scholarships_count FROM scholarships;
    SELECT COUNT(*) INTO applications_count FROM scholarship_applications;
    
    -- Get admin count
    SELECT COUNT(*) INTO admin_count FROM admin_users;
    
    -- Get AI usage (if table exists)
    BEGIN
        SELECT COUNT(*) INTO ai_usage_count FROM ai_usage_log;
    EXCEPTION
        WHEN undefined_table THEN
            ai_usage_count := 0;
    END;
    
    -- Return the data
    RETURN QUERY
    SELECT 
        total_users_count,
        active_count,
        new_count,
        free_count,
        professional_count,
        elite_count,
        professional_count + elite_count as total_premium,
        sops_count,
        cover_letters_count,
        personal_statements_count,
        sops_count + cover_letters_count + personal_statements_count as total_docs,
        ai_usage_count,
        0::BIGINT as reviews_count, -- Simplified for now
        0::BIGINT as grammar_count,
        0::BIGINT as tone_count,
        0::BIGINT as plagiarism_count,
        0::BIGINT as enhancements_count,
        0::BIGINT as optimizations_count,
        scholarships_count,
        applications_count,
        admin_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_dashboard_analytics() TO authenticated;

-- 4. Test the updated function
SELECT 'Testing updated get_dashboard_analytics function...';
SELECT * FROM get_dashboard_analytics();

-- 5. Show the breakdown of what was counted
SELECT 'Detailed subscription breakdown:' as description;
SELECT 
    'Active subscriptions by plan type:' as category,
    plan_type,
    COUNT(*) as count
FROM user_subscriptions 
WHERE status = 'active'
GROUP BY plan_type
ORDER BY plan_type;

-- 6. Show the calculation
WITH counts AS (
    SELECT 
        (SELECT COUNT(*) FROM auth.users) as total_users,
        (SELECT COUNT(*) FROM user_subscriptions WHERE plan_type IN ('professional', 'basic') AND status = 'active') as professional_users,
        (SELECT COUNT(*) FROM user_subscriptions WHERE plan_type IN ('elite', 'pro') AND status = 'active') as elite_users
)
SELECT 
    'Final calculation:' as description,
    total_users,
    professional_users,
    elite_users,
    (total_users - professional_users - elite_users) as free_users,
    (professional_users + elite_users) as total_premium_users
FROM counts; 