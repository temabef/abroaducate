-- Temporary fix: Make storage completely permissive for testing
-- This will help us identify if the issue is with the policies or something else

-- Drop all existing storage policies for blog bucket
DROP POLICY IF EXISTS "Public can view blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete blog images" ON storage.objects;

-- Create very permissive policies for testing
CREATE POLICY "Anyone can view blog images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'blog');

-- TEMPORARY: Allow any authenticated user to upload to blog bucket
CREATE POLICY "Authenticated users can upload blog images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'blog' AND auth.role() = 'authenticated');

-- TEMPORARY: Allow any authenticated user to update blog images
CREATE POLICY "Authenticated users can update blog images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'blog' AND auth.role() = 'authenticated');

-- TEMPORARY: Allow any authenticated user to delete blog images
CREATE POLICY "Authenticated users can delete blog images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'blog' AND auth.role() = 'authenticated');

