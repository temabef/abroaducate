-- Now that upload works, let's secure the storage back to admin-only
-- We'll use a simple approach that should work

-- Remove the super permissive policies
DROP POLICY IF EXISTS "blog_public_select" ON storage.objects;
DROP POLICY IF EXISTS "blog_public_insert" ON storage.objects;
DROP POLICY IF EXISTS "blog_public_update" ON storage.objects;
DROP POLICY IF EXISTS "blog_public_delete" ON storage.objects;

-- Create admin-only policies using direct user ID check
-- (This avoids the is_admin() function issues we had)

CREATE POLICY "blog_public_view" ON storage.objects
    FOR SELECT USING (bucket_id = 'blog');

-- Only allow your specific user ID to upload/manage images
CREATE POLICY "blog_admin_insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'blog' 
        AND auth.uid() = 'f443d194-4b56-48da-9251-6c3f790f0f33'::uuid
    );

CREATE POLICY "blog_admin_update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'blog' 
        AND auth.uid() = 'f443d194-4b56-48da-9251-6c3f790f0f33'::uuid
    );

CREATE POLICY "blog_admin_delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'blog' 
        AND auth.uid() = 'f443d194-4b56-48da-9251-6c3f790f0f33'::uuid
    );

-- Verify the new policies
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
