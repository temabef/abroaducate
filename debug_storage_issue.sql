-- Debug storage bucket and policies
-- Run this to check what's happening with the storage policies

-- First, let's check if the blog bucket exists and is public
SELECT id, name, public FROM storage.buckets WHERE id = 'blog';

-- Check what storage policies exist for the blog bucket
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE '%blog%';

-- Check your current user info
SELECT 
  auth.uid() as current_user_id,
  auth.email() as current_email;

-- Check if you're in admin_users table
SELECT user_id, role FROM public.admin_users WHERE user_id = auth.uid();

-- Test if the admin check functions work
SELECT public.is_admin() as is_admin_result;

