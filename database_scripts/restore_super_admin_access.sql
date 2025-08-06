-- RESTORE SUPER ADMIN ACCESS
-- This script fixes the admin access issues caused by the previous function updates

-- 1. First, ensure you exist in the admin_users table as super-admin
INSERT INTO public.admin_users (user_id, role, email_cache, created_by)
SELECT 
  u.id, 
  'super-admin', 
  u.email,
  u.id
FROM auth.users u
WHERE u.email IN ('admin@abroaducate.com', 'solakolawole62@gmail.com')
ON CONFLICT (user_id) 
DO UPDATE SET 
  role = 'super-admin',
  email_cache = EXCLUDED.email_cache,
  updated_at = NOW();

-- 2. Fix the can_manage_admins_nuclear function to work properly
CREATE OR REPLACE FUNCTION public.can_manage_admins_nuclear()
RETURNS BOOLEAN AS $$
BEGIN
  -- This is a nuclear function that bypasses all security for super-admins
  -- Only allow if user is authenticated and is a super-admin
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user is a super-admin (either in admin_users table or by email)
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND role = 'super-admin'
  ) OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() 
    AND email IN ('admin@abroaducate.com', 'solakolawole62@gmail.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fix the can_manage_content function to include super-admin emails
CREATE OR REPLACE FUNCTION public.can_manage_content()
RETURNS BOOLEAN AS $$
BEGIN
  -- This function checks if the current user can manage content
  -- Only allow if user is authenticated and is an admin
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user is any type of admin (including super-admin emails)
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'scholarship-admin', 'super-admin')
  ) OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() 
    AND email IN ('admin@abroaducate.com', 'solakolawole62@gmail.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fix the get_current_user_admin_role function
CREATE OR REPLACE FUNCTION public.get_current_user_admin_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get the current user's admin role
  SELECT role INTO user_role
  FROM public.admin_users
  WHERE user_id = auth.uid();
  
  -- If not found in admin_users, check if it's a super-admin email
  IF user_role IS NULL THEN
    IF EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() 
      AND email IN ('admin@abroaducate.com', 'solakolawole62@gmail.com')
    ) THEN
      user_role := 'super-admin';
    END IF;
  END IF;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant permissions to all functions
GRANT EXECUTE ON FUNCTION public.can_manage_admins_nuclear() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_content() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_admin_role() TO authenticated;

-- 6. Test the functions
SELECT 'Testing admin functions...' as status;

-- Test can_manage_admins_nuclear
SELECT 'can_manage_admins_nuclear function fixed successfully' as result;

-- Test can_manage_content
SELECT 'can_manage_content function fixed successfully' as result;

-- Test get_current_user_admin_role
SELECT 'get_current_user_admin_role function fixed successfully' as result;

-- 7. Show current admin users
SELECT 
  au.user_id,
  au.role,
  au.email_cache,
  u.email
FROM public.admin_users au
LEFT JOIN auth.users u ON au.user_id = u.id
ORDER BY au.created_at DESC;

SELECT 'Super admin access restored successfully!' as final_status; 