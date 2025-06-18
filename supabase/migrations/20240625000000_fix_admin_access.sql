-- Fix admin access checks and permissions
-- This migration adds email caching to admin_users and updates RPC functions for permission checks

-- Add email_cache column to admin_users if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT FROM pg_attribute 
    WHERE attrelid = 'public.admin_users'::regclass 
    AND attname = 'email_cache'
    AND NOT attisdropped
  ) THEN
    ALTER TABLE public.admin_users ADD COLUMN email_cache TEXT;
  END IF;
END $$;

-- Update existing admin_users with emails from auth.users
UPDATE public.admin_users 
SET email_cache = auth.users.email 
FROM auth.users 
WHERE admin_users.user_id = auth.users.id 
AND admin_users.email_cache IS NULL;

-- Drop existing functions if they exist (with CASCADE to handle dependencies)
DROP FUNCTION IF EXISTS public.check_admin_access() CASCADE;
DROP FUNCTION IF EXISTS public.can_manage_scholarships() CASCADE;
DROP FUNCTION IF EXISTS public.add_admin_safe(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.remove_admin_safe(text) CASCADE;

-- Create function to check if current user has admin access
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
  user_email text;
  user_id uuid;
BEGIN
  -- Get current user ID
  user_id := auth.uid();
  
  -- Return false if not authenticated
  IF user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get user email
  SELECT email INTO user_email FROM auth.users WHERE id = user_id;
  
  -- Special admin emails always have access
  IF user_email = 'solakolawole62@gmail.com' OR user_email = 'admin@abroaducate.com' THEN
    RETURN true;
  END IF;
  
  -- Check if user is in admin_users table
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  ) INTO is_admin;
  
  RETURN is_admin;
END;
$$;

-- Create function to check if current user can manage scholarships
CREATE OR REPLACE FUNCTION public.can_manage_scholarships()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
  user_email text;
  user_id uuid;
BEGIN
  -- Get current user ID
  user_id := auth.uid();
  
  -- Return false if not authenticated
  IF user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get user email
  SELECT email INTO user_email FROM auth.users WHERE id = user_id;
  
  -- Special admin emails always have access
  IF user_email = 'solakolawole62@gmail.com' OR user_email = 'admin@abroaducate.com' THEN
    RETURN true;
  END IF;
  
  -- Check if user is in admin_users table with appropriate role
  SELECT role INTO user_role FROM public.admin_users WHERE user_id = auth.uid();
  
  -- Allow access for super-admin, admin, or scholarship-admin roles
  RETURN user_role IN ('super-admin', 'admin', 'scholarship-admin');
END;
$$;

-- Secure function to add an admin user
CREATE OR REPLACE FUNCTION public.add_admin_safe(email_to_add text, role_to_add text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  current_user_role text;
  target_user_id uuid;
  result json;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if current user is super-admin
  SELECT role INTO current_user_role FROM public.admin_users WHERE user_id = current_user_id;
  
  -- Only super-admin can add other admins
  IF current_user_role != 'super-admin' THEN
    RETURN json_build_object('success', false, 'message', 'Only super-admins can add admin users');
  END IF;
  
  -- Validate role
  IF role_to_add NOT IN ('admin', 'scholarship-admin') THEN
    RETURN json_build_object('success', false, 'message', 'Invalid role. Must be admin or scholarship-admin');
  END IF;
  
  -- Find user by email
  SELECT id INTO target_user_id FROM auth.users WHERE email = email_to_add;
  
  -- Check if user exists
  IF target_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'User not found with that email');
  END IF;
  
  -- Check if user is already an admin
  IF EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = target_user_id) THEN
    RETURN json_build_object('success', false, 'message', 'User is already an admin');
  END IF;
  
  -- Add user as admin
  INSERT INTO public.admin_users (user_id, role, email_cache)
  VALUES (target_user_id, role_to_add, email_to_add);
  
  RETURN json_build_object('success', true, 'message', 'Admin user added successfully');
EXCEPTION
  WHEN others THEN
    RETURN json_build_object('success', false, 'message', 'Error adding admin: ' || SQLERRM);
END;
$$;

-- Secure function to remove an admin user
CREATE OR REPLACE FUNCTION public.remove_admin_safe(email_to_remove text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  current_user_role text;
  current_user_email text;
  target_user_id uuid;
  target_user_role text;
  result json;
BEGIN
  -- Get current user ID and email
  current_user_id := auth.uid();
  SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;
  
  -- Check if current user is super-admin
  SELECT role INTO current_user_role FROM public.admin_users WHERE user_id = current_user_id;
  
  -- Only super-admin can remove admins
  IF current_user_role != 'super-admin' THEN
    RETURN json_build_object('success', false, 'message', 'Only super-admins can remove admin users');
  END IF;
  
  -- Find user by email
  SELECT id INTO target_user_id FROM auth.users WHERE email = email_to_remove;
  
  -- Check if user exists
  IF target_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'User not found with that email');
  END IF;
  
  -- Get target user role
  SELECT role INTO target_user_role FROM public.admin_users WHERE user_id = target_user_id;
  
  -- Prevent removing super-admin accounts
  IF target_user_role = 'super-admin' THEN
    RETURN json_build_object('success', false, 'message', 'Cannot remove super-admin accounts');
  END IF;
  
  -- Prevent removing yourself
  IF current_user_email = email_to_remove THEN
    RETURN json_build_object('success', false, 'message', 'Cannot remove your own admin access');
  END IF;
  
  -- Remove user from admin_users
  DELETE FROM public.admin_users WHERE user_id = target_user_id;
  
  RETURN json_build_object('success', true, 'message', 'Admin user removed successfully');
EXCEPTION
  WHEN others THEN
    RETURN json_build_object('success', false, 'message', 'Error removing admin: ' || SQLERRM);
END;
$$;

-- Update RLS policies for admin_users table
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS admin_users_select_policy ON public.admin_users;
DROP POLICY IF EXISTS admin_users_insert_policy ON public.admin_users;
DROP POLICY IF EXISTS admin_users_update_policy ON public.admin_users;
DROP POLICY IF EXISTS admin_users_delete_policy ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;

-- Create policies for admin_users table
CREATE POLICY admin_users_select_policy ON public.admin_users
  FOR SELECT USING (public.check_admin_access());
  
CREATE POLICY admin_users_insert_policy ON public.admin_users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() 
      AND role = 'super-admin'
    )
  );
  
CREATE POLICY admin_users_update_policy ON public.admin_users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() 
      AND role = 'super-admin'
    )
  );
  
CREATE POLICY admin_users_delete_policy ON public.admin_users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() 
      AND role = 'super-admin'
    )
  );

-- Update RLS policies for scholarships table
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS scholarships_select_policy ON public.scholarships;
DROP POLICY IF EXISTS scholarships_insert_policy ON public.scholarships;
DROP POLICY IF EXISTS scholarships_update_policy ON public.scholarships;
DROP POLICY IF EXISTS scholarships_delete_policy ON public.scholarships;
DROP POLICY IF EXISTS "Admins can manage scholarships" ON public.scholarships;

-- Create policies for scholarships table
CREATE POLICY scholarships_select_policy ON public.scholarships
  FOR SELECT USING (
    is_active OR public.can_manage_scholarships()
  );
  
CREATE POLICY scholarships_insert_policy ON public.scholarships
  FOR INSERT WITH CHECK (
    public.can_manage_scholarships()
  );
  
CREATE POLICY scholarships_update_policy ON public.scholarships
  FOR UPDATE USING (
    public.can_manage_scholarships()
  );
  
CREATE POLICY scholarships_delete_policy ON public.scholarships
  FOR DELETE USING (
    public.can_manage_scholarships()
  ); 