-- ============================================================================
-- COMPLETE FIX FOR VERSION HISTORY AND INLINE EDITING (V2)
-- Fixed to handle view dependencies
-- Run this entire script in your Supabase SQL editor
-- ============================================================================

-- PART 1: Fix Version History System
-- Handle view dependencies before altering column type

-- Drop the view that depends on document_id column
DROP VIEW IF EXISTS version_usage_summary;

-- Convert document_id from UUID to TEXT to support both integer and UUID IDs
DO $$
DECLARE
    current_type TEXT;
BEGIN
    SELECT data_type INTO current_type
    FROM information_schema.columns 
    WHERE table_name = 'document_versions' 
    AND column_name = 'document_id';
    
    IF current_type = 'uuid' THEN
        ALTER TABLE document_versions 
        ALTER COLUMN document_id TYPE TEXT USING document_id::TEXT;
        
        RAISE NOTICE 'Converted document_versions.document_id from UUID to TEXT';
    ELSE
        RAISE NOTICE 'document_versions.document_id is already %', current_type;
    END IF;
END $$;

-- Recreate the view with TEXT document_id
CREATE OR REPLACE VIEW version_usage_summary AS
SELECT 
    dv.created_by as user_id,
    dv.document_type,
    COUNT(*) as total_versions,
    MAX(dv.created_at) as last_version_created,
    AVG(dv.word_count) as avg_word_count,
    SUM(dv.word_count) as total_word_count
FROM document_versions dv
WHERE dv.created_by IS NOT NULL
GROUP BY dv.created_by, dv.document_type;

-- Grant permissions on the recreated view
GRANT SELECT ON version_usage_summary TO authenticated;

-- Ensure indexes work with TEXT
DROP INDEX IF EXISTS idx_document_versions_document_id;
CREATE INDEX idx_document_versions_document_id ON document_versions(document_id, document_type);

-- PART 2: Add Inline Editing Limits Support
-- Add inline_edits_used column to user_usage table if it doesn't exist
ALTER TABLE user_usage 
ADD COLUMN IF NOT EXISTS inline_edits_used INTEGER DEFAULT 0;

-- Create index for inline edits tracking
CREATE INDEX IF NOT EXISTS idx_user_usage_inline_edits
ON public.user_usage (user_id, month_year, inline_edits_used);

-- Add inline editing limits to subscription features
UPDATE user_subscriptions SET 
features = COALESCE(features, '{}'::jsonb) || jsonb_build_object('inline_edits_limit', 5)
WHERE plan_type = 'free';

UPDATE user_subscriptions SET 
features = COALESCE(features, '{}'::jsonb) || jsonb_build_object('inline_edits_limit', 50)
WHERE plan_type = 'professional';

UPDATE user_subscriptions SET 
features = COALESCE(features, '{}'::jsonb) || jsonb_build_object('inline_edits_limit', null)
WHERE plan_type = 'elite';

-- Create or replace the inline editing check function
CREATE OR REPLACE FUNCTION check_and_increment_inline_edits(
  user_id_param UUID,
  increment_by INTEGER DEFAULT 1
)
RETURNS TABLE(
  allowed BOOLEAN,
  current_usage INTEGER,
  limit_value INTEGER,
  plan_type TEXT,
  message TEXT
) AS $$
DECLARE
  user_plan TEXT;
  current_month TEXT;
  current_usage INTEGER := 0;
  usage_limit INTEGER;
BEGIN
  -- Get current month in YYYY-MM format
  current_month := to_char(NOW(), 'YYYY-MM');
  
  -- Get user's plan type
  SELECT s.plan_type INTO user_plan
  FROM user_subscriptions s
  WHERE s.user_id = user_id_param AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  -- Default to free if no active subscription
  IF user_plan IS NULL THEN
    user_plan := 'free';
  END IF;
  
  -- Set limits based on plan
  CASE user_plan
    WHEN 'free' THEN usage_limit := 5;
    WHEN 'professional' THEN usage_limit := 50;
    WHEN 'elite' THEN usage_limit := NULL; -- unlimited
    ELSE usage_limit := 5; -- default to free
  END CASE;
  
  -- Get or create current month's usage record
  INSERT INTO user_usage (user_id, month_year, inline_edits_used)
  VALUES (user_id_param, current_month, 0)
  ON CONFLICT (user_id, month_year) 
  DO UPDATE SET inline_edits_used = COALESCE(user_usage.inline_edits_used, 0) + increment_by;
  
  -- Get current usage
  SELECT COALESCE(inline_edits_used, 0) INTO current_usage
  FROM user_usage 
  WHERE user_usage.user_id = user_id_param AND month_year = current_month;
  
  -- Check if allowed (NULL limit means unlimited)
  IF usage_limit IS NULL OR current_usage <= usage_limit THEN
    RETURN QUERY SELECT TRUE, current_usage, usage_limit, user_plan, ''::TEXT;
  ELSE
    -- Rollback the increment since limit exceeded
    UPDATE user_usage 
    SET inline_edits_used = COALESCE(user_usage.inline_edits_used, 0) - increment_by
    WHERE user_usage.user_id = user_id_param AND month_year = current_month;
    
    RETURN QUERY SELECT FALSE, current_usage - increment_by, usage_limit, user_plan, 
      ('Inline editing limit exceeded for ' || user_plan || ' plan')::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to get inline editing usage
CREATE OR REPLACE FUNCTION get_inline_editing_usage(user_id_param UUID)
RETURNS TABLE(
  current_usage INTEGER,
  limit_value INTEGER,
  plan_type TEXT,
  allowed BOOLEAN
) AS $$
DECLARE
  user_plan TEXT;
  current_month TEXT;
  usage_count INTEGER := 0;
  usage_limit INTEGER;
BEGIN
  current_month := to_char(NOW(), 'YYYY-MM');
  
  -- Get user's plan
  SELECT s.plan_type INTO user_plan
  FROM user_subscriptions s
  WHERE s.user_id = user_id_param AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  IF user_plan IS NULL THEN
    user_plan := 'free';
  END IF;
  
  -- Set limits
  CASE user_plan
    WHEN 'free' THEN usage_limit := 5;
    WHEN 'professional' THEN usage_limit := 50;
    WHEN 'elite' THEN usage_limit := NULL;
    ELSE usage_limit := 5;
  END CASE;
  
  -- Get current usage
  SELECT COALESCE(uu.inline_edits_used, 0) INTO usage_count
  FROM user_usage uu
  WHERE uu.user_id = user_id_param AND uu.month_year = current_month;
  
  RETURN QUERY SELECT 
    usage_count,
    usage_limit,
    user_plan,
    (usage_limit IS NULL OR usage_count < usage_limit);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_and_increment_inline_edits(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_inline_editing_usage(UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN public.user_usage.inline_edits_used IS 'Number of inline AI text edits performed this month';
COMMENT ON FUNCTION check_and_increment_inline_edits IS 'Check if user can perform inline edit and increment usage counter if allowed';
COMMENT ON FUNCTION get_inline_editing_usage IS 'Get current inline editing usage and limits for a user';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if document_versions table is fixed
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'document_versions' 
  AND column_name = 'document_id';

-- Check if inline_edits_used column exists
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'user_usage' 
  AND column_name = 'inline_edits_used';

-- Show functions created
SELECT 
  routine_name, 
  routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('check_and_increment_inline_edits', 'get_inline_editing_usage');

-- Check if view was recreated
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'version_usage_summary';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Version History and Inline Editing fixes applied successfully!';
  RAISE NOTICE '📝 document_versions table now supports both integer and UUID document IDs';
  RAISE NOTICE '👁️ version_usage_summary view recreated with TEXT support';
  RAISE NOTICE '🎯 Inline editing limits: Free (5), Professional (50), Elite (unlimited)';
  RAISE NOTICE '🔧 Both systems should now work correctly';
END $$; 