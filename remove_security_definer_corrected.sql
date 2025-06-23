-- Fixed: Remove SECURITY DEFINER from the last 2 views
-- Using correct table names and structure

-- 1. Fix version_usage_summary view (using correct table structure)
DROP VIEW IF EXISTS public.version_usage_summary CASCADE;

CREATE VIEW public.version_usage_summary AS
SELECT 
  u.user_id,
  COALESCE(us.plan_type, 'free') as plan_type,
  ec.email,
  COUNT(dv.id) as total_versions,
  COUNT(DISTINCT dv.document_id) as unique_documents,
  COUNT(DISTINCT dv.document_type) as document_types_used,
  MAX(dv.created_at) as last_version_created,
  AVG(dv.word_count) as avg_word_count
FROM user_usage u
LEFT JOIN user_subscriptions us ON u.user_id = us.user_id AND us.status = 'active'
LEFT JOIN email_cache ec ON u.user_id = ec.user_id
LEFT JOIN document_versions dv ON dv.created_by = u.user_id
GROUP BY u.user_id, us.plan_type, ec.email;

-- Grant permissions
GRANT SELECT ON public.version_usage_summary TO authenticated;

-- 2. Fix admin_users_view (keep existing structure)
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