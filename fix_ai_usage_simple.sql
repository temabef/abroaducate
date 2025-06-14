-- Simple AI Usage Tracking Fix - December 2024
-- Fixes: function increment_usage(uuid, text) does not exist

-- Drop existing functions
DROP FUNCTION IF EXISTS increment_usage(UUID, TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS increment_usage(UUID, TEXT) CASCADE;

-- Create main function (3 parameters)
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION increment_usage(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_usage(UUID, TEXT) TO authenticated;

-- Add missing columns if they don't exist
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS ai_improvements_used INTEGER DEFAULT 0;
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS plagiarism_checks INTEGER DEFAULT 0;

-- Verification query
SELECT 'AI Usage Functions Created Successfully!' as status; 