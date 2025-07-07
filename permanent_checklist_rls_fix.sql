-- Permanent RLS fix for simple_checklist_progress table
-- This will work with the authenticated Supabase client

-- Enable RLS
ALTER TABLE simple_checklist_progress ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies
DROP POLICY IF EXISTS "Users can manage their own checklist progress" ON simple_checklist_progress;
DROP POLICY IF EXISTS "Admin can view all checklist progress" ON simple_checklist_progress;

-- Create the correct policy: Users can only access their own data
CREATE POLICY "Users can manage their own checklist progress"
  ON simple_checklist_progress
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Grant necessary permissions
GRANT ALL ON simple_checklist_progress TO authenticated;
GRANT ALL ON simple_checklist_progress TO service_role;

-- Verify the policy is working
COMMENT ON TABLE simple_checklist_progress IS 'Document checklist progress with secure RLS - users can only access their own data'; 