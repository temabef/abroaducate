-- Simple fix: Remove SECURITY DEFINER from the last 2 views
-- Using only existing tables and columns

-- 1. Fix version_usage_summary view (simplified version)
DROP VIEW IF EXISTS public.version_usage_summary CASCADE;

CREATE VIEW public.version_usage_summary AS
SELECT 
  uu.user_id,
  COALESCE(us.plan_type, 'free') as plan_type,
  COUNT(CASE WHEN dv.id IS NOT NULL THEN 1 END) as total_versions,
  COUNT(DISTINCT dv.document_id) as unique_documents,
  COUNT(DISTINCT dv.document_type) as document_types_used,
  MAX(dv.created_at) as last_version_created
FROM user_usage uu
LEFT JOIN user_subscriptions us ON uu.user_id = us.user_id AND us.status = 'active'
LEFT JOIN document_versions dv ON dv.created_by = uu.user_id
GROUP BY uu.user_id, us.plan_type;

-- Grant permissions
GRANT SELECT ON public.version_usage_summary TO authenticated;

-- 2. Fix admin_users_view (using email_cache column)
DROP VIEW IF EXISTS public.admin_users_view CASCADE;

CREATE VIEW public.admin_users_view AS
SELECT 
    au.user_id as id,
    au.email_cache as email,
    au.role,
    au.created_at,
    true as is_active,
    au.email_cache as user_email,
    au.email_cache as full_name
FROM public.admin_users au
WHERE au.user_id IS NOT NULL;

-- Grant permissions (authenticated only, no anon)
GRANT SELECT ON public.admin_users_view TO authenticated; 