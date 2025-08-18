-- Complete diagnostic of storage RLS situation
-- Run this to understand what's happening with storage policies

-- 1. Check if blog bucket exists and its settings
SELECT 
    name,
    id,
    public,
    created_at
FROM storage.buckets 
WHERE name = 'blog';

-- 2. List ALL storage policies (not just for blog bucket)
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
WHERE schemaname = 'storage' 
ORDER BY tablename, policyname;

-- 3. Check if RLS is enabled on storage.objects
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 4. Check what your user context looks like in the app
-- (This won't work in SQL editor but will help us understand the issue)
SELECT 
    auth.uid() as user_id,
    auth.email() as user_email,
    auth.role() as user_role,
    current_user as db_user;

-- 5. Try to understand the storage.objects table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'storage' AND table_name = 'objects'
ORDER BY ordinal_position;
