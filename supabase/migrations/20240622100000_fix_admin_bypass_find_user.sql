-- Migration: Fix Admin Bypass Find User Function
-- Description: Updates the function to not require authentication

-- Update the function to not require authentication
CREATE OR REPLACE FUNCTION public.admin_bypass_find_user(email_to_find TEXT)
RETURNS json AS $$
DECLARE
  found_user_id UUID;
  found_user_email TEXT;
BEGIN
  -- Get the user ID from email
  SELECT id, email INTO found_user_id, found_user_email
  FROM auth.users
  WHERE email = email_to_find;
  
  -- Return the user info as JSON
  RETURN json_build_object(
    'id', found_user_id,
    'email', found_user_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to both authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.admin_bypass_find_user(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_bypass_find_user(TEXT) TO anon; 