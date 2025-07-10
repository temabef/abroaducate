-- Final Security Cleanup V2 - Remove SECURITY DEFINER from remaining views
-- This addresses the last 2 linter errors

-- Drop and recreate version_usage_summary view without SECURITY DEFINER
DROP VIEW IF EXISTS public.version_usage_summary;

CREATE VIEW public.version_usage_summary AS
SELECT 
    user_id,
    feature_type,
    COUNT(*) as usage_count,
    MAX(created_at) as last_used,
    MIN(created_at) as first_used
FROM public.feature_usage_log
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id, feature_type;

-- Grant appropriate permissions
GRANT SELECT ON public.version_usage_summary TO authenticated;

-- Drop and recreate admin_users_view without SECURITY DEFINER
DROP VIEW IF EXISTS public.admin_users_view;

CREATE VIEW public.admin_users_view AS
SELECT 
    au.id,
    au.email,
    au.role,
    au.created_at,
    au.is_active,
    ec.email as user_email,
    ec.full_name
FROM public.admin_users au
LEFT JOIN public.email_cache ec ON au.email = ec.email
WHERE au.is_active = true;

-- Grant appropriate permissions (authenticated users only, no anon access)
GRANT SELECT ON public.admin_users_view TO authenticated;

-- Verify no SECURITY DEFINER remains
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public' 
AND (viewname = 'version_usage_summary' OR viewname = 'admin_users_view'); 