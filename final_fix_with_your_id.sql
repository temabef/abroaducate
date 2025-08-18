-- Final fix using your exact user ID and email

-- First, let's add you to admin_users table with your exact details
INSERT INTO public.admin_users (user_id, role, email_cache, created_by)
VALUES (
  'f443d194-4b56-48da-9251-6c3f790f0f33'::uuid,
  'super-admin',
  'solakolawole62@gmail.com',
  'f443d194-4b56-48da-9251-6c3f790f0f33'::uuid
)
ON CONFLICT (user_id) DO UPDATE SET 
  role = 'super-admin',
  email_cache = 'solakolawole62@gmail.com';

-- Verify you're now in the table
SELECT user_id, role, email_cache FROM public.admin_users WHERE user_id = 'f443d194-4b56-48da-9251-6c3f790f0f33'::uuid;

-- Test admin function again
SELECT public.is_admin() as should_be_true_now;

-- Also create storage policies using your specific user ID (backup plan)
-- Drop all existing storage policies for blog bucket
DROP POLICY IF EXISTS "Public can view blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete blog images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete blog images" ON storage.objects;
DROP POLICY IF EXISTS "Specific user can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Specific user can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Specific user can delete blog images" ON storage.objects;

-- Create policies that work with both admin function AND your specific ID
CREATE POLICY "Anyone can view blog images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'blog');

CREATE POLICY "Admin user can upload blog images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'blog' AND (
    auth.uid() = 'f443d194-4b56-48da-9251-6c3f790f0f33'::uuid OR
    auth.email() = 'solakolawole62@gmail.com' OR
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Admin user can update blog images" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'blog' AND (
    auth.uid() = 'f443d194-4b56-48da-9251-6c3f790f0f33'::uuid OR
    auth.email() = 'solakolawole62@gmail.com' OR
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Admin user can delete blog images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'blog' AND (
    auth.uid() = 'f443d194-4b56-48da-9251-6c3f790f0f33'::uuid OR
    auth.email() = 'solakolawole62@gmail.com' OR
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  )
);

