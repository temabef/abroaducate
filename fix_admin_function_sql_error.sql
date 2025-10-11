-- Fix the GROUP BY error in get_admin_users function

-- Drop the problematic function
DROP FUNCTION IF EXISTS public.get_admin_users() CASCADE;

-- Create a corrected version without ORDER BY in the aggregate
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  -- Build the result as a JSONB array (no permission checks for now)
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
    ) ORDER BY au.created_at DESC
  ) INTO result
  FROM public.admin_users au
  LEFT JOIN auth.users u ON au.user_id = u.id;
  
  -- Return the result or empty array if no admins found
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_admin_users() TO authenticated;

-- Test the function
SELECT 'Testing get_admin_users function...' as status;
SELECT public.get_admin_users() as result;







