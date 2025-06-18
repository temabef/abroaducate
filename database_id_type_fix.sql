-- Fix document_versions table to use TEXT for document_id instead of UUID
-- This allows storing both integer IDs (from SOPs) and UUID IDs (from other tables)

-- First, check if we need to alter the column type
DO $$
DECLARE
    current_type TEXT;
BEGIN
    -- Get current data type of document_id column
    SELECT data_type INTO current_type
    FROM information_schema.columns 
    WHERE table_name = 'document_versions' 
    AND column_name = 'document_id';
    
    -- If it's UUID, convert to TEXT
    IF current_type = 'uuid' THEN
        -- Convert existing UUID values to text
        ALTER TABLE document_versions 
        ALTER COLUMN document_id TYPE TEXT USING document_id::TEXT;
        
        RAISE NOTICE 'Converted document_versions.document_id from UUID to TEXT';
    ELSE
        RAISE NOTICE 'document_versions.document_id is already %', current_type;
    END IF;
END $$;

-- Ensure indexes are optimized for TEXT search
DROP INDEX IF EXISTS idx_document_versions_document_id;
CREATE INDEX idx_document_versions_document_id ON document_versions(document_id, document_type);

-- Update the cleanup function to work with TEXT document_id
CREATE OR REPLACE FUNCTION cleanup_old_versions(
  doc_id TEXT,  -- Changed from UUID to TEXT
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