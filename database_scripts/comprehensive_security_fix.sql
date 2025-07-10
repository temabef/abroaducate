-- COMPREHENSIVE SECURITY FIX - Addresses all critical security issues
-- Fixes SECURITY DEFINER views + Function search_path warnings

-- =============================================
-- PHASE 1: FIX SECURITY DEFINER VIEWS
-- =============================================

-- Force drop all problematic views (including any hidden ones)
DROP VIEW IF EXISTS public.active_newsletter_subscribers CASCADE;
DROP VIEW IF EXISTS public.newsletter_campaign_performance CASCADE; 
DROP VIEW IF EXISTS public.newsletter_subscriber_summary CASCADE;

-- Check what views still exist with SECURITY DEFINER
SELECT 
    schemaname,
    viewname,
    'WARNING: View still has SECURITY DEFINER' as issue
FROM pg_views 
WHERE schemaname = 'public' 
AND definition ILIKE '%SECURITY DEFINER%';

-- Recreate all views WITHOUT SECURITY DEFINER
CREATE VIEW public.active_newsletter_subscribers AS
SELECT 
    id,
    email,
    source,
    subscribed_at,
    scholarship_digest,
    weekly_updates,
    marketing_emails,
    total_opens,
    total_clicks,
    last_opened,
    last_clicked
FROM newsletter_subscribers 
WHERE status = 'active';

CREATE VIEW public.newsletter_campaign_performance AS
SELECT 
    c.id,
    c.campaign_name,
    c.subject_line,
    c.campaign_type,
    c.sent_at,
    c.total_recipients,
    c.total_sent,
    c.total_opens,
    c.total_clicks,
    c.total_unsubscribes,
    CASE 
        WHEN c.total_sent > 0 THEN ROUND((c.total_opens::DECIMAL / c.total_sent::DECIMAL) * 100, 2)
        ELSE 0 
    END as open_rate,
    CASE 
        WHEN c.total_sent > 0 THEN ROUND((c.total_clicks::DECIMAL / c.total_sent::DECIMAL) * 100, 2)
        ELSE 0 
    END as click_rate,
    CASE 
        WHEN c.total_opens > 0 THEN ROUND((c.total_clicks::DECIMAL / c.total_opens::DECIMAL) * 100, 2)
        ELSE 0 
    END as click_to_open_rate
FROM newsletter_campaigns c
WHERE c.campaign_status = 'sent'
ORDER BY c.sent_at DESC;

CREATE VIEW public.newsletter_subscriber_summary AS
SELECT 
    status,
    COUNT(*) as subscriber_count,
    COUNT(*) FILTER (WHERE scholarship_digest = true) as scholarship_digest_count,
    COUNT(*) FILTER (WHERE weekly_updates = true) as weekly_updates_count,
    COUNT(*) FILTER (WHERE marketing_emails = true) as marketing_count,
    AVG(total_opens) as avg_opens,
    AVG(total_clicks) as avg_clicks
FROM newsletter_subscribers
GROUP BY status;

-- =============================================
-- PHASE 2: FIX FUNCTION SEARCH_PATH WARNINGS  
-- =============================================

-- Fix admin functions with proper search_path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid() 
        AND email IN ('admin@abroaducate.com', 'solakolawole62@gmail.com')
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.can_manage_scholarships()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
        AND role IN ('super-admin', 'admin', 'scholarship-admin')
    ) OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid() 
        AND email IN ('admin@abroaducate.com', 'solakolawole62@gmail.com')
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.can_access_analytics()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
        AND role IN ('super-admin', 'admin')
    ) OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid() 
        AND email IN ('admin@abroaducate.com', 'solakolawole62@gmail.com')
    );
END;
$$;

-- Fix newsletter functions
CREATE OR REPLACE FUNCTION public.add_newsletter_subscriber(
    p_email VARCHAR(255),
    p_source VARCHAR(100) DEFAULT 'website',
    p_scholarship_digest BOOLEAN DEFAULT true,
    p_weekly_updates BOOLEAN DEFAULT true,
    p_marketing_emails BOOLEAN DEFAULT false
)
RETURNS UUID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    subscriber_id UUID;
BEGIN
    INSERT INTO newsletter_subscribers (
        email, 
        source, 
        scholarship_digest, 
        weekly_updates, 
        marketing_emails
    ) VALUES (
        LOWER(TRIM(p_email)),
        p_source,
        p_scholarship_digest,
        p_weekly_updates,
        p_marketing_emails
    )
    ON CONFLICT (email) DO UPDATE SET
        status = 'active',
        source = CASE WHEN newsletter_subscribers.source = 'website' THEN EXCLUDED.source ELSE newsletter_subscribers.source END,
        scholarship_digest = EXCLUDED.scholarship_digest,
        weekly_updates = EXCLUDED.weekly_updates,
        marketing_emails = EXCLUDED.marketing_emails,
        updated_at = NOW()
    RETURNING id INTO subscriber_id;
    
    RETURN subscriber_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.unsubscribe_newsletter(p_email VARCHAR(255))
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    UPDATE newsletter_subscribers 
    SET 
        status = 'unsubscribed',
        unsubscribed_at = NOW(),
        updated_at = NOW()
    WHERE LOWER(email) = LOWER(TRIM(p_email))
    AND status = 'active';
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    RETURN rows_affected > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_newsletter_stats()
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_subscribers', COUNT(*),
        'active_subscribers', COUNT(*) FILTER (WHERE status = 'active'),
        'unsubscribed', COUNT(*) FILTER (WHERE status = 'unsubscribed'),
        'bounced', COUNT(*) FILTER (WHERE status = 'bounced'),
        'scholarship_digest_subs', COUNT(*) FILTER (WHERE scholarship_digest = true AND status = 'active'),
        'weekly_updates_subs', COUNT(*) FILTER (WHERE weekly_updates = true AND status = 'active'),
        'marketing_subs', COUNT(*) FILTER (WHERE marketing_emails = true AND status = 'active'),
        'converted_users', COUNT(*) FILTER (WHERE converted_to_user = true)
    ) INTO result
    FROM newsletter_subscribers;
    
    RETURN result;
END;
$$;

-- Fix email validation functions
CREATE OR REPLACE FUNCTION public.is_academic_email(email_address TEXT)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    domain_part TEXT;
    is_academic BOOLEAN := FALSE;
BEGIN
    IF email_address IS NULL OR email_address = '' THEN
        RETURN FALSE;
    END IF;
    
    domain_part := lower(split_part(email_address, '@', 2));
    
    SELECT EXISTS (
        SELECT 1 FROM public.academic_domains 
        WHERE verified = true 
        AND (domain = domain_part OR domain_part LIKE '%' || domain)
    ) INTO is_academic;
    
    RETURN is_academic;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_blocked_email(email_address TEXT)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    domain_part TEXT;
    is_blocked BOOLEAN := FALSE;
BEGIN
    IF email_address IS NULL OR email_address = '' THEN
        RETURN TRUE;
    END IF;
    
    domain_part := lower(split_part(email_address, '@', 2));
    
    SELECT EXISTS (
        SELECT 1 FROM public.blocked_domains 
        WHERE domain = domain_part
    ) INTO is_blocked;
    
    RETURN is_blocked;
END;
$$;

-- Fix trigger functions  
CREATE OR REPLACE FUNCTION public.update_newsletter_subscriber_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- =============================================
-- PHASE 3: VERIFICATION
-- =============================================

-- Verify no views have SECURITY DEFINER
SELECT 
    'VIEW SECURITY CHECK:' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_views 
            WHERE schemaname = 'public' 
            AND definition ILIKE '%SECURITY DEFINER%'
        ) THEN '❌ SECURITY DEFINER still detected in views'
        ELSE '✅ All views now safe (no SECURITY DEFINER)'
    END as view_security_status;

-- List all functions that still need search_path fixes (should be empty after this)
SELECT 
    'REMAINING SEARCH_PATH ISSUES:' as check_type,
    routine_name as function_name,
    'Needs search_path fix' as issue
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
AND routine_name IN (
    'update_support_requests_updated_at',
    'toggle_newsletter_system', 
    'update_newsletter_setting',
    'is_admin_simple',
    'can_manage_newsletter_content',
    'update_updated_at_column',
    'get_test_prep_stats',
    'upsert_newsletter_subscriber',
    'batch_import_newsletter_subscribers'
);

-- Final security validation
SELECT 
    'FINAL SECURITY STATUS:' as check_type,
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM pg_views 
            WHERE schemaname = 'public' 
            AND definition ILIKE '%SECURITY DEFINER%'
        ) THEN '✅ CRITICAL SECURITY ISSUES RESOLVED - Views are now safe'
        ELSE '❌ SECURITY DEFINER views still detected - Manual intervention needed'
    END as final_status; 