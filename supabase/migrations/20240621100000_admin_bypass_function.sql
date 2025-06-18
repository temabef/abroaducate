-- Migration: Admin Bypass Function
-- Description: Creates a function to bypass RLS and add the current user as an admin

-- Create a function that can bypass RLS to add the current user as an admin
CREATE OR REPLACE FUNCTION public.admin_bypass_add_self()
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID := auth.uid();
  current_user_email TEXT;
BEGIN
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'You must be logged in to perform this action';
    RETURN FALSE;
  END IF;
  
  -- Get the user's email
  SELECT email INTO current_user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  -- Log the attempt
  RAISE NOTICE 'User % (%) is attempting to add themselves as admin', current_user_email, current_user_id;
  
  -- Insert directly using security definer to bypass RLS
  INSERT INTO public.admin_users (user_id, role, created_by)
  VALUES (current_user_id, 'super_admin', current_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.admin_bypass_add_self() TO authenticated; 