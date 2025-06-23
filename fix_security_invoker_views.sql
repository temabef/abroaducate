-- Fix SECURITY DEFINER views by setting security_invoker = true
-- This resolves the remaining security linter errors

-- Check if views exist and alter them
DO $$
BEGIN
    -- 1. Fix version_usage_summary view
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'version_usage_summary' AND table_schema = 'public') THEN
        ALTER VIEW public.version_usage_summary SET (security_invoker = true);
        RAISE NOTICE '✅ Fixed version_usage_summary view security';
    ELSE
        RAISE NOTICE '⚠️ version_usage_summary view does not exist';
    END IF;
    
    -- 2. Fix admin_users_view
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'admin_users_view' AND table_schema = 'public') THEN
        ALTER VIEW public.admin_users_view SET (security_invoker = true);
        RAISE NOTICE '✅ Fixed admin_users_view security';
    ELSE
        RAISE NOTICE '⚠️ admin_users_view does not exist';
    END IF;
END $$;

-- Verify the views now have security_invoker = true
SELECT 
    schemaname,
    viewname,
    CASE 
        WHEN definition LIKE '%security_invoker%' THEN 'security_invoker = true'
        WHEN definition LIKE '%SECURITY DEFINER%' THEN 'SECURITY DEFINER (BAD)'
        ELSE 'default (should be secure now)'
    END as security_setting
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('version_usage_summary', 'admin_users_view'); 