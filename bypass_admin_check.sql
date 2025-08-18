-- TEMPORARY: Bypass admin check completely for storage
-- This will get image uploads working while we debug the admin function

-- Drop all existing storage policies for blog bucket
DROP POLICY IF EXISTS "Public can view blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete blog images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete blog images" ON storage.objects;

-- Create simple policies that work
CREATE POLICY "Anyone can view blog images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'blog');

-- Allow your specific user to upload (replace with your actual user ID from the debug)
-- You'll need to get your user_id from the debug query above
CREATE POLICY "Specific user can upload blog images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'blog' AND 
  auth.uid()::text IN (
    -- Add your actual user ID here - get it from the debug query
    'your-user-id-here'
  )
);

CREATE POLICY "Specific user can update blog images" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'blog' AND 
  auth.uid()::text IN (
    -- Add your actual user ID here - get it from the debug query  
    'your-user-id-here'
  )
);

CREATE POLICY "Specific user can delete blog images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'blog' AND 
  auth.uid()::text IN (
    -- Add your actual user ID here - get it from the debug query
    'your-user-id-here'
  )
);

