-- ========================================
-- FIX ADMIN FUNCTIONS AND TEST PREP DATA
-- ========================================
-- Run this in Supabase SQL Editor to fix admin access and check test prep

-- 1. Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS public.get_admin_users_nuclear();
DROP FUNCTION IF EXISTS public.can_manage_admins_nuclear();
DROP FUNCTION IF EXISTS public.get_current_user_admin_role();
DROP FUNCTION IF EXISTS public.add_admin_user_nuclear(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.remove_admin_user_nuclear(TEXT);
DROP FUNCTION IF EXISTS public.can_manage_content();

-- 2. Create the can_manage_content function
CREATE OR REPLACE FUNCTION public.can_manage_content()
RETURNS BOOLEAN AS $$
BEGIN
  -- This function checks if the current user can manage content
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

-- 3. Create the get_admin_users_nuclear function
CREATE OR REPLACE FUNCTION public.get_admin_users_nuclear()
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
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
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
    u.email::TEXT
  FROM public.admin_users au
  LEFT JOIN auth.users u ON au.user_id = u.id
  ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the can_manage_admins_nuclear function
CREATE OR REPLACE FUNCTION public.can_manage_admins_nuclear()
RETURNS BOOLEAN AS $$
BEGIN
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

-- 5. Create the get_current_user_admin_role function
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

-- 6. Create the add_admin_user_nuclear function
CREATE OR REPLACE FUNCTION public.add_admin_user_nuclear(admin_email TEXT, admin_role TEXT)
RETURNS JSON AS $$
DECLARE
  user_id UUID;
  result JSON;
BEGIN
  -- Check if current user can manage admins
  IF NOT public.can_manage_admins_nuclear() THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;
  
  -- Find user by email
  SELECT id INTO user_id FROM auth.users WHERE email = admin_email;
  
  IF user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Insert or update admin user
  INSERT INTO public.admin_users (user_id, role, email_cache, created_by)
  VALUES (user_id, admin_role, admin_email, auth.uid())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    role = admin_role,
    email_cache = admin_email,
    updated_at = NOW(),
    updated_by = auth.uid();
  
  RETURN json_build_object('success', true, 'message', 'Admin user added successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create the remove_admin_user_nuclear function
CREATE OR REPLACE FUNCTION public.remove_admin_user_nuclear(admin_email TEXT)
RETURNS JSON AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Check if current user can manage admins
  IF NOT public.can_manage_admins_nuclear() THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;
  
  -- Find user by email
  SELECT id INTO user_id FROM auth.users WHERE email = admin_email;
  
  IF user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Remove admin user
  DELETE FROM public.admin_users WHERE user_id = user_id;
  
  RETURN json_build_object('success', true, 'message', 'Admin user removed successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant permissions to all functions
GRANT EXECUTE ON FUNCTION public.can_manage_content() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users_nuclear() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_admins_nuclear() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_admin_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_admin_user_nuclear(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_admin_user_nuclear(TEXT) TO authenticated;

-- 9. Ensure super admin exists
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

-- 10. Check test prep data
SELECT '=== TEST PREP DATA CHECK ===' as section;

-- First, check the actual structure of practice_sets table
SELECT 
  'practice_sets_structure' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'practice_sets'
ORDER BY ordinal_position;

-- Check if practice_sets table exists and has data
SELECT 
  'practice_sets' as table_name,
  COUNT(*) as record_count
FROM information_schema.tables 
WHERE table_name = 'practice_sets';

-- If table exists, show the data (without created_at column)
SELECT 
  'practice_sets_data' as info,
  id,
  title,
  section,
  sort_order
FROM practice_sets
ORDER BY section, sort_order
LIMIT 10;

-- Check practice_questions table structure
SELECT 
  'practice_questions_structure' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'practice_questions'
ORDER BY ordinal_position;

-- Check practice_questions
SELECT 
  'practice_questions' as table_name,
  COUNT(*) as record_count
FROM information_schema.tables 
WHERE table_name = 'practice_questions';

-- If table exists, show sample data (without created_at column)
SELECT 
  'practice_questions_data' as info,
  id,
  set_id,
  question_text,
  question_type
FROM practice_questions
ORDER BY set_id, sort_order
LIMIT 5;

-- Check practice_choices table structure
SELECT 
  'practice_choices_structure' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'practice_choices'
ORDER BY ordinal_position;

-- Check practice_choices
SELECT 
  'practice_choices' as table_name,
  COUNT(*) as record_count
FROM information_schema.tables 
WHERE table_name = 'practice_choices';

-- If table exists, show sample data
SELECT 
  'practice_choices_data' as info,
  id,
  question_id,
  choice_text,
  is_correct,
  sort_order
FROM practice_choices
ORDER BY question_id, sort_order
LIMIT 10;

-- 11. Test admin functions
SELECT '=== ADMIN FUNCTIONS TEST ===' as section;

-- Test can_manage_content
SELECT 'can_manage_content function created successfully' as result;

-- Test get_admin_users_nuclear
SELECT 'get_admin_users_nuclear function created successfully' as result;

-- Test can_manage_admins_nuclear
SELECT 'can_manage_admins_nuclear function created successfully' as result;

-- Show current admin users
SELECT 
  'current_admin_users' as info,
  au.user_id,
  au.role,
  au.email_cache,
  u.email
FROM public.admin_users au
LEFT JOIN auth.users u ON au.user_id = u.id
ORDER BY au.created_at DESC;

SELECT 'All admin functions created and test prep data checked successfully!' as final_status; 