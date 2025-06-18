-- Add the specific user as a scholarship admin
-- First, ensure the admin_users table has an email_cache column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'admin_users' 
    AND column_name = 'email_cache'
  ) THEN
    ALTER TABLE public.admin_users ADD COLUMN email_cache text;
  END IF;
END $$;

-- Add or update the user as a scholarship admin
INSERT INTO public.admin_users (user_id, role, email_cache)
VALUES 
  ('395fe4b0-a8d2-4f03-b29e-b4ee03c06f4e', 'scholarship-admin', 'temabef@gmail.com')
ON CONFLICT (user_id) 
DO UPDATE SET 
  role = 'scholarship-admin',
  email_cache = 'temabef@gmail.com';

-- Create or replace the admin_bypass_rls function
CREATE OR REPLACE FUNCTION public.admin_bypass_rls()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the check_admin_access function
CREATE OR REPLACE FUNCTION public.check_admin_access()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the can_manage_scholarships function
CREATE OR REPLACE FUNCTION public.can_manage_scholarships()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND (role = 'super-admin' OR role = 'admin' OR role = 'scholarship-admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 