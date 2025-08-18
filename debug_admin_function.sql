-- Debug the is_admin() function to see why it's failing

-- Check your current user details
SELECT 
  auth.uid() as current_user_id,
  auth.email() as current_email;

-- Check if you're now in admin_users table
SELECT user_id, role, email_cache FROM public.admin_users WHERE user_id = auth.uid();

-- Check if your email matches the hardcoded super admin emails
SELECT 
  auth.email() as your_email,
  CASE 
    WHEN auth.email() = 'admin@abroaducate.com' THEN 'Matches admin@abroaducate.com'
    WHEN auth.email() = 'solakolawole62@gmail.com' THEN 'Matches solakolawole62@gmail.com'
    ELSE 'Does not match hardcoded emails'
  END as email_check;

-- Test the individual parts of the is_admin() function
SELECT 
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
  ) as in_admin_table,
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() 
    AND email IN ('admin@abroaducate.com', 'solakolawole62@gmail.com')
  ) as matches_super_admin_email;

-- Let's see the actual is_admin function definition
SELECT pg_get_functiondef('public.is_admin'::regproc) as function_definition;

