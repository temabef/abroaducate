-- Migration: Direct Admin Check Function
-- Description: Creates a function that directly checks for specific user IDs

-- Create a function that directly checks for specific user IDs/emails
CREATE OR REPLACE FUNCTION public.is_admin_direct()
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID := auth.uid();
  current_user_email TEXT;
BEGIN
  -- Get the user's email
  SELECT email INTO current_user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  -- Direct check for specific emails
  IF current_user_email = 'admin@abroaducate.com' OR 
     current_user_email = 'solakolawole62@gmail.com' THEN
    RETURN TRUE;
  END IF;
  
  -- Check admin_users table as fallback
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = current_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.is_admin_direct() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_direct() TO anon; 