-- Step by step storage policy debugging and fixing
-- Let's be very systematic about this

-- STEP 1: Check what storage policies actually exist right now
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- STEP 2: Check if the blog bucket exists and is properly configured
SELECT 
    name,
    id,
    public
FROM storage.buckets 
WHERE name = 'blog';

-- STEP 3: Remove ALL storage policies for objects table (clean slate)
DO $$ 
DECLARE 
    policy_name TEXT;
BEGIN
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_name);
    END LOOP;
END $$;

-- STEP 4: Verify all policies are gone
SELECT 
    policyname
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- STEP 5: Create the most permissive policies possible for testing
-- These will allow ANY authenticated user to do anything with blog bucket
CREATE POLICY "blog_select_public" ON storage.objects
    FOR SELECT USING (bucket_id = 'blog');

CREATE POLICY "blog_insert_auth" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'blog' AND auth.role() = 'authenticated');

CREATE POLICY "blog_update_auth" ON storage.objects
    FOR UPDATE USING (bucket_id = 'blog' AND auth.role() = 'authenticated');

CREATE POLICY "blog_delete_auth" ON storage.objects
    FOR DELETE USING (bucket_id = 'blog' AND auth.role() = 'authenticated');

-- STEP 6: Verify the new policies exist
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
