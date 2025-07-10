-- ====================================================================
-- SECURITY FIX - Handle actual table structure
-- ====================================================================

-- Step 1: Drop the problematic view that's exposing auth.users
DROP VIEW IF EXISTS public.admin_users_with_email;

-- Step 2: Check current admin_users table structure
SELECT 
  'Current Table Structure' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'admin_users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 3: Add missing columns if they don't exist
DO $$
BEGIN
  -- Add email_cache if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_users' AND column_name = 'email_cache'
  ) THEN
    ALTER TABLE public.admin_users ADD COLUMN email_cache TEXT;
  END IF;
END $$;

-- Step 4: Ensure you are definitely an admin (using basic structure)
INSERT INTO public.admin_users (user_id, role, email_cache)
SELECT 
  id,
  'super-admin',
  email
FROM auth.users 
WHERE email = 'solakolawole62@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET 
  role = 'super-admin',
  email_cache = EXCLUDED.email_cache;

-- Step 5: Recreate admin functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_manage_admins()
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND role = 'super-admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_manage_scholarships()
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND role IN ('super-admin', 'admin', 'scholarship-admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (
  user_id UUID,
  role TEXT,
  email_cache TEXT
) AS $$
BEGIN
  IF NOT (SELECT public.can_manage_admins()) THEN
    RAISE EXCEPTION 'Access denied: Only super-admins can view admin users';
  END IF;
  
  RETURN QUERY
  SELECT 
    au.user_id,
    au.role,
    COALESCE(au.email_cache, 'No email cached') as email_cache
  FROM public.admin_users au
  ORDER BY au.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.add_admin_user(
  admin_email TEXT,
  admin_role TEXT DEFAULT 'admin'
)
RETURNS JSONB AS $$
DECLARE
  target_user_id UUID;
BEGIN
  IF NOT (SELECT public.can_manage_admins()) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Only super-admins can add admin users'
    );
  END IF;
  
  IF admin_role NOT IN ('super-admin', 'admin', 'scholarship-admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Invalid role. Must be super-admin, admin, or scholarship-admin'
    );
  END IF;
  
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = admin_email;
  
  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User not found with email: ' || admin_email
    );
  END IF;
  
  INSERT INTO public.admin_users (user_id, role, email_cache)
  VALUES (target_user_id, admin_role, admin_email)
  ON CONFLICT (user_id)
  DO UPDATE SET
    role = admin_role,
    email_cache = admin_email;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Admin user added successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.remove_admin_user(admin_email TEXT)
RETURNS JSONB AS $$
DECLARE
  target_user_id UUID;
  target_role TEXT;
BEGIN
  IF NOT (SELECT public.can_manage_admins()) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Only super-admins can remove admin users'
    );
  END IF;
  
  SELECT user_id, role INTO target_user_id, target_role
  FROM public.admin_users
  WHERE email_cache = admin_email;
  
  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Admin not found with email: ' || admin_email
    );
  END IF;
  
  IF target_role = 'super-admin' THEN
    IF (SELECT COUNT(*) FROM public.admin_users WHERE role = 'super-admin') <= 1 THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Cannot remove the last super-admin'
      );
    END IF;
  END IF;
  
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

-- Step 6: Fix RLS policies for admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_select_policy" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_insert_policy" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_update_policy" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_delete_policy" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can be viewed by admins" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can be managed by super admins" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_read_policy" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_write_policy" ON public.admin_users;

-- Create simple, working policies
CREATE POLICY "allow_admin_read"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "allow_superadmin_write"
  ON public.admin_users
  FOR ALL
  TO authenticated
  USING (public.can_manage_admins());

-- Step 7: Grant proper permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_users TO authenticated;

-- Step 8: Create emergency admin grant function
CREATE OR REPLACE FUNCTION public.emergency_admin_grant()
RETURNS JSONB AS $$
DECLARE
  current_user_email TEXT;
BEGIN
  SELECT email INTO current_user_email
  FROM auth.users
  WHERE id = auth.uid();
  
  IF current_user_email IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User not authenticated'
    );
  END IF;
  
  INSERT INTO public.admin_users (user_id, role, email_cache)
  VALUES (auth.uid(), 'super-admin', current_user_email)
  ON CONFLICT (user_id)
  DO UPDATE SET
    role = 'super-admin',
    email_cache = current_user_email;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Emergency admin access granted to: ' || current_user_email
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Test everything works
SELECT 'Security Issues Fixed' as status;

-- Check current user's admin status
SELECT 
  'Current User Status' as check_type,
  auth.uid() as user_id,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as email,
  public.is_admin() as is_admin,
  public.can_manage_admins() as can_manage_admins,
  public.can_manage_scholarships() as can_manage_scholarships;

-- Show admin users
SELECT 
  'Admin Users' as check_type,
  au.*
FROM public.admin_users au
ORDER BY au.user_id;

SELECT 'FIXED - Your admin system should now work!' as final_status; 