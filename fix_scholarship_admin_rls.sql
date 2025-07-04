-- ================================================================
-- FIX SCHOLARSHIP ADMIN RLS POLICIES
-- ================================================================
-- This script fixes the RLS policies to allow scholarship admins to manage scholarships

-- Step 1: Ensure the admin user exists with proper role
-- Add or update the user as a scholarship admin
INSERT INTO public.admin_users (user_id, role, email_cache)
VALUES 
  ('395fe4b0-a8d2-4f03-b29e-b4ee03c06f4e', 'scholarship-admin', 'temabef@gmail.com')
ON CONFLICT (user_id) 
DO UPDATE SET 
  role = 'scholarship-admin',
  email_cache = 'temabef@gmail.com';

-- Step 2: Create the most reliable can_manage_scholarships function
CREATE OR REPLACE FUNCTION public.can_manage_scholarships()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  user_email TEXT;
BEGIN
  -- Return false if not authenticated
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get user email for hardcoded super admin check
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  
  -- Allow hardcoded super admin emails
  IF user_email IN ('admin@abroaducate.com', 'solakolawole62@gmail.com') THEN
    RETURN TRUE;
  END IF;

  -- Check admin_users table for role-based access
  SELECT role INTO user_role FROM public.admin_users WHERE user_id = auth.uid();
  
  -- Allow access for any admin role that can manage scholarships
  RETURN user_role IN ('super-admin', 'admin', 'scholarship-admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Remove ALL existing scholarship policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view scholarships" ON public.scholarships;
DROP POLICY IF EXISTS "Admins can manage scholarships" ON public.scholarships;
DROP POLICY IF EXISTS "scholarships_select_policy" ON public.scholarships;
DROP POLICY IF EXISTS "scholarships_insert_policy" ON public.scholarships;
DROP POLICY IF EXISTS "scholarships_update_policy" ON public.scholarships;
DROP POLICY IF EXISTS "scholarships_delete_policy" ON public.scholarships;

-- Step 4: Create clean, simple RLS policies for scholarships
-- Allow everyone to read active scholarships
CREATE POLICY "scholarships_public_read"
  ON public.scholarships
  FOR SELECT
  USING (is_active = true);

-- Allow scholarship admins to read all scholarships (active and inactive)
CREATE POLICY "scholarships_admin_read"
  ON public.scholarships
  FOR SELECT
  USING (public.can_manage_scholarships());

-- Allow scholarship admins to insert new scholarships
CREATE POLICY "scholarships_admin_insert"
  ON public.scholarships
  FOR INSERT
  WITH CHECK (public.can_manage_scholarships());

-- Allow scholarship admins to update scholarships
CREATE POLICY "scholarships_admin_update"
  ON public.scholarships
  FOR UPDATE
  USING (public.can_manage_scholarships())
  WITH CHECK (public.can_manage_scholarships());

-- Allow scholarship admins to delete scholarships
CREATE POLICY "scholarships_admin_delete"
  ON public.scholarships
  FOR DELETE
  USING (public.can_manage_scholarships());

-- Step 5: Ensure RLS is enabled
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;

-- Step 6: Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION public.can_manage_scholarships() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_scholarships() TO anon;

-- Step 7: Test the function (this will show if it works)
-- You can uncomment this after running the script to test
-- SELECT public.can_manage_scholarships() AS can_manage_test;

-- Step 8: Add some helpful comments
COMMENT ON FUNCTION public.can_manage_scholarships() IS 'Checks if the current user can manage scholarships. Returns true for super-admin, admin, and scholarship-admin roles.';
COMMENT ON POLICY "scholarships_admin_insert" ON public.scholarships IS 'Allows scholarship admins to insert new scholarships';

-- Step 9: Create a test function to debug admin status
CREATE OR REPLACE FUNCTION public.debug_admin_status()
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  is_in_admin_table BOOLEAN,
  admin_role TEXT,
  can_manage_scholarships BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as user_email,
    EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()) as is_in_admin_table,
    (SELECT role FROM public.admin_users WHERE user_id = auth.uid()) as admin_role,
    public.can_manage_scholarships() as can_manage_scholarships;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.debug_admin_status() TO authenticated; 