-- Fix AI Usage Tracking - December 2024
-- This fixes the "CASE statement missing ELSE part" error and aligns with aiFeatureService.ts

-- 1. Drop existing problematic function
DROP FUNCTION IF EXISTS increment_usage(UUID, TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS increment_usage(UUID, TEXT) CASCADE;

-- 2. Create new simplified increment_usage function that matches aiFeatureService.ts expectations
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
    
    -- Handle the usage types that aiFeatureService.ts actually sends
    -- ai_improvements, plagiarism_checks are what it sends
    
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
    -- Log error and return false
    RAISE WARNING 'Error in increment_usage: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION increment_usage(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_usage(UUID, TEXT) TO authenticated;

-- 4. Test the function
DO $$
BEGIN
    RAISE NOTICE 'Testing increment_usage function...';
    
    -- This should work without the CASE error
    PERFORM increment_usage(
        'a0000000-0000-0000-0000-000000000000'::UUID,
        'ai_improvements',
        1
    );
    
    RAISE NOTICE 'increment_usage function test completed successfully!';
END
$$;

-- 5. Fix the usage checking logic to match
CREATE OR REPLACE FUNCTION check_ai_usage_limit(
    user_uuid UUID,
    usage_type TEXT,
    plan_type TEXT DEFAULT 'free'
)
RETURNS JSON AS $$
DECLARE
    current_month VARCHAR(7);
    current_usage INTEGER;
    usage_limit INTEGER;
    result JSON;
BEGIN
    current_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Get current usage based on type
    IF usage_type = 'ai_improvements' THEN
        SELECT COALESCE(ai_improvements_used, 0) INTO current_usage
        FROM user_usage 
        WHERE user_id = user_uuid AND month_year = current_month;
        
        -- Set limits based on plan
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
        
        -- Set limits based on plan  
        usage_limit := CASE plan_type
            WHEN 'free' THEN 1
            WHEN 'professional' THEN 5
            WHEN 'elite' THEN 999999
            ELSE 1
        END;
    ELSE
        current_usage := 0;
        usage_limit := 0;
    END IF;
    
    current_usage := COALESCE(current_usage, 0);
    
    -- Build result JSON
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

-- 6. Grant permissions for the check function
GRANT EXECUTE ON FUNCTION check_ai_usage_limit(UUID, TEXT, TEXT) TO authenticated;

-- 7. Verify the setup
SELECT 'AI Usage Tracking Fix Applied Successfully!' as status;

-- 8. Show current usage structure  
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_usage' 
AND column_name IN ('ai_improvements_used', 'plagiarism_checks')
ORDER BY column_name; 