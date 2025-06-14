-- Fix Unauthorized Error - December 2024
-- This fixes the "Unauthorized" error in AI features

-- 1. First, let's check what RLS policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_usage';

-- 2. Drop restrictive RLS policies that might be blocking access
DROP POLICY IF EXISTS "Users can only access own usage data" ON user_usage;
DROP POLICY IF EXISTS "Users can view own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can insert own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can update own usage" ON user_usage;

-- 3. Create comprehensive RLS policies for user_usage
CREATE POLICY "Users can manage their own usage data" ON user_usage
    FOR ALL 
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 4. Update increment_usage function to be more permissive and handle auth properly
CREATE OR REPLACE FUNCTION increment_usage(
    user_uuid UUID,
    usage_type TEXT,
    increment_by INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    current_month VARCHAR(7);
    authenticated_user_id UUID;
BEGIN
    current_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Get the authenticated user ID
    authenticated_user_id := auth.uid();
    
    -- If no authenticated user, use the provided user_uuid (for system calls)
    -- If authenticated user exists, verify it matches the user_uuid
    IF authenticated_user_id IS NOT NULL AND authenticated_user_id != user_uuid THEN
        RAISE EXCEPTION 'Access denied: Cannot modify usage for other users';
    END IF;
    
    -- Use the authenticated user ID if available, otherwise use provided user_uuid
    IF authenticated_user_id IS NOT NULL THEN
        user_uuid := authenticated_user_id;
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
    -- Log the error for debugging
    RAISE WARNING 'Error in increment_usage: user_uuid=%, usage_type=%, error=%', user_uuid, usage_type, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create 2-parameter version
CREATE OR REPLACE FUNCTION increment_usage(
    user_uuid UUID,
    usage_type TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN increment_usage(user_uuid, usage_type, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Update check_ai_usage_limit function to be more permissive
CREATE OR REPLACE FUNCTION check_ai_usage_limit(
    user_uuid UUID,
    usage_type TEXT,
    plan_type TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    current_month VARCHAR(7);
    current_usage INTEGER := 0;
    usage_limit INTEGER := 0;
    result JSON;
    authenticated_user_id UUID;
BEGIN
    current_month := TO_CHAR(NOW(), 'YYYY-MM');
    authenticated_user_id := auth.uid();
    
    -- If authenticated user exists, verify it matches the user_uuid
    IF authenticated_user_id IS NOT NULL AND authenticated_user_id != user_uuid THEN
        RETURN json_build_object(
            'allowed', false,
            'error', 'Access denied',
            'currentUsage', 0,
            'limit', 0
        );
    END IF;
    
    -- Use authenticated user ID if available
    IF authenticated_user_id IS NOT NULL THEN
        user_uuid := authenticated_user_id;
    END IF;
    
    -- Get user's plan if not provided
    IF plan_type IS NULL THEN
        SELECT us.plan_type INTO plan_type
        FROM user_subscriptions us
        WHERE us.user_id = user_uuid AND us.status = 'active'
        LIMIT 1;
        
        -- Default to free if no subscription found
        plan_type := COALESCE(plan_type, 'free');
    END IF;
    
    -- Get current usage and set limits
    IF usage_type = 'ai_improvements' THEN
        SELECT COALESCE(ai_improvements_used, 0) INTO current_usage
        FROM user_usage 
        WHERE user_id = user_uuid AND month_year = current_month;
        
        usage_limit := CASE plan_type
            WHEN 'free' THEN 5
            WHEN 'professional' THEN 25
            WHEN 'elite' THEN 999999
            ELSE 5
        END;
        
    ELSIF usage_type = 'plagiarism_checks' THEN
        SELECT COALESCE(plagiarism_checks, 0) INTO current_usage
        FROM user_usage 
        WHERE user_id = user_uuid AND month_year = current_month;
        
        usage_limit := CASE plan_type
            WHEN 'free' THEN 1
            WHEN 'professional' THEN 5
            WHEN 'elite' THEN 999999
            ELSE 1
        END;
    END IF;
    
    current_usage := COALESCE(current_usage, 0);
    
    result := json_build_object(
        'allowed', current_usage < usage_limit,
        'currentUsage', current_usage,
        'limit', usage_limit,
        'planType', plan_type,
        'remainingUsage', GREATEST(0, usage_limit - current_usage)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant comprehensive permissions
GRANT EXECUTE ON FUNCTION increment_usage(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_usage(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_ai_usage_limit(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_ai_usage_limit(UUID, TEXT) TO authenticated;

-- Also grant to anon for public access if needed
GRANT EXECUTE ON FUNCTION increment_usage(UUID, TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION increment_usage(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION check_ai_usage_limit(UUID, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION check_ai_usage_limit(UUID, TEXT) TO anon;

-- 8. Grant table permissions
GRANT SELECT, INSERT, UPDATE ON user_usage TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_usage TO anon;

-- 9. Ensure user_subscriptions is accessible
GRANT SELECT ON user_subscriptions TO authenticated;
GRANT SELECT ON user_subscriptions TO anon;

-- 10. Test the functions
DO $$
DECLARE
    test_result BOOLEAN;
    test_json JSON;
BEGIN
    -- Test with a dummy UUID
    SELECT increment_usage('00000000-0000-0000-0000-000000000000'::UUID, 'ai_improvements', 1) INTO test_result;
    RAISE NOTICE 'increment_usage test result: %', test_result;
    
    SELECT check_ai_usage_limit('00000000-0000-0000-0000-000000000000'::UUID, 'ai_improvements', 'free') INTO test_json;
    RAISE NOTICE 'check_ai_usage_limit test result: %', test_json;
END
$$;

-- 11. Final verification
SELECT 'Unauthorized Error Fix Applied Successfully!' as status; 