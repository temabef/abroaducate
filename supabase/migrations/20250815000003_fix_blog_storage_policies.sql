-- Fix blog storage policies that were lost in previous migration
-- This addresses the RLS policy violation when uploading images

-- Ensure blog bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('blog', 'blog', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Public can view blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete blog images" ON storage.objects;

-- Recreate storage policies for blog bucket
CREATE POLICY "Public can view blog images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'blog');

CREATE POLICY "Admins can upload blog images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'blog' AND 
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can update blog images" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'blog' AND 
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete blog images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'blog' AND 
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

