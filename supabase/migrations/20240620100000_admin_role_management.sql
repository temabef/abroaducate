-- Migration: Admin Role Management System
-- Description: Creates a centralized system for managing admin users and roles

-- 1. Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add comment to table
COMMENT ON TABLE public.admin_users IS 'Stores admin users and their roles';

-- 2. Enable RLS on admin_users table
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for admin_users table

-- Only super admins can manage admin users
CREATE POLICY "Super admins can manage admin users" 
  ON public.admin_users
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@abroaducate.com' OR
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'solakolawole62@gmail.com'
  );

-- Anyone can view admin status
CREATE POLICY "Anyone can view admin status"
  ON public.admin_users
  FOR SELECT
  USING (true);

-- 4. Create admin check function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
  ) OR 
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@abroaducate.com' OR
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'solakolawole62@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- 5. Insert initial admin users
INSERT INTO public.admin_users (user_id, role, created_by)
SELECT id, 'super_admin', id
FROM auth.users
WHERE 
  email = 'admin@abroaducate.com' OR
  email = 'solakolawole62@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- 6. Create function to add admin users
CREATE OR REPLACE FUNCTION public.add_admin_user(
  email_to_add TEXT,
  admin_role TEXT DEFAULT 'admin'
)
RETURNS BOOLEAN AS $$
DECLARE
  user_to_add_id UUID;
  calling_user_id UUID := auth.uid();
BEGIN
  -- Check if calling user is an admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can add other admins';
    RETURN FALSE;
  END IF;
  
  -- Get user ID from email
  SELECT id INTO user_to_add_id
  FROM auth.users
  WHERE email = email_to_add;
  
  IF user_to_add_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', email_to_add;
    RETURN FALSE;
  END IF;
  
  -- Add user as admin
  INSERT INTO public.admin_users (user_id, role, created_by)
  VALUES (user_to_add_id, admin_role, calling_user_id)
  ON CONFLICT (user_id) DO UPDATE SET
    role = admin_role,
    created_by = calling_user_id;
    
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.add_admin_user(TEXT, TEXT) TO authenticated;

-- 7. Create function to remove admin users
CREATE OR REPLACE FUNCTION public.remove_admin_user(
  email_to_remove TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  user_to_remove_id UUID;
  calling_user_id UUID := auth.uid();
  calling_user_email TEXT;
BEGIN
  -- Check if calling user is an admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can remove other admins';
    RETURN FALSE;
  END IF;
  
  -- Get user ID from email
  SELECT id INTO user_to_remove_id
  FROM auth.users
  WHERE email = email_to_remove;
  
  IF user_to_remove_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', email_to_remove;
    RETURN FALSE;
  END IF;
  
  -- Get calling user's email
  SELECT email INTO calling_user_email
  FROM auth.users
  WHERE id = calling_user_id;
  
  -- Prevent removing super admins unless you're another super admin
  IF email_to_remove = 'admin@abroaducate.com' OR email_to_remove = 'solakolawole62@gmail.com' THEN
    IF calling_user_email != 'admin@abroaducate.com' AND calling_user_email != 'solakolawole62@gmail.com' THEN
      RAISE EXCEPTION 'Cannot remove super admin users';
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Remove user from admin_users
  DELETE FROM public.admin_users
  WHERE user_id = user_to_remove_id;
    
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.remove_admin_user(TEXT) TO authenticated; 