-- =============================================
-- Fix Supabase Security Linter Issues
-- =============================================
-- This fixes 3 specific security issues:
-- 1. security_definer_view: active_newsletter_subscribers
-- 2. security_definer_view: newsletter_campaign_performance  
-- 3. rls_disabled_in_public: simple_checklist_progress

-- =============================================
-- Issue 1 & 2: Fix SECURITY DEFINER Views
-- =============================================

-- Drop and recreate active_newsletter_subscribers view without SECURITY DEFINER
DROP VIEW IF EXISTS active_newsletter_subscribers;

CREATE VIEW active_newsletter_subscribers WITH (security_invoker = true) AS
SELECT 
    source,
    COUNT(*) as total_subscribers,
    COUNT(*) FILTER (WHERE scholarship_digest = true) as digest_subscribers,
    COUNT(*) FILTER (WHERE last_email_sent > NOW() - INTERVAL '30 days') as recent_recipients,
    COUNT(*) FILTER (WHERE converted_to_user = true) as converted_users,
    AVG(total_opens) as avg_opens,
    AVG(total_clicks) as avg_clicks
FROM newsletter_subscribers
WHERE status = 'active'
GROUP BY source
ORDER BY total_subscribers DESC;

-- Drop and recreate newsletter_campaign_performance view without SECURITY DEFINER
DROP VIEW IF EXISTS newsletter_campaign_performance;

CREATE VIEW newsletter_campaign_performance WITH (security_invoker = true) AS
SELECT 
    c.id,
    c.campaign_name,
    c.campaign_type,
    c.subject_line,
    c.sent_at,
    c.total_recipients,
    c.total_sent,
    c.total_opens,
    c.total_clicks,
    CASE 
        WHEN c.total_sent > 0 THEN (c.total_opens::float / c.total_sent * 100)
        ELSE 0
    END as open_rate_percent,
    CASE 
        WHEN c.total_sent > 0 THEN (c.total_clicks::float / c.total_sent * 100)
        ELSE 0
    END as click_rate_percent
FROM newsletter_campaigns c
WHERE c.campaign_status = 'sent'
ORDER BY c.sent_at DESC;

-- Grant appropriate permissions to the views
GRANT SELECT ON active_newsletter_subscribers TO authenticated;
GRANT SELECT ON active_newsletter_subscribers TO service_role;

GRANT SELECT ON newsletter_campaign_performance TO authenticated;
GRANT SELECT ON newsletter_campaign_performance TO service_role;

-- =============================================
-- Issue 3: Enable RLS on simple_checklist_progress
-- =============================================

-- Enable RLS on the simple_checklist_progress table
ALTER TABLE simple_checklist_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can only access their own checklist progress
CREATE POLICY "Users can manage their own checklist progress" 
ON simple_checklist_progress 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create RLS policy: Admin users can access all checklist progress
-- COMMENTED OUT: This policy references user_subscriptions which causes permission errors
-- CREATE POLICY "Admin can view all checklist progress" 
-- ON simple_checklist_progress 
-- FOR SELECT 
-- USING (
--     EXISTS (
--         SELECT 1 FROM user_subscriptions us 
--         WHERE us.user_id = auth.uid() 
--         AND us.plan_type = 'admin'
--     )
-- );

-- =============================================
-- Verification and Comments
-- =============================================

-- Add table comments for clarity
COMMENT ON VIEW active_newsletter_subscribers IS 'Newsletter subscriber statistics (security_invoker)';
COMMENT ON VIEW newsletter_campaign_performance IS 'Newsletter campaign performance metrics (security_invoker)';
COMMENT ON TABLE simple_checklist_progress IS 'Document checklist progress with RLS enabled';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Supabase security issues fixed:';
    RAISE NOTICE '  - Removed SECURITY DEFINER from newsletter views';
    RAISE NOTICE '  - Enabled RLS on simple_checklist_progress table';
    RAISE NOTICE '  - Added appropriate RLS policies';
    RAISE NOTICE '📊 All three linter errors should now be resolved!';
END $$; 