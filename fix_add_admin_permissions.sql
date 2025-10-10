-- Fix the add_admin_user function to properly recognize super-admins

-- Drop the existing function
DROP FUNCTION IF EXISTS public.add_admin_user(text, text) CASCADE;

-- Create a corrected version that properly checks super-admin status
CREATE OR REPLACE FUNCTION public.add_admin_user(
  admin_email TEXT,
  admin_role TEXT DEFAULT 'admin'
)
RETURNS jsonb AS $$
DECLARE
  target_user_id UUID;
  current_user_id UUID := auth.uid();
  current_user_email TEXT;
BEGIN
  -- Get current user's email for debugging
  SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;
  
  -- Check if current user can manage admins (multiple ways)
  IF NOT (
    -- Check if user is in admin_users table with super-admin role
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = current_user_id
      AND role = 'super-admin'
    ) OR
    -- Check if user is a hardcoded super-admin email
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = current_user_id 
      AND email IN ('admin@abroaducate.com', 'solakolawole62@gmail.com')
    )
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Only super-admins can add admin users. Current user: ' || COALESCE(current_user_email, 'unknown') || ' (ID: ' || COALESCE(current_user_id::text, 'null') || ')'
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.add_admin_user(TEXT, TEXT) TO authenticated;

-- Test the function with debug info
SELECT '=== DEBUGGING ADMIN PERMISSIONS ===' as info;

-- Check current user info
SELECT 
  'Current User' as check_type,
  auth.uid() as user_id,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as email;

-- Check if current user is in admin_users table
SELECT 
  'Admin Users Check' as check_type,
  au.role,
  au.user_id,
  u.email
FROM public.admin_users au
LEFT JOIN auth.users u ON au.user_id = u.id
WHERE au.user_id = auth.uid();

-- Test the add_admin_user function
SELECT '=== TESTING add_admin_user FUNCTION ===' as info;
SELECT public.add_admin_user('eshowoebgar@gmail.com', 'admin') as result;







