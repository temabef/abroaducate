-- ========================================
-- FIX AI ANALYTICS BREAKDOWN
-- ========================================
-- This fixes the AI usage analytics to show proper breakdown by feature type

-- First, let's check what data exists in ai_usage_log
DO $$
DECLARE
    total_count BIGINT := 0;
    feature_record RECORD;
BEGIN
    RAISE NOTICE '=== CHECKING AI USAGE LOG DATA ===';
    
    -- Check if ai_usage_log table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_usage_log') THEN
        RAISE NOTICE 'ai_usage_log table exists';
        
        -- Show total count
        EXECUTE 'SELECT COUNT(*) FROM ai_usage_log' INTO total_count;
        RAISE NOTICE 'Total AI usage records: %', total_count;
        
        -- Show breakdown by feature_type
        FOR feature_record IN 
            EXECUTE 'SELECT feature_type, COUNT(*) as count FROM ai_usage_log GROUP BY feature_type ORDER BY count DESC'
        LOOP
            RAISE NOTICE 'Feature: % - Count: %', feature_record.feature_type, feature_record.count;
        END LOOP;
    ELSE
        RAISE NOTICE 'ai_usage_log table does not exist';
    END IF;
END $$;

-- Update the analytics function to properly break down AI usage
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
    
    -- AI usage counts
    total_ai_usage_count BIGINT := 0;
    reviews_count_val BIGINT := 0;
    grammar_checks_count_val BIGINT := 0;
    tone_analysis_count_val BIGINT := 0;
    plagiarism_checks_count_val BIGINT := 0;
    text_enhancements_count_val BIGINT := 0;
    word_optimizations_count_val BIGINT := 0;
BEGIN
    -- Get total users from auth.users (most reliable)
    SELECT COUNT(*) INTO total_users_count FROM auth.users;
    
    -- Get subscription counts - properly categorize all plan types
    SELECT 
        COUNT(*) FILTER (WHERE plan_type IN ('professional', 'basic') AND status = 'active'),
        COUNT(*) FILTER (WHERE plan_type IN ('elite', 'pro') AND status = 'active')
    INTO professional_count, elite_count
    FROM user_subscriptions;
    
    -- Calculate free users correctly:
    -- Free users = Users with no subscriptions + Users with 'free' plan type subscriptions
    SELECT 
        COUNT(*) FILTER (WHERE us.id IS NULL) + 
        COUNT(*) FILTER (WHERE us.plan_type = 'free' AND us.status = 'active')
    INTO free_count
    FROM auth.users u
    LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active';
    
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
    
    -- Get AI usage breakdown (if table exists)
    BEGIN
        -- Total AI usage
        SELECT COUNT(*) INTO total_ai_usage_count FROM ai_usage_log;
        
        -- Breakdown by feature type
        SELECT COUNT(*) INTO reviews_count_val 
        FROM ai_usage_log 
        WHERE feature_type IN ('reviews', 'sop_review', 'review');
        
        SELECT COUNT(*) INTO grammar_checks_count_val 
        FROM ai_usage_log 
        WHERE feature_type IN ('grammar_check', 'grammar_checks', 'grammar');
        
        SELECT COUNT(*) INTO tone_analysis_count_val 
        FROM ai_usage_log 
        WHERE feature_type IN ('tone_analysis', 'tone_analyses', 'tone');
        
        SELECT COUNT(*) INTO plagiarism_checks_count_val 
        FROM ai_usage_log 
        WHERE feature_type IN ('plagiarism_check', 'plagiarism_checks', 'plagiarism');
        
        SELECT COUNT(*) INTO text_enhancements_count_val 
        FROM ai_usage_log 
        WHERE feature_type IN ('text_enhancement', 'text_enhancements', 'enhancement');
        
        SELECT COUNT(*) INTO word_optimizations_count_val 
        FROM ai_usage_log 
        WHERE feature_type IN ('word_optimization', 'word_optimizations', 'optimization');
        
    EXCEPTION
        WHEN undefined_table THEN
            -- If ai_usage_log doesn't exist, set all AI counts to 0
            total_ai_usage_count := 0;
            reviews_count_val := 0;
            grammar_checks_count_val := 0;
            tone_analysis_count_val := 0;
            plagiarism_checks_count_val := 0;
            text_enhancements_count_val := 0;
            word_optimizations_count_val := 0;
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
        total_ai_usage_count,
        reviews_count_val,
        grammar_checks_count_val,
        tone_analysis_count_val,
        plagiarism_checks_count_val,
        text_enhancements_count_val,
        word_optimizations_count_val,
        scholarships_count,
        applications_count,
        admin_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_dashboard_analytics() TO authenticated;

-- Test the updated function
SELECT 'Testing updated AI analytics function...' as status;
SELECT * FROM get_dashboard_analytics();

-- Show detailed AI usage breakdown for verification
SELECT 'Detailed AI usage breakdown for verification:' as description;

-- Check if ai_usage_log exists and show breakdown
DO $$
DECLARE
    feature_record RECORD;
    total_count BIGINT := 0;
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_usage_log') THEN
        -- Get total count
        EXECUTE 'SELECT COUNT(*) FROM ai_usage_log' INTO total_count;
        RAISE NOTICE 'Total AI usage records: %', total_count;
        
        -- Show breakdown by feature_type
        FOR feature_record IN 
            EXECUTE 'SELECT feature_type, COUNT(*) as count FROM ai_usage_log GROUP BY feature_type ORDER BY count DESC'
        LOOP
            RAISE NOTICE 'Feature: % - Count: %', feature_record.feature_type, feature_record.count;
        END LOOP;
    ELSE
        RAISE NOTICE 'ai_usage_log table does not exist - AI usage tracking may not be set up';
    END IF;
END $$;

-- Show user breakdown for comparison
SELECT 'User breakdown comparison:' as description;
WITH user_breakdown AS (
    SELECT 
        (SELECT COUNT(*) FROM auth.users) as total_users,
        (SELECT COUNT(*) FROM user_subscriptions WHERE plan_type = 'free' AND status = 'active') as free_plan_users,
        (SELECT COUNT(*) FROM user_subscriptions WHERE plan_type IN ('professional', 'basic') AND status = 'active') as professional_users,
        (SELECT COUNT(*) FROM user_subscriptions WHERE plan_type IN ('elite', 'pro') AND status = 'active') as elite_users,
        (SELECT COUNT(*) FROM auth.users u LEFT JOIN user_subscriptions us ON u.id = us.user_id WHERE us.id IS NULL) as no_subscription_users
)
SELECT 
    'User breakdown:' as category,
    total_users,
    free_plan_users,
    professional_users,
    elite_users,
    no_subscription_users,
    (no_subscription_users + free_plan_users) as calculated_free_users,
    (professional_users + elite_users) as calculated_premium_users,
    ((no_subscription_users + free_plan_users) + professional_users + elite_users) as total_calculated
FROM user_breakdown; 