-- Fix admin status - add current user as admin
-- First, let's see your current user details

-- Check your current user info
SELECT 
  auth.uid() as current_user_id,
  auth.email() as current_email,
  'Your current user details above' as note;

-- Check what's in the admin_users table
SELECT user_id, role, email_cache FROM public.admin_users;

-- Add current user to admin_users table (replace with your actual email)
-- IMPORTANT: Replace 'your-email@example.com' with your actual email address
INSERT INTO public.admin_users (user_id, role, email_cache, created_by)
SELECT 
  auth.uid(),
  'super-admin',
  auth.email(),
  auth.uid()
WHERE auth.email() IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET 
  role = 'super-admin',
  email_cache = auth.email();

-- Verify the insert worked
SELECT 
  user_id, 
  role, 
  email_cache,
  'After insert - should show your user' as note
FROM public.admin_users 
WHERE user_id = auth.uid();

-- Test admin function again
SELECT public.is_admin() as is_admin_result_after_fix;

