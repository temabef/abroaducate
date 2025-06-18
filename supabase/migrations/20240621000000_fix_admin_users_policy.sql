-- Migration: Fix Admin Users Policy
-- Description: Updates the admin_users table RLS policy to allow self-registration from the debug page

-- Drop the existing policy that's too restrictive
DROP POLICY IF EXISTS "Super admins can manage admin users" ON public.admin_users;

-- Create a new policy that allows:
-- 1. Super admins to manage all admin users
-- 2. Any user to add themselves as an admin from the debug page
CREATE POLICY "Allow admin management and self-registration"
  ON public.admin_users
  FOR INSERT
  WITH CHECK (
    -- Super admins can manage all admin users
    ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@abroaducate.com' OR
     (SELECT email FROM auth.users WHERE id = auth.uid()) = 'solakolawole62@gmail.com')
    OR
    -- Any user can add themselves as an admin (self-registration)
    (auth.uid() = user_id)
  );

-- Create a separate policy for update/delete that only super admins can perform
CREATE POLICY "Only super admins can update or delete admin users"
  ON public.admin_users
  FOR ALL
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@abroaducate.com' OR
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'solakolawole62@gmail.com'
  );

-- Create a bypass function to add yourself as an admin directly
CREATE OR REPLACE FUNCTION public.add_self_as_admin()
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'You must be logged in to perform this action';
    RETURN FALSE;
  END IF;
  
  -- Add user as admin
  INSERT INTO public.admin_users (user_id, role, created_by)
  VALUES (current_user_id, 'super_admin', current_user_id)
  ON CONFLICT (user_id) DO NOTHING;
    
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.add_self_as_admin() TO authenticated; 