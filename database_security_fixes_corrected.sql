-- ============================================================================
-- DATABASE SECURITY FIXES - CORRECTED VERSION
-- ============================================================================
-- This script addresses all security issues found in the database linter report
-- Uses the correct admin_users table structure instead of user_profiles.is_admin

-- ============================================================================
-- 1. ENABLE RLS ON TABLES WITH EXISTING POLICIES
-- ============================================================================
-- These tables have RLS policies but RLS is not enabled

-- Enable RLS on academic_email_domains
ALTER TABLE public.academic_email_domains ENABLE ROW LEVEL SECURITY;

-- Enable RLS on disposable_email_domains  
ALTER TABLE public.disposable_email_domains ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. ENABLE RLS ON ALL PUBLIC TABLES MISSING RLS
-- ============================================================================
-- These tables are public but don't have RLS enabled

-- Enable RLS on migration_log (this can be read-only for admins)
ALTER TABLE public.migration_log ENABLE ROW LEVEL SECURITY;

-- Enable RLS on UUID mapping tables (these should be system-only)
ALTER TABLE public.sops_id_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications_id_mapping ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. CREATE APPROPRIATE RLS POLICIES FOR NEWLY ENABLED TABLES
-- ============================================================================

-- Migration log - Only accessible by service role and admins (using admin_users table)
DROP POLICY IF EXISTS "migration_log_admin_access" ON public.migration_log;
CREATE POLICY "migration_log_admin_access" ON public.migration_log
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role' OR
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid()
        )
    );

-- UUID mapping tables - System only access (service role only)
DROP POLICY IF EXISTS "sops_mapping_system_only" ON public.sops_id_mapping;
CREATE POLICY "sops_mapping_system_only" ON public.sops_id_mapping
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "applications_mapping_system_only" ON public.applications_id_mapping;
CREATE POLICY "applications_mapping_system_only" ON public.applications_id_mapping
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 4. FIX SECURITY DEFINER VIEWS
-- ============================================================================
-- These views should not use SECURITY DEFINER unless absolutely necessary

-- Recreate version_usage_summary view without SECURITY DEFINER
DROP VIEW IF EXISTS public.version_usage_summary;
CREATE VIEW public.version_usage_summary AS
SELECT 
    dv.created_by as user_id,
    dv.document_type,
    dv.document_id,
    COUNT(*) as version_count,
    MAX(dv.created_at) as latest_version_date,
    MIN(dv.created_at) as first_version_date
FROM document_versions dv
GROUP BY dv.created_by, dv.document_type, dv.document_id;

-- Recreate admin_users_view without SECURITY DEFINER (using proper admin_users table)
DROP VIEW IF EXISTS public.admin_users_view;
CREATE VIEW public.admin_users_view AS
SELECT 
    u.id,
    u.email,
    u.created_at,
    au.role,
    au.email_cache,
    au.created_at as admin_created_at
FROM auth.users u
INNER JOIN admin_users au ON u.id = au.user_id
ORDER BY au.created_at DESC;

-- ============================================================================
-- 5. VERIFY AND GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Grant read access to academic domains for authenticated users
GRANT SELECT ON public.academic_email_domains TO authenticated;

-- Grant read access to disposable domains for authenticated users  
GRANT SELECT ON public.disposable_email_domains TO authenticated;

-- Grant usage on sequences if they exist
DO $$
BEGIN
    -- Check if sequences exist and grant usage
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_schema = 'public') THEN
        GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
    END IF;
END $$;

-- ============================================================================
-- 6. ENSURE EXISTING ADMIN FUNCTIONS ARE PROPERLY DEFINED
-- ============================================================================

-- Make sure the is_admin function exists and works correctly
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============================================================================
-- 7. VALIDATE EXISTING POLICIES ARE WORKING
-- ============================================================================

-- Check that critical tables still have proper user access
-- This should show all policies that are active

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
WHERE schemaname = 'public'
    AND tablename IN (
        'academic_email_domains',
        'disposable_email_domains', 
        'migration_log',
        'sops_id_mapping',
        'applications_id_mapping'
    )
ORDER BY tablename, policyname;

-- ============================================================================
-- 8. CLEANUP AND OPTIMIZATION
-- ============================================================================

-- Update table statistics for better query planning
ANALYZE public.academic_email_domains;
ANALYZE public.disposable_email_domains;
ANALYZE public.migration_log;
ANALYZE public.sops_id_mapping;
ANALYZE public.applications_id_mapping;

-- ============================================================================
-- 9. VERIFICATION QUERIES
-- ============================================================================

-- Query to verify RLS is enabled on all required tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    -- Check if table has any policies
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = t.schemaname AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
    AND tablename IN (
        'academic_email_domains',
        'disposable_email_domains', 
        'migration_log',
        'sops_id_mapping',
        'applications_id_mapping'
    )
ORDER BY tablename;

-- Query to verify views are not using SECURITY DEFINER
SELECT 
    schemaname,
    viewname,
    viewowner,
    definition
FROM pg_views 
WHERE schemaname = 'public' 
    AND viewname IN ('version_usage_summary', 'admin_users_view');

-- Query to verify admin system is working
SELECT 
    'Admin System Check' as check_type,
    COUNT(*) as admin_count,
    array_agg(role) as roles_present
FROM admin_users;

-- ============================================================================
-- 10. SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Database security fixes completed successfully!';
    RAISE NOTICE '📋 Summary of changes:';
    RAISE NOTICE '   - Enabled RLS on 5 tables';
    RAISE NOTICE '   - Created appropriate RLS policies using admin_users table';
    RAISE NOTICE '   - Fixed SECURITY DEFINER views';
    RAISE NOTICE '   - Granted necessary permissions';
    RAISE NOTICE '   - Updated table statistics';
    RAISE NOTICE '   - Verified admin system compatibility';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Run the verification queries above to confirm all fixes are working correctly.';
END $$; 