-- EMERGENCY AUTH FIX - Restore Google Authentication
-- This reverts the problematic changes that broke authentication

-- 1. Remove dangerous anon permissions that may have broken auth
REVOKE ALL ON user_usage FROM anon;
REVOKE ALL ON user_subscriptions FROM anon;
REVOKE EXECUTE ON FUNCTION increment_usage(UUID, TEXT, INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION increment_usage(UUID, TEXT) FROM anon;
-- Skip revoking check_ai_usage_limit since it may not exist

-- 2. Restore proper RLS policies for user_usage
DROP POLICY IF EXISTS "Users can manage their own usage data" ON user_usage;
DROP POLICY IF EXISTS "Users can view own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can insert own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can update own usage" ON user_usage;

-- Create separate policies for different operations
CREATE POLICY "Users can view own usage" ON user_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON user_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON user_usage
    FOR UPDATE USING (auth.uid() = user_id);

-- 3. Keep only authenticated user permissions
GRANT SELECT, INSERT, UPDATE ON user_usage TO authenticated;
GRANT SELECT ON user_subscriptions TO authenticated;

-- 4. Update increment_usage to work properly with authenticated users only
CREATE OR REPLACE FUNCTION increment_usage(
    user_uuid UUID,
    usage_type TEXT,
    increment_by INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    current_month VARCHAR(7);
BEGIN
    current_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Only allow if user is authenticated and matches the UUID
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    IF auth.uid() != user_uuid THEN
        RAISE EXCEPTION 'Access denied: Cannot modify usage for other users';
    END IF;
    
    INSERT INTO user_usage (
        user_id, 
        month_year,
        ai_improvements_used,
        plagiarism_checks,
        created_at,
        updated_at
    )
    VALUES (
        user_uuid, 
        current_month,
        CASE WHEN usage_type = 'ai_improvements' THEN increment_by ELSE 0 END,
        CASE WHEN usage_type = 'plagiarism_checks' THEN increment_by ELSE 0 END,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id, month_year) 
    DO UPDATE SET
        ai_improvements_used = CASE 
            WHEN usage_type = 'ai_improvements' THEN user_usage.ai_improvements_used + increment_by
            ELSE user_usage.ai_improvements_used
        END,
        plagiarism_checks = CASE 
            WHEN usage_type = 'plagiarism_checks' THEN user_usage.plagiarism_checks + increment_by  
            ELSE user_usage.plagiarism_checks
        END,
        updated_at = NOW();
    
    RETURN TRUE;
    
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Keep only authenticated permissions for functions
GRANT EXECUTE ON FUNCTION increment_usage(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_usage(UUID, TEXT) TO authenticated;

-- 6. Verification
SELECT 'Authentication Fix Applied - Please try logging in again' as status; 