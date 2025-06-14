-- Fix AI Usage Tracking V2 - December 2024
-- This fixes the "function increment_usage(uuid, text) does not exist" error
-- by creating overloaded functions that handle both 2 and 3 parameter calls

-- 1. Drop ALL existing increment_usage functions completely
DROP FUNCTION IF EXISTS increment_usage(UUID, TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS increment_usage(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS increment_usage CASCADE;

-- 2. Create the main increment_usage function (3 parameters)
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
    RAISE WARNING 'Error in increment_usage: %, %, %', usage_type, increment_by, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create overloaded version for 2-parameter calls (backward compatibility)
CREATE OR REPLACE FUNCTION increment_usage(
    user_uuid UUID,
    usage_type TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Call the main function with default increment of 1
    RETURN increment_usage(user_uuid, usage_type, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant permissions for both versions
GRANT EXECUTE ON FUNCTION increment_usage(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_usage(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_usage(UUID, TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION increment_usage(UUID, TEXT) TO anon;

-- 5. Test both function signatures
DO $$
DECLARE
    test_user_id UUID := 'a0000000-0000-0000-0000-000000000000'::UUID;
    result BOOLEAN;
BEGIN
    RAISE NOTICE 'Testing increment_usage functions...';
    
    -- Test 3-parameter version
    SELECT increment_usage(test_user_id, 'ai_improvements', 1) INTO result;
    RAISE NOTICE 'Test 1 (3 params): %', result;
    
    -- Test 2-parameter version
    SELECT increment_usage(test_user_id, 'plagiarism_checks') INTO result;
    RAISE NOTICE 'Test 2 (2 params): %', result;
    
    RAISE NOTICE 'Both increment_usage functions work correctly!';
END
$$;

-- 6. Fix the column names issue - check what columns actually exist
DO $$
DECLARE
    has_ai_improvements BOOLEAN;
    has_plagiarism_checks BOOLEAN;
BEGIN
    -- Check if ai_improvements_used column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_usage' 
        AND column_name = 'ai_improvements_used'
    ) INTO has_ai_improvements;
    
    -- Check if plagiarism_checks column exists  
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_usage' 
        AND column_name = 'plagiarism_checks'
    ) INTO has_plagiarism_checks;
    
    RAISE NOTICE 'Column ai_improvements_used exists: %', has_ai_improvements;
    RAISE NOTICE 'Column plagiarism_checks exists: %', has_plagiarism_checks;
    
    -- If columns don't exist, add them
    IF NOT has_ai_improvements THEN
        ALTER TABLE user_usage ADD COLUMN ai_improvements_used INTEGER DEFAULT 0;
        RAISE NOTICE 'Added ai_improvements_used column';
    END IF;
    
    IF NOT has_plagiarism_checks THEN
        ALTER TABLE user_usage ADD COLUMN plagiarism_checks INTEGER DEFAULT 0;
        RAISE NOTICE 'Added plagiarism_checks column';
    END IF;
END
$$;

-- 7. Show table structure to verify
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_usage' 
AND column_name IN ('ai_improvements_used', 'plagiarism_checks', 'user_id', 'month_year')
ORDER BY column_name;

-- 8. Final verification
SELECT 'AI Usage Tracking V2 Fix Applied Successfully!' as status;

-- Final notice
DO $$
BEGIN
    RAISE NOTICE 'Setup complete. Both increment_usage(uuid, text) and increment_usage(uuid, text, integer) are now available.';
END
$$; 