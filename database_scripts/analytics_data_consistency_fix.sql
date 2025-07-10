-- ====================================
-- ANALYTICS DATA CONSISTENCY FIX
-- ====================================
-- This fixes the user count and AI usage discrepancies shown in the admin dashboard

-- 1. FIX USER COUNT DISCREPANCIES
-- Ensure profiles table exists and is properly populated
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Populate missing profiles from auth.users
INSERT INTO profiles (id, email, created_at)
SELECT 
    u.id, 
    u.email, 
    u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

-- 2. FIX SUBSCRIPTION DATA CONSISTENCY
-- Ensure all users have a subscription record (defaults to free)
INSERT INTO user_subscriptions (user_id, plan_type, status, created_at)
SELECT 
    u.id,
    'free',
    'active',
    u.created_at
FROM auth.users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
WHERE us.user_id IS NULL
ON CONFLICT DO NOTHING;

-- 3. FIX AI USAGE LOG DATA CONSISTENCY
-- Ensure ai_usage_log has proper structure
ALTER TABLE ai_usage_log 
ADD COLUMN IF NOT EXISTS feature_type TEXT DEFAULT 'general_usage',
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 1;

-- Standardize feature type names for consistency
UPDATE ai_usage_log 
SET feature_type = CASE 
    WHEN feature_type IS NULL OR feature_type = '' THEN 'general_usage'
    WHEN feature_type ILIKE '%review%' OR feature_type ILIKE '%sop%' THEN 'reviews'
    WHEN feature_type ILIKE '%grammar%' THEN 'grammar_check'
    WHEN feature_type ILIKE '%tone%' THEN 'tone_analysis'
    WHEN feature_type ILIKE '%plagiarism%' THEN 'plagiarism_checks'
    WHEN feature_type ILIKE '%enhance%' OR feature_type ILIKE '%improve%' THEN 'text_enhancements'
    WHEN feature_type ILIKE '%optim%' OR feature_type ILIKE '%word%' THEN 'word_optimizations'
    ELSE feature_type
END;

-- 4. CREATE ACCURATE ANALYTICS FUNCTIONS
CREATE OR REPLACE FUNCTION get_dashboard_analytics()
RETURNS TABLE (
    -- User Analytics
    total_users BIGINT,
    active_users_30d BIGINT,
    new_users_30d BIGINT,
    
    -- Subscription Analytics
    free_users BIGINT,
    professional_users BIGINT,
    elite_users BIGINT,
    total_premium_users BIGINT,
    
    -- Document Analytics
    total_sops BIGINT,
    total_cover_letters BIGINT,
    total_personal_statements BIGINT,
    total_documents BIGINT,
    
    -- AI Usage Analytics
    total_ai_usage BIGINT,
    reviews_count BIGINT,
    grammar_checks_count BIGINT,
    tone_analysis_count BIGINT,
    plagiarism_checks_count BIGINT,
    text_enhancements_count BIGINT,
    word_optimizations_count BIGINT,
    
    -- Scholarship Analytics
    total_scholarships BIGINT,
    total_applications BIGINT,
    admin_users_count BIGINT
) AS $$
DECLARE
    thirty_days_ago TIMESTAMPTZ := NOW() - INTERVAL '30 days';
BEGIN
    RETURN QUERY
    WITH user_analytics AS (
        -- Get total registered users
        SELECT COUNT(*) as total_users FROM auth.users
    ),
    active_users AS (
        -- Active users in last 30 days (who created documents)
        SELECT COUNT(DISTINCT user_id) as active_count
        FROM (
            SELECT user_id FROM sops WHERE created_at >= thirty_days_ago
            UNION
            SELECT user_id FROM cover_letters WHERE created_at >= thirty_days_ago
            UNION 
            SELECT user_id FROM personal_statements WHERE created_at >= thirty_days_ago
        ) active_users_union
    ),
    new_users AS (
        -- New users in last 30 days
        SELECT COUNT(*) as new_count 
        FROM auth.users 
        WHERE created_at >= thirty_days_ago
    ),
    subscription_analytics AS (
        -- Subscription breakdown
        SELECT 
            COUNT(*) FILTER (WHERE plan_type = 'free') as free_count,
            COUNT(*) FILTER (WHERE plan_type = 'professional') as professional_count,
            COUNT(*) FILTER (WHERE plan_type = 'elite') as elite_count
        FROM user_subscriptions 
        WHERE status = 'active'
    ),
    document_analytics AS (
        -- Document counts
        SELECT 
            (SELECT COUNT(*) FROM sops) as sops_count,
            (SELECT COUNT(*) FROM cover_letters) as cover_letters_count,
            (SELECT COUNT(*) FROM personal_statements) as personal_statements_count
    ),
    ai_analytics AS (
        -- AI usage breakdown
        SELECT 
            COUNT(*) as total_count,
            COUNT(*) FILTER (WHERE feature_type = 'reviews') as reviews_count,
            COUNT(*) FILTER (WHERE feature_type = 'grammar_check') as grammar_count,
            COUNT(*) FILTER (WHERE feature_type = 'tone_analysis') as tone_count,
            COUNT(*) FILTER (WHERE feature_type = 'plagiarism_checks') as plagiarism_count,
            COUNT(*) FILTER (WHERE feature_type = 'text_enhancements') as enhancements_count,
            COUNT(*) FILTER (WHERE feature_type = 'word_optimizations') as optimizations_count
        FROM ai_usage_log
    ),
    scholarship_analytics AS (
        -- Scholarship data
        SELECT 
            (SELECT COUNT(*) FROM scholarships) as scholarships_count,
            (SELECT COUNT(*) FROM scholarship_applications) as applications_count,
            (SELECT COUNT(*) FROM admin_users) as admin_count
    )
    SELECT 
        ua.total_users,
        au.active_count,
        nu.new_count,
        
        sa.free_count,
        sa.professional_count,
        sa.elite_count,
        sa.professional_count + sa.elite_count as total_premium,
        
        da.sops_count,
        da.cover_letters_count,
        da.personal_statements_count,
        da.sops_count + da.cover_letters_count + da.personal_statements_count as total_docs,
        
        aia.total_count,
        aia.reviews_count,
        aia.grammar_count,
        aia.tone_count,
        aia.plagiarism_count,
        aia.enhancements_count,
        aia.optimizations_count,
        
        scha.scholarships_count,
        scha.applications_count,
        scha.admin_count
    FROM user_analytics ua
    CROSS JOIN active_users au
    CROSS JOIN new_users nu
    CROSS JOIN subscription_analytics sa
    CROSS JOIN document_analytics da
    CROSS JOIN ai_analytics aia
    CROSS JOIN scholarship_analytics scha;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CREATE ADMIN CHECK FUNCTION FOR CONSISTENT ACCESS
CREATE OR REPLACE FUNCTION verify_admin_access()
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    role TEXT,
    can_access_analytics BOOLEAN,
    can_manage_admins BOOLEAN,
    can_manage_scholarships BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.user_id,
        COALESCE(p.email, users.email) as email,
        au.role,
        au.role IN ('admin', 'super-admin') as can_access_analytics,
        au.role = 'super-admin' as can_manage_admins,
        au.role IN ('admin', 'super-admin') as can_manage_scholarships
    FROM admin_users au
    LEFT JOIN auth.users users ON au.user_id = users.id
    LEFT JOIN profiles p ON au.user_id = p.id
    WHERE au.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION get_dashboard_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION verify_admin_access() TO authenticated;

-- 7. ENABLE RLS ON MISSING TABLES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own profiles, admins to see all
DROP POLICY IF EXISTS "profiles_access_policy" ON profiles;
CREATE POLICY "profiles_access_policy" ON profiles
FOR ALL USING (
    auth.uid() = id OR 
    EXISTS(SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role IN ('admin', 'super-admin'))
);

-- 8. TEST QUERIES (Uncomment to run verification)
/*
-- Test the analytics function
SELECT * FROM get_dashboard_analytics();

-- Test admin access
SELECT * FROM verify_admin_access();

-- Check subscription distribution
SELECT plan_type, status, COUNT(*) 
FROM user_subscriptions 
GROUP BY plan_type, status 
ORDER BY plan_type;

-- Check AI usage breakdown
SELECT feature_type, COUNT(*) 
FROM ai_usage_log 
GROUP BY feature_type 
ORDER BY COUNT(*) DESC;
*/

-- ====================================
-- ANALYTICS DATA CONSISTENCY FIX COMPLETE
-- ==================================== 