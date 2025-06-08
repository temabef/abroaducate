-- Fix user_usage table RLS policy
-- The current policy is too restrictive and doesn't allow the increment_usage function to insert rows

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can only access own usage data" ON user_usage;

-- Create a more permissive policy that allows both reads and writes for own data
CREATE POLICY "Users can manage own usage data" ON user_usage
  FOR ALL 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Also ensure the increment_usage function has proper security context
-- Update the function to use the calling user's ID
CREATE OR REPLACE FUNCTION increment_usage(
    user_uuid UUID,
    usage_type TEXT,
    increment_by INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
    current_month DATE := DATE_TRUNC('month', CURRENT_DATE);
BEGIN
    -- Verify the user_uuid matches the authenticated user for security
    IF user_uuid != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: Cannot modify usage for other users';
    END IF;

    -- Insert or update usage record
    INSERT INTO user_usage (user_id, month, sops_created, ai_improvements_used, analytics_generated, plagiarism_checks)
    VALUES (
        user_uuid,
        current_month,
        CASE WHEN usage_type = 'sops_created' THEN increment_by ELSE 0 END,
        CASE WHEN usage_type = 'ai_improvements_used' THEN increment_by ELSE 0 END,
        CASE WHEN usage_type = 'analytics_generated' THEN increment_by ELSE 0 END,
        CASE WHEN usage_type = 'plagiarism_checks' THEN increment_by ELSE 0 END
    )
    ON CONFLICT (user_id, month) DO UPDATE SET
        sops_created = user_usage.sops_created + 
            CASE WHEN usage_type = 'sops_created' THEN increment_by ELSE 0 END,
        ai_improvements_used = user_usage.ai_improvements_used + 
            CASE WHEN usage_type = 'ai_improvements_used' THEN increment_by ELSE 0 END,
        analytics_generated = user_usage.analytics_generated + 
            CASE WHEN usage_type = 'analytics_generated' THEN increment_by ELSE 0 END,
        plagiarism_checks = user_usage.plagiarism_checks + 
            CASE WHEN usage_type = 'plagiarism_checks' THEN increment_by ELSE 0 END,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_usage(UUID, TEXT, INTEGER) TO authenticated; 