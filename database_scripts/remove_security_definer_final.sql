-- Simple fix: Remove SECURITY DEFINER from the last 2 views
-- These are the exact commands needed to fix the remaining linter errors

-- 1. Fix version_usage_summary view
DROP VIEW IF EXISTS public.version_usage_summary CASCADE;

CREATE VIEW public.version_usage_summary AS
SELECT 
    user_id,
    feature_type,
    COUNT(*) as usage_count,
    MAX(created_at) as last_used,
    MIN(created_at) as first_used,
    DATE(created_at) as usage_date,
    EXTRACT(month FROM created_at) as usage_month,
    EXTRACT(year FROM created_at) as usage_year
FROM public.feature_usage_log
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id, feature_type, DATE(created_at), EXTRACT(month FROM created_at), EXTRACT(year FROM created_at);

-- Grant permissions
GRANT SELECT ON public.version_usage_summary TO authenticated;

-- 2. Fix admin_users_view
DROP VIEW IF EXISTS public.admin_users_view CASCADE;

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

-- Grant permissions (authenticated only, no anon)
GRANT SELECT ON public.admin_users_view TO authenticated; 