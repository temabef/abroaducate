-- Migration: Admin Direct Add Function
-- Description: Creates a function to directly add admin users without requiring admin privileges

-- Create a function that can directly add an admin user
CREATE OR REPLACE FUNCTION public.admin_direct_add(
  email_to_add TEXT,
  admin_role TEXT DEFAULT 'admin',
  creator_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  target_user_id UUID;
  current_user_id UUID := auth.uid();
  actual_creator_id UUID;
BEGIN
  -- Set the creator ID
  IF creator_id IS NULL THEN
    actual_creator_id := current_user_id;
  ELSE
    actual_creator_id := creator_id;
  END IF;
  
  -- Get the user ID from email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = email_to_add;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', email_to_add;
    RETURN FALSE;
  END IF;
  
  -- Add the user as admin
  INSERT INTO public.admin_users (user_id, role, created_by)
  VALUES (target_user_id, admin_role, actual_creator_id)
  ON CONFLICT (user_id) DO UPDATE SET
    role = admin_role,
    created_by = actual_creator_id;
    
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to authenticated users and anonymous users
GRANT EXECUTE ON FUNCTION public.admin_direct_add(TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_direct_add(TEXT, TEXT, UUID) TO anon; 