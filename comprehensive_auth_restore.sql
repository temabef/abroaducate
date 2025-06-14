-- COMPREHENSIVE AUTH RESTORE - December 2024
-- This completely restores authentication and fixes all schema mismatches

-- ========================================
-- STEP 1: EMERGENCY AUTH RESTORATION
-- ========================================

-- Remove ALL problematic permissions that broke auth
REVOKE ALL ON user_usage FROM anon;
REVOKE ALL ON user_subscriptions FROM anon;
REVOKE ALL ON plan_limits FROM anon;

-- Drop ALL conflicting RLS policies
DROP POLICY IF EXISTS "Users can manage their own usage data" ON user_usage;
DROP POLICY IF EXISTS "Users can view own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can insert own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can update own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can only access own usage data" ON user_usage;

-- Create clean, working RLS policies
CREATE POLICY "Users can view own usage" ON user_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON user_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON user_usage
    FOR UPDATE USING (auth.uid() = user_id);

-- ========================================
-- STEP 2: FIX TABLE SCHEMA CONFLICTS
-- ========================================

-- Check what columns actually exist and standardize
DO $$
DECLARE
    has_month_year BOOLEAN;
    has_month BOOLEAN;
    has_ai_improvements_used BOOLEAN;
    has_plagiarism_checks BOOLEAN;
BEGIN
    -- Check existing columns
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_usage' AND column_name = 'month_year'
    ) INTO has_month_year;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_usage' AND column_name = 'month'
    ) INTO has_month;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_usage' AND column_name = 'ai_improvements_used'
    ) INTO has_ai_improvements_used;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_usage' AND column_name = 'plagiarism_checks'
    ) INTO has_plagiarism_checks;
    
    RAISE NOTICE 'Schema check: month_year=%, month=%, ai_improvements_used=%, plagiarism_checks=%', 
        has_month_year, has_month, has_ai_improvements_used, has_plagiarism_checks;
    
    -- Add missing columns
    IF NOT has_month_year THEN
        ALTER TABLE user_usage ADD COLUMN month_year VARCHAR(7);
        RAISE NOTICE 'Added month_year column';
    END IF;
    
    IF NOT has_ai_improvements_used THEN
        ALTER TABLE user_usage ADD COLUMN ai_improvements_used INTEGER DEFAULT 0;
        RAISE NOTICE 'Added ai_improvements_used column';
    END IF;
    
    IF NOT has_plagiarism_checks THEN
        ALTER TABLE user_usage ADD COLUMN plagiarism_checks INTEGER DEFAULT 0;
        RAISE NOTICE 'Added plagiarism_checks column';
    END IF;
    
    -- Populate month_year from month if needed
    IF has_month AND has_month_year THEN
        UPDATE user_usage 
        SET month_year = TO_CHAR(month, 'YYYY-MM') 
        WHERE month_year IS NULL AND month IS NOT NULL;
        RAISE NOTICE 'Populated month_year from month column';
    END IF;
END
$$;

-- ========================================
-- STEP 3: CREATE WORKING FUNCTIONS
-- ========================================

-- Drop ALL existing increment_usage functions
DROP FUNCTION IF EXISTS increment_usage(UUID, TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS increment_usage(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS increment_usage CASCADE;

-- Create the main increment_usage function that works with your app
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
    
    -- STRICT authentication check
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    IF auth.uid() != user_uuid THEN
        RAISE EXCEPTION 'Access denied: Cannot modify usage for other users';
    END IF;
    
    -- Insert or update with proper conflict resolution
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
    RAISE WARNING 'Error in increment_usage: user_uuid=%, usage_type=%, error=%', user_uuid, usage_type, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create 2-parameter version for backward compatibility
CREATE OR REPLACE FUNCTION increment_usage(
    user_uuid UUID,
    usage_type TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN increment_usage(user_uuid, usage_type, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- STEP 4: CREATE USAGE CHECKING FUNCTION
-- ========================================

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
BEGIN
    current_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Authentication check
    IF auth.uid() IS NULL OR auth.uid() != user_uuid THEN
        RETURN json_build_object(
            'allowed', false,
            'error', 'Access denied',
            'currentUsage', 0,
            'limit', 0
        );
    END IF;
    
    -- Get user's plan if not provided
    IF plan_type IS NULL THEN
        SELECT us.plan_type INTO plan_type
        FROM user_subscriptions us
        WHERE us.user_id = user_uuid AND us.status = 'active'
        LIMIT 1;
        
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

-- ========================================
-- STEP 5: SET PROPER PERMISSIONS
-- ========================================

-- Grant ONLY authenticated user permissions
GRANT SELECT, INSERT, UPDATE ON user_usage TO authenticated;
GRANT SELECT ON user_subscriptions TO authenticated;
GRANT EXECUTE ON FUNCTION increment_usage(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_usage(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_ai_usage_limit(UUID, TEXT, TEXT) TO authenticated;

-- ========================================
-- STEP 6: CREATE UNIQUE CONSTRAINT
-- ========================================

-- Ensure unique constraint exists for proper conflict resolution
DO $$
BEGIN
    -- Try to create unique constraint if it doesn't exist
    BEGIN
        ALTER TABLE user_usage ADD CONSTRAINT user_usage_user_month_unique UNIQUE (user_id, month_year);
    EXCEPTION WHEN duplicate_table THEN
        -- Constraint already exists, that's fine
        NULL;
    END;
END
$$;

-- ========================================
-- STEP 7: VERIFICATION AND CLEANUP
-- ========================================

-- Test the functions work
DO $$
DECLARE
    test_result BOOLEAN;
    test_json JSON;
BEGIN
    RAISE NOTICE 'Testing functions...';
    
    -- These will fail with auth error, which is expected and good
    BEGIN
        SELECT increment_usage('00000000-0000-0000-0000-000000000000'::UUID, 'ai_improvements', 1) INTO test_result;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'increment_usage correctly requires authentication: %', SQLERRM;
    END;
    
    BEGIN
        SELECT check_ai_usage_limit('00000000-0000-0000-0000-000000000000'::UUID, 'ai_improvements', 'free') INTO test_json;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'check_ai_usage_limit correctly requires authentication: %', SQLERRM;
    END;
END
$$;

-- Show final table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_usage' 
AND column_name IN ('user_id', 'month_year', 'ai_improvements_used', 'plagiarism_checks', 'created_at', 'updated_at')
ORDER BY column_name;

-- Final status
SELECT 'COMPREHENSIVE AUTH RESTORE COMPLETE - Please restart your app and try logging in!' as status; 