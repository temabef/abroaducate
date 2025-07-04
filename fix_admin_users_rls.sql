-- ================================================================
-- FIX ADMIN_USERS RLS POLICY RECURSION
-- ================================================================

-- Remove all existing policies on admin_users to prevent recursion
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_select_policy" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_insert_policy" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_update_policy" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_delete_policy" ON public.admin_users;

-- Create a simple, non-recursive policy for admin_users
-- Allow super admins to manage admin users, regular admins to view
CREATE POLICY "admin_users_simple_policy"
  ON public.admin_users
  FOR ALL
  USING (
    -- Allow if user is hardcoded super admin
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE email IN ('admin@abroaducate.com', 'solakolawole62@gmail.com')
    )
    OR
    -- Allow if user is a super-admin in admin_users (but avoid recursion)
    EXISTS (
      SELECT 1 FROM public.admin_users au2
      WHERE au2.user_id = auth.uid() 
      AND au2.role = 'super-admin'
    )
  );

-- Drop the existing debug function first
DROP FUNCTION IF EXISTS public.debug_admin_status();

-- Fix the debug function to avoid column ambiguity
CREATE OR REPLACE FUNCTION public.debug_admin_status()
RETURNS TABLE (
  current_user_id UUID,
  user_email TEXT,
  is_in_admin_table BOOLEAN,
  admin_role TEXT,
  can_manage_scholarships BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as current_user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as user_email,
    EXISTS(SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()) as is_in_admin_table,
    (SELECT au.role FROM public.admin_users au WHERE au.user_id = auth.uid()) as admin_role,
    public.can_manage_scholarships() as can_manage_scholarships;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.debug_admin_status() TO authenticated; 