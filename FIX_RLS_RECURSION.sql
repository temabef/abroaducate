-- Fix RLS Policy Recursion Issue
-- This resolves the "infinite recursion detected in policy for relation 'admin_users'" error

-- ==================================================
-- STEP 1: Fix Admin Users Table Policies
-- ==================================================

-- Drop problematic admin_users policies that might cause recursion
DROP POLICY IF EXISTS "Admin can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admin can manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Admin users can view themselves" ON admin_users;

-- Create simple, non-recursive admin policies
CREATE POLICY "Enable read for admin users" ON admin_users 
FOR SELECT USING (
  auth.uid() = user_id OR 
  auth.email() = 'admin@abroaducate.com' OR 
  auth.email() = 'solakolawole62@gmail.com'
);

CREATE POLICY "Enable admin management" ON admin_users 
FOR ALL USING (
  auth.email() = 'admin@abroaducate.com' OR 
  auth.email() = 'solakolawole62@gmail.com'
);

-- ==================================================
-- STEP 2: Simplify Practice Tables Policies
-- ==================================================

-- Drop all existing policies on practice tables
DROP POLICY IF EXISTS "Enable read access for all users" ON practice_tests;
DROP POLICY IF EXISTS "Admin can manage practice tests" ON practice_tests;
DROP POLICY IF EXISTS "Enable read access for all users" ON practice_sets;
DROP POLICY IF EXISTS "Admin can manage practice sets" ON practice_sets;
DROP POLICY IF EXISTS "Enable read access for all users" ON practice_questions;
DROP POLICY IF EXISTS "Admin can manage practice questions" ON practice_questions;
DROP POLICY IF EXISTS "Enable read access for all users" ON practice_choices;
DROP POLICY IF EXISTS "Admin can manage practice choices" ON practice_choices;

-- Create simple read-only policies for practice tables (no admin dependency)
CREATE POLICY "Public read access" ON practice_tests FOR SELECT USING (true);
CREATE POLICY "Public read access" ON practice_sets FOR SELECT USING (true);  
CREATE POLICY "Public read access" ON practice_questions FOR SELECT USING (true);
CREATE POLICY "Public read access" ON practice_choices FOR SELECT USING (true);

-- Create separate admin policies that don't reference other tables
CREATE POLICY "Admin write access" ON practice_tests 
FOR ALL USING (
  auth.email() = 'admin@abroaducate.com' OR 
  auth.email() = 'solakolawole62@gmail.com'
);

CREATE POLICY "Admin write access" ON practice_sets 
FOR ALL USING (
  auth.email() = 'admin@abroaducate.com' OR 
  auth.email() = 'solakolawole62@gmail.com'
);

CREATE POLICY "Admin write access" ON practice_questions 
FOR ALL USING (
  auth.email() = 'admin@abroaducate.com' OR 
  auth.email() = 'solakolawole62@gmail.com'
);

CREATE POLICY "Admin write access" ON practice_choices 
FOR ALL USING (
  auth.email() = 'admin@abroaducate.com' OR 
  auth.email() = 'solakolawole62@gmail.com'
);

-- ==================================================
-- STEP 3: Update Admin Helper Function (Non-Recursive)
-- ==================================================

-- Create a simplified admin check function that doesn't cause recursion
CREATE OR REPLACE FUNCTION public.is_admin_simple()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@abroaducate.com' OR
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'solakolawole62@gmail.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- STEP 4: Grant Necessary Permissions
-- ==================================================

-- Ensure anonymous and authenticated users can read practice data
GRANT SELECT ON practice_tests TO anon, authenticated;
GRANT SELECT ON practice_sets TO anon, authenticated;
GRANT SELECT ON practice_questions TO anon, authenticated;
GRANT SELECT ON practice_choices TO anon, authenticated;

-- ==================================================
-- STEP 5: Test the Fix
-- ==================================================

-- Test query (this should work without recursion error)
SELECT 'TEST QUERY' as status, id, slug, name FROM practice_tests WHERE slug = 'ielts';

-- Verify practice data is accessible
SELECT 
    'ACCESSIBILITY TEST' as status,
    pt.slug,
    COUNT(DISTINCT ps.id) as sets,
    COUNT(DISTINCT pq.id) as questions,
    COUNT(pc.id) as choices
FROM practice_tests pt
LEFT JOIN practice_sets ps ON pt.id = ps.test_id
LEFT JOIN practice_questions pq ON ps.id = pq.set_id
LEFT JOIN practice_choices pc ON pq.id = pc.question_id
WHERE pt.slug = 'ielts'
GROUP BY pt.slug;

-- Final status messages
DO $$
BEGIN
    RAISE NOTICE '🎯 RLS RECURSION FIX COMPLETE';
    RAISE NOTICE 'Practice tables now have simple public read access';
    RAISE NOTICE 'Admin functions simplified to prevent recursion';
    RAISE NOTICE 'Test the IELTS practice page again!';
END $$; 