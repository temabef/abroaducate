-- COMPREHENSIVE FIX FOR AMBIGUOUS USER_ID ERROR
-- Run this in your Supabase dashboard to completely fix the issue

-- Step 1: Drop ALL existing admin functions to eliminate conflicts
DROP FUNCTION IF EXISTS public.add_admin_user(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.add_admin_user(text) CASCADE;
DROP FUNCTION IF EXISTS public.add_admin_user_nuclear(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.add_admin_user_nuclear(text) CASCADE;
DROP FUNCTION IF EXISTS public.admin_bypass_find_user(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_users() CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_users_nuclear() CASCADE;
DROP FUNCTION IF EXISTS public.can_manage_admins() CASCADE;
DROP FUNCTION IF EXISTS public.can_manage_admins_nuclear() CASCADE;
DROP FUNCTION IF EXISTS public.can_manage_scholarships() CASCADE;
DROP FUNCTION IF EXISTS public.can_access_analytics() CASCADE;
DROP FUNCTION IF EXISTS public.can_manage_content() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- Step 2: Create clean, non-conflicting admin functions

-- 2a. Basic admin check function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is in admin_users table OR is a super admin email
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() 
    AND email IN ('admin@abroaducate.com', 'solakolawole62@gmail.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2b. Permission check functions
CREATE OR REPLACE FUNCTION public.can_manage_admins()
RETURNS BOOLEAN AS $$
BEGIN
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

CREATE OR REPLACE FUNCTION public.can_manage_scholarships()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND role IN ('super-admin', 'admin', 'scholarship-admin')
  ) OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() 
    AND email IN ('admin@abroaducate.com', 'solakolawole62@gmail.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_access_analytics()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND role IN ('super-admin', 'admin')
  ) OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() 
    AND email IN ('admin@abroaducate.com', 'solakolawole62@gmail.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_manage_content()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND role IN ('super-admin', 'admin')
  ) OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() 
    AND email IN ('admin@abroaducate.com', 'solakolawole62@gmail.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2c. Get admin users function
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (
  user_id UUID,
  role TEXT,
  email_cache TEXT,
  created_at TIMESTAMPTZ,
  created_by UUID,
  updated_at TIMESTAMPTZ,
  updated_by UUID,
  email TEXT
) AS $$
BEGIN
  -- Only allow super-admins to view admin users
  IF NOT (SELECT public.can_manage_admins()) THEN
    RAISE EXCEPTION 'Permission denied: Only super-admins can view admin users';
  END IF;
  
  RETURN QUERY
  SELECT 
    au.user_id,
    au.role,
    au.email_cache,
    au.created_at,
    au.created_by,
    au.updated_at,
    au.updated_by,
    u.email
  FROM public.admin_users au
  LEFT JOIN auth.users u ON au.user_id = u.id
  ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2d. The main add_admin_user function (FIXED VERSION)
CREATE OR REPLACE FUNCTION public.add_admin_user(
  admin_email TEXT,
  admin_role TEXT DEFAULT 'admin'
)
RETURNS jsonb AS $$
DECLARE
  target_user_id UUID;
  current_user_id UUID := auth.uid();
BEGIN
  -- Check if current user can manage admins
  IF NOT (SELECT public.can_manage_admins()) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Only super-admins can add admin users'
    );
  END IF;

  -- Validate role
  IF admin_role NOT IN ('admin', 'scholarship-admin', 'super-admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Invalid role. Must be admin, scholarship-admin, or super-admin'
    );
  END IF;

  -- Find the user by email (explicitly specify table alias to avoid ambiguity)
  SELECT u.id INTO target_user_id
  FROM auth.users u
  WHERE u.email = admin_email;
  
  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User not found with email: ' || admin_email
    );
  END IF;
  
  -- Add or update the user as admin (explicitly specify table to avoid ambiguity)
  INSERT INTO public.admin_users (user_id, role, email_cache, created_by)
  VALUES (target_user_id, admin_role, admin_email, current_user_id)
  ON CONFLICT (user_id)
  DO UPDATE SET
    role = admin_role,
    email_cache = admin_email,
    updated_at = NOW(),
    updated_by = current_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Admin user added successfully',
    'user_id', target_user_id,
    'role', admin_role
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2e. Remove admin user function
CREATE OR REPLACE FUNCTION public.remove_admin_user(admin_email TEXT)
RETURNS jsonb AS $$
DECLARE
  target_user_id UUID;
  target_role TEXT;
BEGIN
  -- Check if current user can manage admins
  IF NOT (SELECT public.can_manage_admins()) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Only super-admins can remove admin users'
    );
  END IF;
  
  -- Find user by email
  SELECT au.user_id, au.role INTO target_user_id, target_role
  FROM public.admin_users au
  LEFT JOIN auth.users u ON au.user_id = u.id
  WHERE u.email = admin_email OR au.email_cache = admin_email;
  
  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Admin not found with email: ' || admin_email
    );
  END IF;
  
  -- Prevent removing the last super-admin
  IF target_role = 'super-admin' THEN
    IF (SELECT COUNT(*) FROM public.admin_users WHERE role = 'super-admin') <= 1 THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Cannot remove the last super-admin'
      );
    END IF;
  END IF;
  
  -- Remove admin
  DELETE FROM public.admin_users
  WHERE user_id = target_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Admin user removed successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_admins() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_scholarships() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_content() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_admin_user(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_admin_user(TEXT) TO authenticated;

-- Step 4: Verify the fix worked
SELECT '=== ADMIN FUNCTIONS VERIFICATION ===' as status;

-- Test the add_admin_user function with a dummy call (it will fail gracefully)
SELECT 'Testing add_admin_user function...' as test;

-- Show current admin users
SELECT 'Current admin users:' as info;
SELECT 
  au.user_id,
  au.role,
  au.email_cache,
  u.email as actual_email
FROM public.admin_users au
LEFT JOIN auth.users u ON au.user_id = u.id
ORDER BY au.created_at DESC;

-- Show all admin-related functions
SELECT 'Available admin functions:' as info;
SELECT 
  proname as function_name,
  oidvectortypes(proargtypes) as parameters
FROM pg_proc 
WHERE proname LIKE '%admin%'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

SELECT '=== FIX COMPLETE ===' as status;






