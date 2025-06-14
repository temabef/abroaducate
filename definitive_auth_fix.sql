-- DEFINITIVE AUTH FIX - December 2024
-- This fixes the authentication issue by resolving schema conflicts
-- and restoring the original working configuration

-- ========================================
-- STEP 1: REMOVE PROBLEMATIC PERMISSIONS
-- ========================================

-- Remove all anon permissions that broke authentication
REVOKE ALL ON user_usage FROM anon;
REVOKE ALL ON user_subscriptions FROM anon;
REVOKE ALL ON plan_limits FROM anon;

-- ========================================
-- STEP 2: DROP ALL CONFLICTING FUNCTIONS
-- ========================================

DROP FUNCTION IF EXISTS increment_usage(UUID, TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS increment_usage(UUID, TEXT) CASCADE;

-- ========================================
-- STEP 3: RESTORE ORIGINAL TABLE SCHEMA
-- ========================================

-- Ensure user_usage table has the ORIGINAL working schema
-- (month_year VARCHAR, not month DATE)
ALTER TABLE user_usage DROP COLUMN IF EXISTS month CASCADE;
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS month_year VARCHAR(7);

-- Ensure all required columns exist with correct names
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS sops_created INTEGER DEFAULT 0;
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS ai_improvements_used INTEGER DEFAULT 0;
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS analytics_generated INTEGER DEFAULT 0;
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS plagiarism_checks INTEGER DEFAULT 0;

-- ========================================
-- STEP 4: RESTORE ORIGINAL WORKING FUNCTION
-- ========================================

-- Recreate the ORIGINAL working increment_usage function
-- This matches the schema from add_subscription_system.sql
CREATE OR REPLACE FUNCTION increment_usage(
    user_uuid UUID,
    usage_type VARCHAR(50),
    increment_by INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    current_month VARCHAR(7);
    current_plan VARCHAR(50);
    plan_limit INTEGER;
    current_usage INTEGER;
BEGIN
    -- Security check: ensure user can only modify their own data
    IF user_uuid != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: Cannot modify usage for other users';
    END IF;
    
    current_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Get user's current plan
    SELECT plan_type INTO current_plan
    FROM user_subscriptions
    WHERE user_id = user_uuid AND status = 'active'
    LIMIT 1;
    
    IF current_plan IS NULL THEN
        current_plan := 'free';
    END IF;
    
    -- Get plan limit for this usage type
    CASE usage_type
        WHEN 'sops_created' THEN
            SELECT sops_limit INTO plan_limit FROM plan_limits WHERE plan_type = current_plan;
        WHEN 'ai_improvements_used' THEN
            SELECT ai_improvements_limit INTO plan_limit FROM plan_limits WHERE plan_type = current_plan;
        WHEN 'analytics_generated' THEN
            SELECT analytics_limit INTO plan_limit FROM plan_limits WHERE plan_type = current_plan;
        WHEN 'plagiarism_checks' THEN
            SELECT plagiarism_checks_limit INTO plan_limit FROM plan_limits WHERE plan_type = current_plan;
        ELSE
            RAISE EXCEPTION 'Invalid usage_type: %', usage_type;
    END CASE;
    
    -- If limit is NULL (unlimited), allow increment
    IF plan_limit IS NULL THEN
        -- Insert or update usage
        INSERT INTO user_usage (user_id, month_year, sops_created, ai_improvements_used, analytics_generated, plagiarism_checks)
        VALUES (
            user_uuid, 
            current_month,
            CASE WHEN usage_type = 'sops_created' THEN increment_by ELSE 0 END,
            CASE WHEN usage_type = 'ai_improvements_used' THEN increment_by ELSE 0 END,
            CASE WHEN usage_type = 'analytics_generated' THEN increment_by ELSE 0 END,
            CASE WHEN usage_type = 'plagiarism_checks' THEN increment_by ELSE 0 END
        )
        ON CONFLICT (user_id, month_year) DO UPDATE SET
            sops_created = user_usage.sops_created + CASE WHEN usage_type = 'sops_created' THEN increment_by ELSE 0 END,
            ai_improvements_used = user_usage.ai_improvements_used + CASE WHEN usage_type = 'ai_improvements_used' THEN increment_by ELSE 0 END,
            analytics_generated = user_usage.analytics_generated + CASE WHEN usage_type = 'analytics_generated' THEN increment_by ELSE 0 END,
            plagiarism_checks = user_usage.plagiarism_checks + CASE WHEN usage_type = 'plagiarism_checks' THEN increment_by ELSE 0 END,
            updated_at = NOW();
        RETURN TRUE;
    END IF;
    
    -- Get current usage
    CASE usage_type
        WHEN 'sops_created' THEN
            SELECT COALESCE(sops_created, 0) INTO current_usage FROM user_usage WHERE user_id = user_uuid AND month_year = current_month;
        WHEN 'ai_improvements_used' THEN
            SELECT COALESCE(ai_improvements_used, 0) INTO current_usage FROM user_usage WHERE user_id = user_uuid AND month_year = current_month;
        WHEN 'analytics_generated' THEN
            SELECT COALESCE(analytics_generated, 0) INTO current_usage FROM user_usage WHERE user_id = user_uuid AND month_year = current_month;
        WHEN 'plagiarism_checks' THEN
            SELECT COALESCE(plagiarism_checks, 0) INTO current_usage FROM user_usage WHERE user_id = user_uuid AND month_year = current_month;
    END CASE;
    
    current_usage := COALESCE(current_usage, 0);
    
    -- Check if increment would exceed limit
    IF current_usage + increment_by > plan_limit THEN
        RETURN FALSE;
    END IF;
    
    -- Increment usage
    INSERT INTO user_usage (user_id, month_year, sops_created, ai_improvements_used, analytics_generated, plagiarism_checks)
    VALUES (
        user_uuid, 
        current_month,
        CASE WHEN usage_type = 'sops_created' THEN increment_by ELSE 0 END,
        CASE WHEN usage_type = 'ai_improvements_used' THEN increment_by ELSE 0 END,
        CASE WHEN usage_type = 'analytics_generated' THEN increment_by ELSE 0 END,
        CASE WHEN usage_type = 'plagiarism_checks' THEN increment_by ELSE 0 END
    )
    ON CONFLICT (user_id, month_year) DO UPDATE SET
        sops_created = user_usage.sops_created + CASE WHEN usage_type = 'sops_created' THEN increment_by ELSE 0 END,
        ai_improvements_used = user_usage.ai_improvements_used + CASE WHEN usage_type = 'ai_improvements_used' THEN increment_by ELSE 0 END,
        analytics_generated = user_usage.analytics_generated + CASE WHEN usage_type = 'analytics_generated' THEN increment_by ELSE 0 END,
        plagiarism_checks = user_usage.plagiarism_checks + CASE WHEN usage_type = 'plagiarism_checks' THEN increment_by ELSE 0 END,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create 2-parameter version for backward compatibility
CREATE OR REPLACE FUNCTION increment_usage(
    user_uuid UUID,
    usage_type TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN increment_usage(user_uuid, usage_type::VARCHAR(50), 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- STEP 5: RESTORE PROPER RLS POLICIES
-- ========================================

-- Drop all conflicting policies
DROP POLICY IF EXISTS "Users can manage their own usage data" ON user_usage;
DROP POLICY IF EXISTS "Users can manage own usage data" ON user_usage;
DROP POLICY IF EXISTS "Users can view own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can insert own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can update own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can only access own usage data" ON user_usage;

-- Create the ORIGINAL working RLS policy
CREATE POLICY "Users can only access own usage data" ON user_usage
    FOR ALL USING (user_id = auth.uid());

-- ========================================
-- STEP 6: SET PROPER PERMISSIONS
-- ========================================

-- Grant proper permissions to authenticated users ONLY
GRANT EXECUTE ON FUNCTION increment_usage(UUID, VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_usage(UUID, TEXT) TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 7: VERIFICATION
-- ========================================

SELECT 'Authentication and Database Schema Restored Successfully!' as status; 