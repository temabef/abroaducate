-- Enforce proper role-based permissions for admin users
-- This migration adds specific functions to check permissions based on admin roles

-- First, update the can_manage_scholarships function to allow all admin roles to manage scholarships
CREATE OR REPLACE FUNCTION public.can_manage_scholarships()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND (role = 'super-admin' OR role = 'admin' OR role = 'scholarship-admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user can manage other admins (super-admin only)
CREATE OR REPLACE FUNCTION public.can_manage_admins()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND role = 'super-admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user can access analytics (super-admin and admin)
CREATE OR REPLACE FUNCTION public.can_access_analytics()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND (role = 'super-admin' OR role = 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user can manage content (super-admin and admin)
CREATE OR REPLACE FUNCTION public.can_manage_content()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND (role = 'super-admin' OR role = 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the add_admin_safe function to require super-admin role
CREATE OR REPLACE FUNCTION public.add_admin_safe(admin_email text, admin_role text)
RETURNS jsonb AS $$
DECLARE
  target_user_id uuid;
  current_user_role text;
  result jsonb;
BEGIN
  -- Check if current user is a super-admin
  SELECT role INTO current_user_role
  FROM public.admin_users
  WHERE user_id = auth.uid();
  
  IF current_user_role IS NULL OR current_user_role != 'super-admin' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Only super-admin users can add new admins'
    );
  END IF;

  -- Find the user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = admin_email;
  
  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User not found with that email'
    );
  END IF;
  
  -- Add or update the user as admin
  INSERT INTO public.admin_users (user_id, role, email_cache, created_by)
  VALUES (target_user_id, admin_role, admin_email, auth.uid())
  ON CONFLICT (user_id)
  DO UPDATE SET
    role = admin_role,
    email_cache = admin_email,
    updated_at = now(),
    updated_by = auth.uid();
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Admin added successfully',
    'user_id', target_user_id,
    'role', admin_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the remove_admin_safe function to require super-admin role
CREATE OR REPLACE FUNCTION public.remove_admin_safe(admin_email text)
RETURNS jsonb AS $$
DECLARE
  target_user_id uuid;
  target_role text;
  current_user_role text;
  result jsonb;
BEGIN
  -- Check if current user is a super-admin
  SELECT role INTO current_user_role
  FROM public.admin_users
  WHERE user_id = auth.uid();
  
  IF current_user_role IS NULL OR current_user_role != 'super-admin' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Only super-admin users can remove admins'
    );
  END IF;

  -- Find the admin user by email
  SELECT user_id, role INTO target_user_id, target_role
  FROM public.admin_users
  WHERE email_cache = admin_email;
  
  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Admin not found with that email'
    );
  END IF;
  
  -- Prevent removing other super-admins
  IF target_role = 'super-admin' AND target_user_id != auth.uid() THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Cannot remove other super-admin users'
    );
  END IF;
  
  -- Remove the admin
  DELETE FROM public.admin_users
  WHERE user_id = target_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Admin removed successfully',
    'user_id', target_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 