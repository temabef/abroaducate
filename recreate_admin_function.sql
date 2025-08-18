-- Recreate the is_admin function with better debugging

-- Drop and recreate the is_admin function
DROP FUNCTION IF EXISTS public.is_admin();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
  current_email TEXT;
  in_admin_table BOOLEAN;
  is_super_admin_email BOOLEAN;
BEGIN
  -- Get current user info
  current_user_id := auth.uid();
  
  -- Check if user ID is null (not authenticated)
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get current user email
  SELECT email INTO current_email FROM auth.users WHERE id = current_user_id;
  
  -- Check if user is in admin_users table
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = current_user_id
  ) INTO in_admin_table;
  
  -- Check if user email matches super admin emails
  SELECT CASE 
    WHEN current_email = 'admin@abroaducate.com' OR current_email = 'solakolawole62@gmail.com' 
    THEN TRUE 
    ELSE FALSE 
  END INTO is_super_admin_email;
  
  -- Return true if either condition is met
  RETURN in_admin_table OR is_super_admin_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- Test the new function
SELECT public.is_admin() as new_is_admin_result;

