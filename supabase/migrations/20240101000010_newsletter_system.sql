-- =============================================
-- Newsletter & Mailing List System
-- =============================================

-- 1. Newsletter Subscribers Table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    source VARCHAR(100) NOT NULL, -- 'ebook_productivity', 'ebook_academic', 'marketing', 'website', etc.
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    last_email_sent TIMESTAMPTZ,
    total_emails_sent INTEGER DEFAULT 0,
    
    -- Email preferences
    scholarship_digest BOOLEAN DEFAULT true,
    weekly_updates BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced', 'invalid')),
    unsubscribed_at TIMESTAMPTZ,
    bounce_count INTEGER DEFAULT 0,
    
    -- Engagement tracking
    last_opened TIMESTAMPTZ,
    last_clicked TIMESTAMPTZ,
    total_opens INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    
    -- Conversion tracking
    converted_to_user BOOLEAN DEFAULT false,
    converted_at TIMESTAMPTZ,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Newsletter Settings Table
CREATE TABLE IF NOT EXISTS newsletter_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Newsletter Campaigns Table
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_name VARCHAR(255) NOT NULL,
    subject_line VARCHAR(500) NOT NULL,
    campaign_type VARCHAR(50) NOT NULL CHECK (campaign_type IN ('scholarship_digest', 'announcement', 'marketing', 'onboarding')),
    
    -- Content
    html_content TEXT,
    text_content TEXT,
    
    -- Targeting
    target_sources TEXT[], -- Which subscriber sources to include
    target_status VARCHAR(20) DEFAULT 'active',
    
    -- Scheduling
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    
    -- Results
    total_recipients INTEGER DEFAULT 0,
    total_sent INTEGER DEFAULT 0,
    total_failed INTEGER DEFAULT 0,
    total_opens INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    total_unsubscribes INTEGER DEFAULT 0,
    
    -- Status
    campaign_status VARCHAR(20) DEFAULT 'draft' CHECK (campaign_status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Newsletter Email Logs (Enhanced)
CREATE TABLE IF NOT EXISTS newsletter_email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscriber_id UUID REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES newsletter_campaigns(id) ON DELETE CASCADE,
    
    email_address VARCHAR(255) NOT NULL,
    subject_line VARCHAR(500),
    email_type VARCHAR(50) NOT NULL,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced', 'opened', 'clicked')),
    sendgrid_message_id VARCHAR(255),
    error_message TEXT,
    
    -- Engagement
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    unsubscribed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES for Performance
-- =============================================

-- Newsletter subscribers indexes
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_source ON newsletter_subscribers(source);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_digest ON newsletter_subscribers(scholarship_digest);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_last_sent ON newsletter_subscribers(last_email_sent);

-- Newsletter campaigns indexes
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_type ON newsletter_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_status ON newsletter_campaigns(campaign_status);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_scheduled ON newsletter_campaigns(scheduled_for);

-- Newsletter email logs indexes
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_subscriber ON newsletter_email_logs(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_campaign ON newsletter_email_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_status ON newsletter_email_logs(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_sent_at ON newsletter_email_logs(sent_at);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Newsletter subscribers policies
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage all newsletter subscribers" ON newsletter_subscribers FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_subscriptions us 
        WHERE us.user_id = auth.uid() 
        AND us.plan_type = 'admin'
    )
);

-- Newsletter settings policies
ALTER TABLE newsletter_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage newsletter settings" ON newsletter_settings FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_subscriptions us 
        WHERE us.user_id = auth.uid() 
        AND us.plan_type = 'admin'
    )
);

-- Newsletter campaigns policies
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage newsletter campaigns" ON newsletter_campaigns FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_subscriptions us 
        WHERE us.user_id = auth.uid() 
        AND us.plan_type = 'admin'
    )
);

-- Newsletter email logs policies
ALTER TABLE newsletter_email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can view newsletter email logs" ON newsletter_email_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_subscriptions us 
        WHERE us.user_id = auth.uid() 
        AND us.plan_type = 'admin'
    )
);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function: Update newsletter subscriber updated_at
CREATE OR REPLACE FUNCTION update_newsletter_subscriber_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for newsletter subscribers
CREATE TRIGGER trigger_newsletter_subscribers_updated_at
    BEFORE UPDATE ON newsletter_subscribers
    FOR EACH ROW
    EXECUTE FUNCTION update_newsletter_subscriber_updated_at();

-- Function: Get newsletter statistics
CREATE OR REPLACE FUNCTION get_newsletter_stats()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_subscribers', COUNT(*),
        'active_subscribers', COUNT(*) FILTER (WHERE status = 'active'),
        'total_by_source', jsonb_object_agg(source, source_count),
        'engagement_stats', jsonb_build_object(
            'avg_open_rate', COALESCE(AVG(CASE WHEN total_emails_sent > 0 THEN total_opens::float / total_emails_sent ELSE 0 END), 0),
            'avg_click_rate', COALESCE(AVG(CASE WHEN total_emails_sent > 0 THEN total_clicks::float / total_emails_sent ELSE 0 END), 0),
            'conversion_rate', COALESCE(COUNT(*) FILTER (WHERE converted_to_user = true)::float / COUNT(*), 0)
        )
    )
    INTO result
    FROM (
        SELECT 
            source,
            COUNT(*) as source_count,
            total_opens,
            total_clicks,
            total_emails_sent,
            converted_to_user
        FROM newsletter_subscribers
        GROUP BY source, total_opens, total_clicks, total_emails_sent, converted_to_user
    ) t;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- INITIAL SETTINGS DATA
-- =============================================

-- Insert default newsletter settings
INSERT INTO newsletter_settings (setting_key, setting_value, description) VALUES
('newsletter_enabled', 'false', 'Master switch for newsletter system'),
('scholarship_digest_enabled', 'false', 'Enable weekly scholarship digest for newsletter subscribers'),
('send_frequency', '"weekly"', 'How often to send newsletter (daily, weekly, monthly)'),
('send_day', '1', 'Day of week to send (0=Sunday, 1=Monday, etc.)'),
('send_time', '"09:00"', 'Time to send newsletter (UTC)'),
('max_emails_per_batch', '100', 'Maximum emails to send per batch'),
('default_from_name', '"Abroaducate Team"', 'Default sender name'),
('unsubscribe_url', '"https://abroaducate.com/unsubscribe"', 'URL for unsubscribe page'),
('launch_date', 'null', 'When newsletter was first launched'),
('last_digest_sent', 'null', 'Last time scholarship digest was sent')
ON CONFLICT (setting_key) DO NOTHING;

-- =============================================
-- VIEWS for Easy Querying
-- =============================================

-- View: Active newsletter subscribers summary
CREATE OR REPLACE VIEW active_newsletter_subscribers AS
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

-- View: Newsletter campaign performance
CREATE OR REPLACE VIEW newsletter_campaign_performance AS
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

-- =============================================
-- COMPLETED
-- =============================================

COMMENT ON TABLE newsletter_subscribers IS 'External mailing list subscribers (non-users)';
COMMENT ON TABLE newsletter_settings IS 'Newsletter system configuration';
COMMENT ON TABLE newsletter_campaigns IS 'Newsletter campaign management';
COMMENT ON TABLE newsletter_email_logs IS 'Detailed email sending logs for newsletter';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Newsletter & Mailing List System migration completed successfully!';
    RAISE NOTICE 'Ready to import 6,000+ email subscribers and manage campaigns';
    RAISE NOTICE 'System is DISABLED by default - activate after deployment';
END $$; 