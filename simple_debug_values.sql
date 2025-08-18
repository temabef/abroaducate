-- Simple debug to see exact values

-- Check your current user details
SELECT 
  auth.uid() as current_user_id,
  auth.email() as current_email;

-- Check if you're in admin_users table
SELECT 'admin_users table:' as label;
SELECT user_id, role, email_cache FROM public.admin_users WHERE user_id = auth.uid();

-- Test the individual conditions
SELECT 
  'Testing admin conditions:' as label,
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
  ) as in_admin_table,
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() 
    AND email IN ('admin@abroaducate.com', 'solakolawole62@gmail.com')
  ) as matches_super_admin_email;

