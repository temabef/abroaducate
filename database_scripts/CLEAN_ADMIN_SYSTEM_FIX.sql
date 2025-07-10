-- ====================================================================
-- COMPREHENSIVE ADMIN SYSTEM FIX
-- Run this directly on your Supabase dashboard
-- This replaces all the 65+ fix files with a clean, working solution
-- ====================================================================

-- Step 1: Backup existing admin_users (just in case)
-- You can comment this out if you don't want the backup
CREATE TABLE IF NOT EXISTS admin_users_backup AS 
SELECT * FROM public.admin_users;

-- Step 2: Clean up any existing problematic functions
DROP FUNCTION IF EXISTS public.get_admin_users_direct();
DROP FUNCTION IF EXISTS public.get_admin_users_with_emails();
DROP FUNCTION IF EXISTS public.admin_bypass_find_user(text);
DROP FUNCTION IF EXISTS public.add_admin_safe(text, text);
DROP FUNCTION IF EXISTS public.remove_admin_safe(text);
DROP FUNCTION IF EXISTS public.can_manage_admins();
DROP FUNCTION IF EXISTS public.can_manage_scholarships();
DROP FUNCTION IF EXISTS public.can_access_analytics();
DROP FUNCTION IF EXISTS public.can_manage_content();
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_admin_direct();

-- Step 3: Ensure admin_users table has correct structure
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin',
  email_cache TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Add email_cache column if it doesn't exist
ALTER TABLE public.admin_users 
ADD COLUMN IF NOT EXISTS email_cache TEXT;

-- Step 4: Standardize all role names (fix super-admin vs super_admin inconsistency)
UPDATE public.admin_users 
SET role = 'super-admin' 
WHERE role = 'super_admin' OR role = 'super-admin';

-- Step 5: Ensure the super admin users exist with correct emails
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

-- Step 6: Create centralized admin check function
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

-- Step 7: Create role-specific permission functions
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

-- Step 8: Create function to get admin users (fixes your current error)
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

-- Step 9: Create function to add admin users
CREATE OR REPLACE FUNCTION public.add_admin_user(
  admin_email TEXT,
  admin_role TEXT DEFAULT 'admin'
)
RETURNS jsonb AS $$
DECLARE
  target_user_id UUID;
  current_user_role TEXT;
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

  -- Find the user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = admin_email;
  
  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User not found with email: ' || admin_email
    );
  END IF;
  
  -- Add or update the user as admin
  INSERT INTO public.admin_users (user_id, role, email_cache, created_by)
  VALUES (target_user_id, admin_role, admin_email, auth.uid())
  ON CONFLICT (user_id)
  DO UPDATE SET
    role = admin_role,
    email_cache = admin_email,
    updated_at = NOW(),
    updated_by = auth.uid();
  
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

-- Step 10: Create function to remove admin users
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

-- Step 11: Set up proper RLS policies
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admin users policy" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Anyone can view admin status" ON public.admin_users;

-- Create simple, clear RLS policies
CREATE POLICY "Admins can view admin users"
  ON public.admin_users
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Super admins can manage admin users"
  ON public.admin_users
  FOR ALL
  USING (public.can_manage_admins());

-- Step 12: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_admins() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_scholarships() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_content() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_admin_user(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_admin_user(TEXT) TO authenticated;

-- Step 13: Update updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- VERIFICATION QUERIES (Run these to check everything worked)
-- ====================================================================

-- Check admin users
SELECT 
  au.*,
  u.email as actual_email
FROM public.admin_users au
LEFT JOIN auth.users u ON au.user_id = u.id
ORDER BY au.created_at;

-- Test permission functions
SELECT 
  'is_admin' as function_name,
  public.is_admin() as result
UNION ALL
SELECT 
  'can_manage_admins',
  public.can_manage_admins()
UNION ALL
SELECT 
  'can_manage_scholarships',
  public.can_manage_scholarships()
UNION ALL
SELECT 
  'can_access_analytics',
  public.can_access_analytics()
UNION ALL
SELECT 
  'can_manage_content',
  public.can_manage_content();

-- ====================================================================
-- CLEANUP COMPLETED - Your admin system is now fixed!
-- ==================================================================== 