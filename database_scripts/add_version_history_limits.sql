-- ============================================================================
-- VERSION HISTORY LIMITS AND CLEANUP SYSTEM
-- Comprehensive SQL migration for plan-based version history management
-- ============================================================================

-- Add version tracking columns to document_versions table
ALTER TABLE document_versions 
ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing document_versions to populate created_by field
-- Handle different ID types (UUID vs BIGINT) dynamically
DO $$
DECLARE
    sops_id_type TEXT;
    cover_letters_id_type TEXT;
    personal_statements_id_type TEXT;
BEGIN
    -- Get the actual data types of ID columns
    SELECT data_type INTO sops_id_type 
    FROM information_schema.columns 
    WHERE table_name = 'sops' AND column_name = 'id';
    
    SELECT data_type INTO cover_letters_id_type 
    FROM information_schema.columns 
    WHERE table_name = 'cover_letters' AND column_name = 'id';
    
    SELECT data_type INTO personal_statements_id_type 
    FROM information_schema.columns 
    WHERE table_name = 'personal_statements' AND column_name = 'id';
    
    -- Update with appropriate casting based on actual data types
    -- Cast the table ID to match document_versions.document_id type (UUID)
    IF sops_id_type = 'uuid' THEN
        UPDATE document_versions 
        SET created_by = (SELECT user_id FROM sops WHERE id = document_versions.document_id)
        WHERE document_type = 'sop' AND created_by IS NULL;
    ELSIF sops_id_type = 'bigint' THEN
        UPDATE document_versions 
        SET created_by = (SELECT user_id FROM sops WHERE id::text = document_versions.document_id::text)
        WHERE document_type = 'sop' AND created_by IS NULL;
    END IF;
    
    IF cover_letters_id_type = 'uuid' THEN
        UPDATE document_versions 
        SET created_by = (SELECT user_id FROM cover_letters WHERE id = document_versions.document_id)
        WHERE document_type = 'cover_letter' AND created_by IS NULL;
    ELSIF cover_letters_id_type = 'bigint' THEN
        UPDATE document_versions 
        SET created_by = (SELECT user_id FROM cover_letters WHERE id::text = document_versions.document_id::text)
        WHERE document_type = 'cover_letter' AND created_by IS NULL;
    END IF;
    
    IF personal_statements_id_type = 'uuid' THEN
        UPDATE document_versions 
        SET created_by = (SELECT user_id FROM personal_statements WHERE id = document_versions.document_id)
        WHERE document_type = 'personal_statement' AND created_by IS NULL;
    ELSIF personal_statements_id_type = 'bigint' THEN
        UPDATE document_versions 
        SET created_by = (SELECT user_id FROM personal_statements WHERE id::text = document_versions.document_id::text)
        WHERE document_type = 'personal_statement' AND created_by IS NULL;
    END IF;
    
END $$;

-- Create function to get version limits based on user plan
CREATE OR REPLACE FUNCTION get_version_limits(user_plan TEXT)
RETURNS TABLE(
  max_versions INTEGER,
  allowed_types TEXT[],
  retention_days INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE user_plan
      WHEN 'professional' THEN 50
      WHEN 'elite' THEN 100
      ELSE 3  -- free plan
    END as max_versions,
    CASE user_plan
      WHEN 'professional' THEN ARRAY['cover_letter', 'personal_statement', 'sop', 'cv']
      WHEN 'elite' THEN ARRAY['cover_letter', 'personal_statement', 'sop', 'cv']
      ELSE ARRAY['cover_letter']  -- free plan
    END as allowed_types,
    CASE user_plan
      WHEN 'professional' THEN 90
      WHEN 'elite' THEN 365
      ELSE 30  -- free plan
    END as retention_days;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if version history is allowed
CREATE OR REPLACE FUNCTION is_version_history_allowed(
  user_id UUID,
  doc_type TEXT
)
RETURNS TABLE(
  allowed BOOLEAN,
  reason TEXT,
  upgrade_required BOOLEAN
) AS $$
DECLARE
  user_plan TEXT;
  limits RECORD;
BEGIN
  -- Get user's current plan
  SELECT plan_type INTO user_plan
  FROM user_subscriptions 
  WHERE user_subscriptions.user_id = is_version_history_allowed.user_id AND status = 'active';
  
  -- Default to free if no plan found
  IF user_plan IS NULL THEN
    user_plan := 'free';
  END IF;
  
  -- Get limits for this plan
  SELECT * INTO limits FROM get_version_limits(user_plan);
  
  -- Check if document type is allowed
  IF doc_type = ANY(limits.allowed_types) THEN
    RETURN QUERY SELECT TRUE, 'Version history allowed', FALSE;
  ELSE
    RETURN QUERY SELECT 
      FALSE, 
      'Version history for ' || doc_type || ' requires Professional plan',
      TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to cleanup old versions based on plan limits
CREATE OR REPLACE FUNCTION cleanup_old_versions(
  doc_id UUID,
  doc_type TEXT,
  user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  user_plan TEXT;
  limits RECORD;
  versions_to_delete UUID[];
  deleted_count INTEGER := 0;
BEGIN
  -- Get user's current plan
  SELECT plan_type INTO user_plan
  FROM user_subscriptions 
  WHERE user_subscriptions.user_id = cleanup_old_versions.user_id AND status = 'active';
  
  -- Default to free if no plan found
  IF user_plan IS NULL THEN
    user_plan := 'free';
  END IF;
  
  -- Get limits for this plan
  SELECT * INTO limits FROM get_version_limits(user_plan);
  
  -- Get versions to delete (keep only the newest max_versions)
  SELECT ARRAY(
    SELECT id FROM document_versions 
    WHERE document_id = doc_id 
      AND document_type = doc_type
    ORDER BY created_at DESC 
    OFFSET limits.max_versions
  ) INTO versions_to_delete;
  
  -- Delete old versions
  IF array_length(versions_to_delete, 1) > 0 THEN
    DELETE FROM document_versions 
    WHERE id = ANY(versions_to_delete);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
  END IF;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to cleanup expired versions based on retention policy
CREATE OR REPLACE FUNCTION cleanup_expired_versions(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  user_plan TEXT;
  limits RECORD;
  cutoff_date TIMESTAMP;
  deleted_count INTEGER := 0;
BEGIN
  -- Get user's current plan
  SELECT plan_type INTO user_plan
  FROM user_subscriptions 
  WHERE user_id = target_user_id AND status = 'active';
  
  -- Default to free if no plan found
  IF user_plan IS NULL THEN
    user_plan := 'free';
  END IF;
  
  -- Get limits for this plan
  SELECT * INTO limits FROM get_version_limits(user_plan);
  
  -- Calculate cutoff date
  cutoff_date := NOW() - (limits.retention_days || ' days')::INTERVAL;
  
  -- Delete expired versions
  DELETE FROM document_versions 
  WHERE created_by = target_user_id 
    AND created_at < cutoff_date;
    
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get version usage statistics
CREATE OR REPLACE FUNCTION get_version_usage_stats(
  user_id UUID,
  doc_type TEXT
)
RETURNS TABLE(
  total_versions BIGINT,
  max_allowed INTEGER,
  usage_percentage NUMERIC,
  plan_type TEXT
) AS $$
DECLARE
  user_plan TEXT;
  limits RECORD;
BEGIN
  -- Get user's current plan
  SELECT plan_type INTO user_plan
  FROM user_subscriptions 
  WHERE user_subscriptions.user_id = get_version_usage_stats.user_id AND status = 'active';
  
  -- Default to free if no plan found
  IF user_plan IS NULL THEN
    user_plan := 'free';
  END IF;
  
  -- Get limits for this plan
  SELECT * INTO limits FROM get_version_limits(user_plan);
  
  RETURN QUERY
  SELECT 
    COALESCE(COUNT(dv.id), 0) as total_versions,
    limits.max_versions,
    ROUND((COALESCE(COUNT(dv.id), 0)::NUMERIC / limits.max_versions::NUMERIC) * 100, 1) as usage_percentage,
    user_plan
  FROM document_versions dv
  JOIN (
    SELECT id, user_id FROM sops WHERE document_type = 'sop'
    UNION ALL
    SELECT id, user_id FROM cover_letters WHERE document_type = 'cover_letter'
    UNION ALL
    SELECT id, user_id FROM personal_statements WHERE document_type = 'personal_statement'
  ) docs ON dv.document_id = docs.id
  WHERE docs.user_id = get_version_usage_stats.user_id
    AND dv.document_type = doc_type
    AND doc_type = ANY(limits.allowed_types);
END;
$$ LANGUAGE plpgsql;

-- Create automated cleanup job (cron-style trigger)
CREATE OR REPLACE FUNCTION auto_cleanup_versions()
RETURNS VOID AS $$
DECLARE
  user_record RECORD;
  cleanup_count INTEGER;
BEGIN
  -- Loop through all users and cleanup their expired versions
  FOR user_record IN (
    SELECT DISTINCT user_id FROM user_subscriptions
    UNION
    SELECT DISTINCT user_id FROM user_usage
  ) LOOP
    SELECT cleanup_expired_versions(user_record.user_id) INTO cleanup_count;
    
    IF cleanup_count > 0 THEN
      INSERT INTO admin_activity_log (action, details, created_at)
      VALUES (
        'version_cleanup',
        'Cleaned up ' || cleanup_count || ' expired versions for user ' || user_record.user_id,
        NOW()
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create index for better version history performance
CREATE INDEX IF NOT EXISTS idx_document_versions_user_type_date 
ON document_versions(created_by, document_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_document_versions_cleanup 
ON document_versions(document_id, document_type, created_at DESC);

-- Add Row Level Security for document_versions
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own document versions
DROP POLICY IF EXISTS "Users can view their own document versions" ON document_versions;
CREATE POLICY "Users can view their own document versions" ON document_versions
FOR SELECT USING (
  created_by = auth.uid()
);

-- Policy: Users can only create versions for their own documents
DROP POLICY IF EXISTS "Users can create versions for their own documents" ON document_versions;
CREATE POLICY "Users can create versions for their own documents" ON document_versions
FOR INSERT WITH CHECK (
  created_by = auth.uid()
);

-- Policy: Users can only delete their own document versions
DROP POLICY IF EXISTS "Users can delete their own document versions" ON document_versions;
CREATE POLICY "Users can delete their own document versions" ON document_versions
FOR DELETE USING (
  created_by = auth.uid()
);

-- Create summary view for version analytics
CREATE OR REPLACE VIEW version_usage_summary AS
SELECT 
  u.user_id,
  COALESCE(us.plan_type, 'free') as plan_type,
  au.email,
  COUNT(dv.id) as total_versions,
  COUNT(DISTINCT dv.document_id) as unique_documents,
  COUNT(DISTINCT dv.document_type) as document_types_used,
  MAX(dv.created_at) as last_version_created,
  AVG(dv.word_count) as avg_word_count
FROM user_usage u
LEFT JOIN user_subscriptions us ON u.user_id = us.user_id AND us.status = 'active'
LEFT JOIN auth.users au ON u.user_id = au.id
LEFT JOIN document_versions dv ON dv.created_by = u.user_id
GROUP BY u.user_id, us.plan_type, au.email;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON version_usage_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_version_limits TO authenticated;
GRANT EXECUTE ON FUNCTION is_version_history_allowed TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_versions TO authenticated;
GRANT EXECUTE ON FUNCTION get_version_usage_stats TO authenticated;

-- Example usage and verification queries
/*
-- Check version limits for different plans
SELECT * FROM get_version_limits('free');
SELECT * FROM get_version_limits('professional');
SELECT * FROM get_version_limits('elite');

-- Check if version history is allowed for a user
SELECT * FROM is_version_history_allowed('user-uuid-here', 'sop');
SELECT * FROM is_version_history_allowed('user-uuid-here', 'cover_letter');

-- Get version usage stats for a user
SELECT * FROM get_version_usage_stats('user-uuid-here', 'cover_letter');

-- Cleanup old versions for a specific document
SELECT cleanup_old_versions('document-uuid-here', 'sop', 'user-uuid-here');

-- View version usage summary
SELECT * FROM version_usage_summary 
WHERE plan_type = 'free' 
ORDER BY total_versions DESC 
LIMIT 10;
*/

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Version history limits migration completed successfully!';
  RAISE NOTICE 'Plan-based version limits:';
  RAISE NOTICE '  • Free: 3 versions (cover letters only, 30-day retention)';
  RAISE NOTICE '  • Professional: 50 versions (all types, 90-day retention)';
  RAISE NOTICE '  • Elite: 100 versions (all types, 1-year retention)';
END $$; 