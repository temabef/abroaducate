-- ========================================
-- CHECK AND FIX AI USAGE TRACKING
-- ========================================
-- This script checks if AI usage tracking is working and fixes it if needed

-- 1. Check if ai_usage_log table exists and has proper structure
DO $$
DECLARE
    table_exists BOOLEAN := FALSE;
    column_count INTEGER := 0;
    col_record RECORD;
BEGIN
    RAISE NOTICE '=== CHECKING AI USAGE LOG TABLE ===';
    
    -- Check if table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_usage_log'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ ai_usage_log table exists';
        
        -- Check table structure
        SELECT COUNT(*) INTO column_count
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_usage_log';
        
        RAISE NOTICE 'Table has % columns', column_count;
        
        -- Show column details
        FOR col_record IN 
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'ai_usage_log'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE 'Column: % (%) - Nullable: %', 
                col_record.column_name, 
                col_record.data_type, 
                col_record.is_nullable;
        END LOOP;
        
    ELSE
        RAISE NOTICE '❌ ai_usage_log table does not exist - creating it now';
        
        -- Create the ai_usage_log table
        CREATE TABLE ai_usage_log (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            feature_type TEXT NOT NULL,
            usage_count INTEGER DEFAULT 1,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Add indexes for performance
        CREATE INDEX idx_ai_usage_log_user_id ON ai_usage_log(user_id);
        CREATE INDEX idx_ai_usage_log_feature_type ON ai_usage_log(feature_type);
        CREATE INDEX idx_ai_usage_log_created_at ON ai_usage_log(created_at);
        
        -- Enable RLS
        ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies
        CREATE POLICY "Users can view their own AI usage" ON ai_usage_log
            FOR SELECT USING (auth.uid() = user_id);
            
        CREATE POLICY "Users can insert their own AI usage" ON ai_usage_log
            FOR INSERT WITH CHECK (auth.uid() = user_id);
            
        CREATE POLICY "Admins can view all AI usage" ON ai_usage_log
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM admin_users 
                    WHERE user_id = auth.uid()
                )
            );
        
        RAISE NOTICE '✅ Created ai_usage_log table with proper structure';
    END IF;
END $$;

-- 2. Check if there's any data in the table
DO $$
DECLARE
    record_count BIGINT := 0;
    feature_record RECORD;
BEGIN
    RAISE NOTICE '=== CHECKING AI USAGE DATA ===';
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_usage_log') THEN
        -- Get total count
        SELECT COUNT(*) INTO record_count FROM ai_usage_log;
        RAISE NOTICE 'Total AI usage records: %', record_count;
        
        IF record_count > 0 THEN
            -- Show breakdown by feature_type
            RAISE NOTICE 'AI Usage breakdown by feature type:';
            FOR feature_record IN 
                SELECT feature_type, COUNT(*) as count 
                FROM ai_usage_log 
                GROUP BY feature_type 
                ORDER BY count DESC
            LOOP
                RAISE NOTICE '  %: %', feature_record.feature_type, feature_record.count;
            END LOOP;
        ELSE
            RAISE NOTICE '⚠️ No AI usage records found - this might indicate:';
            RAISE NOTICE '   1. AI features are not being used';
            RAISE NOTICE '   2. AI usage is not being logged properly';
            RAISE NOTICE '   3. Users are not accessing AI features';
        END IF;
    END IF;
END $$;

-- 3. Check if the increment_usage function exists (used by AI features)
DO $$
DECLARE
    function_exists BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '=== CHECKING INCREMENT_USAGE FUNCTION ===';
    
    SELECT EXISTS (
        SELECT FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'increment_usage'
    ) INTO function_exists;
    
    IF function_exists THEN
        RAISE NOTICE '✅ increment_usage function exists';
    ELSE
        RAISE NOTICE '❌ increment_usage function does not exist - creating it now';
    END IF;
END $$;

-- Drop existing function if it exists (to handle return type changes)
DROP FUNCTION IF EXISTS increment_usage(UUID, TEXT, INTEGER);

-- Create the increment_usage function
CREATE OR REPLACE FUNCTION increment_usage(
    user_uuid UUID,
    usage_type TEXT,
    increment_by INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
    -- Insert into ai_usage_log
    INSERT INTO ai_usage_log (user_id, feature_type, usage_count)
    VALUES (user_uuid, usage_type, increment_by)
    ON CONFLICT DO NOTHING;
    
    -- Also update user_usage table if it exists
    BEGIN
        EXECUTE format('
            INSERT INTO user_usage (user_id, %I, updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                %I = user_usage.%I + $2,
                updated_at = NOW()
        ', usage_type, usage_type, usage_type)
        USING user_uuid, increment_by;
    EXCEPTION
        WHEN undefined_table THEN
            -- user_usage table doesn't exist, that's okay
            NULL;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION increment_usage(UUID, TEXT, INTEGER) TO authenticated;

-- 4. Test the analytics function to see current state
SELECT '=== TESTING ANALYTICS FUNCTION ===' as status;
SELECT * FROM get_dashboard_analytics();

-- 5. Show what the admin dashboard should display
SELECT '=== ADMIN DASHBOARD SHOULD SHOW ===' as description;
WITH current_analytics AS (
    SELECT * FROM get_dashboard_analytics()
)
SELECT 
    'Analytics Summary:' as category,
    total_users,
    total_ai_usage,
    reviews_count,
    grammar_checks_count,
    tone_analysis_count,
    plagiarism_checks_count,
    text_enhancements_count,
    word_optimizations_count
FROM current_analytics;

-- 6. Provide recommendations
DO $$
BEGIN
    RAISE NOTICE '=== RECOMMENDATIONS ===';
    RAISE NOTICE 'If AI usage shows 0 but you have 406 users:';
    RAISE NOTICE '1. Check if AI features are actually being used by users';
    RAISE NOTICE '2. Verify that AI usage logging is working in the frontend';
    RAISE NOTICE '3. Test an AI feature manually to see if it logs usage';
    RAISE NOTICE '4. Check browser console for any errors when using AI features';
    RAISE NOTICE '';
    RAISE NOTICE 'To test AI usage logging:';
    RAISE NOTICE '1. Go to a document (SOP, Cover Letter, etc.)';
    RAISE NOTICE '2. Try using an AI feature (review, grammar check, etc.)';
    RAISE NOTICE '3. Check if a record appears in ai_usage_log table';
END $$; 