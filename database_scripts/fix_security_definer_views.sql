-- Fix Security Definer Views - Critical Security Issue
-- This removes SECURITY DEFINER property from newsletter views

-- Drop the problematic views completely
DROP VIEW IF EXISTS public.active_newsletter_subscribers;
DROP VIEW IF EXISTS public.newsletter_campaign_performance;
DROP VIEW IF EXISTS public.newsletter_subscriber_summary;

-- Recreate views WITHOUT SECURITY DEFINER (safer)
-- Active newsletter subscribers view (NO SECURITY DEFINER)
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

-- Newsletter campaign performance view (NO SECURITY DEFINER)
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

-- Newsletter subscriber summary view (if this exists somewhere)
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

-- Grant proper permissions on views (respects RLS)
GRANT SELECT ON public.active_newsletter_subscribers TO authenticated;
GRANT SELECT ON public.newsletter_campaign_performance TO authenticated; 
GRANT SELECT ON public.newsletter_subscriber_summary TO authenticated;

-- Verify the fix worked
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('active_newsletter_subscribers', 'newsletter_campaign_performance', 'newsletter_subscriber_summary');

-- Security validation - confirm no SECURITY DEFINER
SELECT 
    'SECURITY FIX VALIDATION:' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_views 
            WHERE schemaname = 'public' 
            AND viewname IN ('active_newsletter_subscribers', 'newsletter_campaign_performance', 'newsletter_subscriber_summary')
            AND definition ILIKE '%SECURITY DEFINER%'
        ) THEN '❌ SECURITY DEFINER still detected in views'
        ELSE '✅ All newsletter views now safe (no SECURITY DEFINER)'
    END as security_status; 