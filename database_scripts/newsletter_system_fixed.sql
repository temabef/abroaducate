-- Newsletter & Mailing List System (Fixed for new admin system)
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

-- Enable RLS on all tables
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_email_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admin can manage all newsletter subscribers" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Admin can manage newsletter settings" ON newsletter_settings;
DROP POLICY IF EXISTS "Admin can manage newsletter campaigns" ON newsletter_campaigns;
DROP POLICY IF EXISTS "Admin can view newsletter email logs" ON newsletter_email_logs;

-- Newsletter subscribers policies (using new admin system)
CREATE POLICY "Admin can manage all newsletter subscribers" ON newsletter_subscribers FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super-admin')
    ) OR 
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('admin@abroaducate.com', 'solakolawole62@gmail.com')
);

-- Newsletter settings policies
CREATE POLICY "Admin can manage newsletter settings" ON newsletter_settings FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super-admin')
    ) OR 
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('admin@abroaducate.com', 'solakolawole62@gmail.com')
);

-- Newsletter campaigns policies
CREATE POLICY "Admin can manage newsletter campaigns" ON newsletter_campaigns FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super-admin')
    ) OR 
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('admin@abroaducate.com', 'solakolawole62@gmail.com')
);

-- Newsletter email logs policies
CREATE POLICY "Admin can view newsletter email logs" ON newsletter_email_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super-admin')
    ) OR 
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('admin@abroaducate.com', 'solakolawole62@gmail.com')
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

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS trigger_newsletter_subscribers_updated_at ON newsletter_subscribers;
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Add newsletter subscriber
CREATE OR REPLACE FUNCTION add_newsletter_subscriber(
    p_email VARCHAR(255),
    p_source VARCHAR(100) DEFAULT 'website',
    p_scholarship_digest BOOLEAN DEFAULT true,
    p_weekly_updates BOOLEAN DEFAULT true,
    p_marketing_emails BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Unsubscribe from newsletter
CREATE OR REPLACE FUNCTION unsubscribe_newsletter(p_email VARCHAR(255))
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_newsletter_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION add_newsletter_subscriber(VARCHAR, VARCHAR, BOOLEAN, BOOLEAN, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION unsubscribe_newsletter(VARCHAR) TO anon, authenticated;

-- =============================================
-- VIEWS
-- =============================================

-- Drop existing views to avoid conflicts
DROP VIEW IF EXISTS active_newsletter_subscribers;
DROP VIEW IF EXISTS newsletter_campaign_performance;

-- Active newsletter subscribers view
CREATE OR REPLACE VIEW active_newsletter_subscribers AS
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

-- Newsletter campaign performance view
CREATE OR REPLACE VIEW newsletter_campaign_performance AS
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

-- Insert default newsletter settings
INSERT INTO newsletter_settings (setting_key, setting_value, description) VALUES
('sender_name', '"Abroaducate Team"', 'Default sender name for newsletter emails'),
('sender_email', '"noreply@abroaducate.com"', 'Default sender email address'),
('unsubscribe_url', '"https://abroaducate.com/newsletter/unsubscribe"', 'Base URL for unsubscribe links'),
('footer_text', '"© 2024 Abroaducate. All rights reserved."', 'Default footer text for emails'),
('max_send_per_hour', '1000', 'Maximum emails to send per hour'),
('enable_tracking', 'true', 'Enable open and click tracking for emails')
ON CONFLICT (setting_key) DO NOTHING; 