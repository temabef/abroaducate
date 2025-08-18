-- Create storage policies that don't require authentication context
-- This will work regardless of the SQL execution context

-- Drop all existing storage policies for blog bucket
DROP POLICY IF EXISTS "Public can view blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete blog images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admin user can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admin user can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admin user can delete blog images" ON storage.objects;

-- Create simple policies that work for authenticated users
CREATE POLICY "Public can view blog images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'blog');

-- Allow all authenticated users to upload to blog bucket (temporary solution)
CREATE POLICY "Authenticated can upload blog images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'blog' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update blog images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'blog' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete blog images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'blog' AND auth.role() = 'authenticated');

