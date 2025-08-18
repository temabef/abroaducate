-- Recreate the admin function without dropping it first

-- Just replace the existing function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Direct check for your specific user ID first
  IF auth.uid() = 'f443d194-4b56-48da-9251-6c3f790f0f33'::uuid THEN
    RETURN TRUE;
  END IF;
  
  -- Check for super admin emails
  IF auth.email() IN ('admin@abroaducate.com', 'solakolawole62@gmail.com') THEN
    RETURN TRUE;
  END IF;
  
  -- Check admin_users table
  IF EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()) THEN
    RETURN TRUE;
  END IF;
  
  -- Default to false
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the updated function
SELECT public.is_admin() as updated_function_result;

-- Test each condition individually to see what's happening
SELECT 
  auth.uid() as your_id,
  auth.email() as your_email,
  (auth.uid() = 'f443d194-4b56-48da-9251-6c3f790f0f33'::uuid) as matches_your_id,
  (auth.email() IN ('admin@abroaducate.com', 'solakolawole62@gmail.com')) as matches_email,
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()) as in_admin_table;

