-- Migration: Admin Bypass Find User Function
-- Description: Creates a function to find a user by email without requiring admin privileges

-- Create a function that can find a user by email
CREATE OR REPLACE FUNCTION public.admin_bypass_find_user(email_to_find TEXT)
RETURNS json AS $$
DECLARE
  found_user_id UUID;
  found_user_email TEXT;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be logged in to perform this action';
    RETURN NULL;
  END IF;
  
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

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.admin_bypass_find_user(TEXT) TO authenticated; 