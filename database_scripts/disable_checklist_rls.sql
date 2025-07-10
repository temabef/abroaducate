-- Temporarily disable RLS on simple_checklist_progress table
-- This will allow the service role to work properly

-- Disable RLS on simple_checklist_progress
ALTER TABLE simple_checklist_progress DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON simple_checklist_progress TO authenticated;
GRANT ALL ON simple_checklist_progress TO service_role;

-- Note: This is a temporary fix. For production, we should implement proper RLS policies
-- that work with the service role authentication context. 