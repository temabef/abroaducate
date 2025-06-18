-- Migration: Admin Direct Remove Function
-- Description: Creates a function to directly remove admin users without requiring admin privileges

-- Create a function that can directly remove an admin user
CREATE OR REPLACE FUNCTION public.admin_direct_remove(
  target_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Remove the user from admin_users
  DELETE FROM public.admin_users
  WHERE user_id = target_user_id;
    
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to authenticated users and anonymous users
GRANT EXECUTE ON FUNCTION public.admin_direct_remove(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_direct_remove(UUID) TO anon; 