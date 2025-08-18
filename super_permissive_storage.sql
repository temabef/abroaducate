-- Create super permissive storage policies for blog bucket only
-- This will help us isolate if the issue is with authentication or something else

-- First, let's see what the current situation is
SELECT 
    name,
    id,
    public
FROM storage.buckets 
WHERE name = 'blog';

-- Remove all existing blog-related storage policies
DROP POLICY IF EXISTS "blog_select_public" ON storage.objects;
DROP POLICY IF EXISTS "blog_insert_auth" ON storage.objects;
DROP POLICY IF EXISTS "blog_update_auth" ON storage.objects;
DROP POLICY IF EXISTS "blog_delete_auth" ON storage.objects;

-- Create extremely permissive policies for blog bucket
-- These should work regardless of authentication status

CREATE POLICY "blog_public_select" ON storage.objects
    FOR SELECT USING (bucket_id = 'blog');

-- Allow anyone to insert into blog bucket (temporary for testing)
CREATE POLICY "blog_public_insert" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'blog');

CREATE POLICY "blog_public_update" ON storage.objects
    FOR UPDATE USING (bucket_id = 'blog');

CREATE POLICY "blog_public_delete" ON storage.objects
    FOR DELETE USING (bucket_id = 'blog');

-- Verify the new policies
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
