-- Fix the get_admin_users function structure mismatch
-- The function returns a TABLE but frontend expects a simple array

-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_admin_users() CASCADE;

-- Create a new get_admin_users function that returns JSONB array instead of TABLE
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  -- Only allow super-admins to view admin users
  IF NOT (SELECT public.can_manage_admins()) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Permission denied: Only super-admins can view admin users'
    );
  END IF;
  
  -- Build the result as a JSONB array
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', au.user_id,
      'role', au.role,
      'email_cache', au.email_cache,
      'created_at', au.created_at,
      'created_by', au.created_by,
      'updated_at', au.updated_at,
      'updated_by', au.updated_by,
      'email', u.email
    )
  ) INTO result
  FROM public.admin_users au
  LEFT JOIN auth.users u ON au.user_id = u.id
  ORDER BY au.created_at DESC;
  
  -- Return the result or empty array if no admins found
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_admin_users() TO authenticated;

-- Test the function
SELECT 'Testing get_admin_users function...' as status;
SELECT public.get_admin_users() as result;






