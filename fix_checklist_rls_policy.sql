-- Fix RLS policy on simple_checklist_progress table
-- Drop the problematic admin policy that references user_subscriptions

-- Drop the problematic admin policy
DROP POLICY IF EXISTS "Admin can view all checklist progress" ON simple_checklist_progress;

-- Drop the existing user policy to recreate it properly
DROP POLICY IF EXISTS "Users can manage their own checklist progress" ON simple_checklist_progress;

-- Create a better RLS policy that works with service role
CREATE POLICY "Users can manage their own checklist progress" 
ON simple_checklist_progress 
FOR ALL 
USING (
    -- Allow service role to bypass RLS
    (SELECT current_setting('role') = 'service_role') OR
    -- Allow users to access their own data
    (user_id = auth.uid())
)
WITH CHECK (
    -- Allow service role to bypass RLS
    (SELECT current_setting('role') = 'service_role') OR
    -- Allow users to insert/update their own data
    (user_id = auth.uid())
);

-- Alternative: If the above doesn't work, we can temporarily disable RLS
-- ALTER TABLE simple_checklist_progress DISABLE ROW LEVEL SECURITY; 