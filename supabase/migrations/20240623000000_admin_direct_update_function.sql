-- Migration: Admin Direct Update Function
-- Description: Creates a function to directly update an admin user's role without requiring admin privileges

-- Create a function that can directly update an admin user's role
CREATE OR REPLACE FUNCTION public.admin_direct_update_role(
  target_user_id UUID,
  new_role TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update the user's role in admin_users
  UPDATE public.admin_users
  SET role = new_role
  WHERE user_id = target_user_id;
    
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to authenticated users and anonymous users
GRANT EXECUTE ON FUNCTION public.admin_direct_update_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_direct_update_role(UUID, TEXT) TO anon; 