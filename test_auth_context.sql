-- Test the authentication context that the frontend will use
-- This should help us understand if there are any remaining auth issues

-- Check if the blog bucket exists and is properly configured
SELECT 
    name,
    id,
    public,
    created_at
FROM storage.buckets 
WHERE name = 'blog';

-- Test what an authenticated user context would look like
-- (This will show null in SQL editor, but should work in the app)
SELECT 
    auth.role() as user_role,
    auth.uid() as user_id,
    auth.email() as user_email;

-- Test if our storage policies would allow an authenticated user
-- Simulate the INSERT check for blog bucket
SELECT 
    ('blog'::text = 'blog'::text) as bucket_matches,
    (auth.role() = 'authenticated'::text) as is_authenticated,
    (('blog'::text = 'blog'::text) AND (auth.role() = 'authenticated'::text)) as insert_policy_result;

-- Check if there are any other storage policies that might conflict
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
ORDER BY tablename, policyname;
