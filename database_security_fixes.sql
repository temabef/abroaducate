-- ============================================================================
-- DATABASE SECURITY FIXES - Supabase Linter Issues Resolution
-- ============================================================================
-- This script addresses all security issues found in the database linter report
-- Run this in your Supabase SQL Editor

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

-- Migration log - Only accessible by service role and admins
DROP POLICY IF EXISTS "migration_log_admin_access" ON public.migration_log;
CREATE POLICY "migration_log_admin_access" ON public.migration_log
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role' OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND is_admin = true
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
    dv.user_id,
    dv.document_type,
    dv.document_id,
    COUNT(*) as version_count,
    MAX(dv.created_at) as latest_version_date,
    MIN(dv.created_at) as first_version_date
FROM document_versions dv
GROUP BY dv.user_id, dv.document_type, dv.document_id;

-- Add RLS policy for version_usage_summary
DROP POLICY IF EXISTS "version_summary_user_access" ON public.version_usage_summary;
-- Note: Views inherit RLS from underlying tables, but we can add explicit policies if needed

-- Recreate admin_users_view without SECURITY DEFINER (if it's not critical for admin functions)
DROP VIEW IF EXISTS public.admin_users_view;
CREATE VIEW public.admin_users_view AS
SELECT 
    u.id,
    u.email,
    u.created_at,
    up.full_name,
    up.is_admin,
    up.updated_at as profile_updated
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.is_admin = true;

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
-- 6. VALIDATE EXISTING POLICIES ARE WORKING
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
ORDER BY tablename, policyname;

-- ============================================================================
-- 7. CLEANUP AND OPTIMIZATION
-- ============================================================================

-- Remove any duplicate or conflicting policies
-- (This will be handled by the DROP POLICY IF EXISTS statements above)

-- Update table statistics for better query planning
ANALYZE public.academic_email_domains;
ANALYZE public.disposable_email_domains;
ANALYZE public.migration_log;
ANALYZE public.sops_id_mapping;
ANALYZE public.applications_id_mapping;

-- ============================================================================
-- 8. VERIFICATION QUERIES
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

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Database security fixes completed successfully!';
    RAISE NOTICE '📋 Summary of changes:';
    RAISE NOTICE '   - Enabled RLS on 5 tables';
    RAISE NOTICE '   - Created appropriate RLS policies';
    RAISE NOTICE '   - Fixed SECURITY DEFINER views';
    RAISE NOTICE '   - Granted necessary permissions';
    RAISE NOTICE '   - Updated table statistics';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Run the verification queries above to confirm all fixes are working correctly.';
END $$; 