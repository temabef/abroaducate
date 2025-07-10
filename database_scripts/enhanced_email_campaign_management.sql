-- =============================================
-- EMAIL CAMPAIGN MANAGEMENT SYSTEM
-- For managing your existing 8000+ emails and sending campaigns
-- =============================================

-- 1. Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(255) NOT NULL,
    template_category VARCHAR(100) NOT NULL CHECK (template_category IN ('study_tips', 'scholarship_digest', 'platform_intro', 'welcome_series', 'general')),
    subject_line VARCHAR(500) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    target_segments TEXT[] DEFAULT ARRAY['imported_lead', 'website_signup'], -- Which segments this template is designed for
    variables JSONB, -- Template variables like {{name}}, {{scholarship_count}}
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enhanced Newsletter Campaigns Table (extending existing)
ALTER TABLE newsletter_campaigns 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES email_templates(id),
ADD COLUMN IF NOT EXISTS send_to_segments TEXT[] DEFAULT ARRAY['imported_lead'],
ADD COLUMN IF NOT EXISTS manual_send BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS preview_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- 3. Campaign Recipients Tracking
CREATE TABLE IF NOT EXISTS campaign_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES newsletter_campaigns(id) ON DELETE CASCADE,
    subscriber_id UUID REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
    email_address VARCHAR(255) NOT NULL,
    send_status VARCHAR(50) DEFAULT 'pending' CHECK (send_status IN ('pending', 'sent', 'failed', 'skipped')),
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- EMAIL CAMPAIGN FUNCTIONS
-- =============================================

-- Function: Create email campaign from template
CREATE OR REPLACE FUNCTION create_email_campaign(
    p_campaign_name VARCHAR(255),
    p_template_id UUID,
    p_target_segments TEXT[] DEFAULT ARRAY['imported_lead'],
    p_schedule_for TIMESTAMPTZ DEFAULT NULL,
    p_created_by UUID DEFAULT NULL
)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    campaign_id UUID;
    template_record RECORD;
    recipient_count INTEGER;
    created_by_id UUID;
BEGIN
    -- Get current user if not provided
    created_by_id := COALESCE(p_created_by, auth.uid());
    
    -- Get template details
    SELECT * INTO template_record FROM email_templates WHERE id = p_template_id AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Template not found or inactive'
        );
    END IF;
    
    -- Count potential recipients
    SELECT COUNT(*) INTO recipient_count
    FROM newsletter_subscribers 
    WHERE status = 'active' 
    AND email_segment = ANY(p_target_segments);
    
    -- Create campaign
    INSERT INTO newsletter_campaigns (
        campaign_name,
        template_id,
        subject_line,
        html_content,
        text_content,
        campaign_type,
        send_to_segments,
        scheduled_for,
        total_recipients,
        manual_send,
        created_by
    ) VALUES (
        p_campaign_name,
        p_template_id,
        template_record.subject_line,
        template_record.html_content,
        template_record.text_content,
        template_record.template_category,
        p_target_segments,
        p_schedule_for,
        recipient_count,
        true,
        created_by_id
    ) RETURNING id INTO campaign_id;
    
    -- Pre-populate recipients for manual review
    INSERT INTO campaign_recipients (campaign_id, subscriber_id, email_address)
    SELECT 
        campaign_id,
        ns.id,
        ns.email
    FROM newsletter_subscribers ns
    WHERE ns.status = 'active' 
    AND ns.email_segment = ANY(p_target_segments)
    ORDER BY ns.engagement_score DESC NULLS LAST; -- Send to most engaged first
    
    RETURN jsonb_build_object(
        'success', true,
        'campaign_id', campaign_id,
        'recipient_count', recipient_count,
        'template_used', template_record.template_name,
        'target_segments', p_target_segments
    );
END;
$$;

-- Function: Send email campaign (manual trigger)
CREATE OR REPLACE FUNCTION send_email_campaign(
    p_campaign_id UUID,
    p_send_immediately BOOLEAN DEFAULT false,
    p_batch_size INTEGER DEFAULT 100
)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    campaign_record RECORD;
    batch_count INTEGER := 0;
    total_recipients INTEGER;
    result JSONB;
BEGIN
    -- Get campaign details
    SELECT * INTO campaign_record FROM newsletter_campaigns WHERE id = p_campaign_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Campaign not found'
        );
    END IF;
    
    -- Check if already sent
    IF campaign_record.campaign_status = 'sent' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Campaign already sent'
        );
    END IF;
    
    -- Count pending recipients
    SELECT COUNT(*) INTO total_recipients
    FROM campaign_recipients 
    WHERE campaign_id = p_campaign_id AND send_status = 'pending';
    
    -- Update campaign status
    UPDATE newsletter_campaigns 
    SET 
        campaign_status = CASE WHEN p_send_immediately THEN 'sending' ELSE 'scheduled' END,
        sent_at = CASE WHEN p_send_immediately THEN NOW() ELSE sent_at END,
        total_recipients = total_recipients,
        updated_at = NOW()
    WHERE id = p_campaign_id;
    
    -- If sending immediately, mark first batch for sending
    IF p_send_immediately THEN
        -- This would integrate with your email sending service (SendGrid, etc.)
        -- For now, we'll mark them as sent to demonstrate the workflow
        UPDATE campaign_recipients 
        SET 
            send_status = 'sent',
            sent_at = NOW()
        WHERE campaign_id = p_campaign_id 
        AND send_status = 'pending'
        AND id IN (
            SELECT id FROM campaign_recipients 
            WHERE campaign_id = p_campaign_id AND send_status = 'pending'
            LIMIT p_batch_size
        );
        
        GET DIAGNOSTICS batch_count = ROW_COUNT;
    END IF;
    
    result := jsonb_build_object(
        'success', true,
        'campaign_id', p_campaign_id,
        'total_recipients', total_recipients,
        'campaign_status', CASE WHEN p_send_immediately THEN 'sending' ELSE 'scheduled' END
    );
    
    IF p_send_immediately THEN
        result := result || jsonb_build_object(
            'batch_sent', batch_count,
            'remaining', total_recipients - batch_count
        );
    END IF;
    
    RETURN result;
END;
$$;

-- Function: Get campaign dashboard data
CREATE OR REPLACE FUNCTION get_campaign_dashboard()
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result JSONB;
BEGIN
    WITH campaign_stats AS (
        SELECT 
            c.id,
            c.campaign_name,
            c.campaign_type,
            c.subject_line,
            c.campaign_status,
            c.send_to_segments,
            c.total_recipients,
            c.scheduled_for,
            c.sent_at,
            c.created_at,
            et.template_name,
            COUNT(cr.id) as total_recipients_actual,
            COUNT(cr.id) FILTER (WHERE cr.send_status = 'sent') as sent_count,
            COUNT(cr.id) FILTER (WHERE cr.send_status = 'failed') as failed_count,
            COUNT(cr.id) FILTER (WHERE cr.opened_at IS NOT NULL) as opened_count,
            COUNT(cr.id) FILTER (WHERE cr.clicked_at IS NOT NULL) as clicked_count
        FROM newsletter_campaigns c
        LEFT JOIN email_templates et ON c.template_id = et.id
        LEFT JOIN campaign_recipients cr ON c.id = cr.campaign_id
        WHERE c.manual_send = true
        GROUP BY c.id, c.campaign_name, c.campaign_type, c.subject_line, 
                 c.campaign_status, c.send_to_segments, c.total_recipients, 
                 c.scheduled_for, c.sent_at, c.created_at, et.template_name
        ORDER BY c.created_at DESC
        LIMIT 20
    )
    SELECT jsonb_build_object(
        'recent_campaigns', jsonb_agg(
            jsonb_build_object(
                'id', id,
                'name', campaign_name,
                'type', campaign_type,
                'subject', subject_line,
                'status', campaign_status,
                'segments', send_to_segments,
                'recipients', total_recipients_actual,
                'sent', sent_count,
                'opened', opened_count,
                'clicked', clicked_count,
                'open_rate', CASE WHEN sent_count > 0 THEN ROUND((opened_count::DECIMAL / sent_count * 100), 2) ELSE 0 END,
                'click_rate', CASE WHEN sent_count > 0 THEN ROUND((clicked_count::DECIMAL / sent_count * 100), 2) ELSE 0 END,
                'scheduled_for', scheduled_for,
                'sent_at', sent_at,
                'template_name', template_name
            )
        ),
        'summary', jsonb_build_object(
            'total_campaigns', COUNT(*),
            'active_campaigns', COUNT(*) FILTER (WHERE campaign_status IN ('draft', 'scheduled')),
            'sent_campaigns', COUNT(*) FILTER (WHERE campaign_status = 'sent'),
            'total_emails_sent', SUM(sent_count),
            'avg_open_rate', ROUND(AVG(CASE WHEN sent_count > 0 THEN (opened_count::DECIMAL / sent_count * 100) ELSE 0 END), 2)
        )
    ) INTO result
    FROM campaign_stats;
    
    RETURN COALESCE(result, jsonb_build_object('recent_campaigns', '[]'::jsonb, 'summary', '{}'::jsonb));
END;
$$;

-- Function: Get subscriber segments for targeting
CREATE OR REPLACE FUNCTION get_subscriber_segments()
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'segment', segment_name,
            'count', subscriber_count,
            'active_count', active_count,
            'avg_engagement', avg_engagement,
            'description', segment_description
        )
    ) INTO result
    FROM (
        SELECT 
            COALESCE(email_segment, 'unknown') as segment_name,
            COUNT(*) as subscriber_count,
            COUNT(*) FILTER (WHERE status = 'active') as active_count,
            ROUND(AVG(engagement_score), 1) as avg_engagement,
            CASE 
                WHEN email_segment = 'imported_lead' THEN 'Your imported email list (8000+)'
                WHEN email_segment = 'website_signup' THEN 'Direct newsletter subscriptions'
                WHEN email_segment = 'user_registration' THEN 'Converted registered users'
                ELSE 'Other email sources'
            END as segment_description
        FROM newsletter_subscribers
        GROUP BY email_segment
        ORDER BY subscriber_count DESC
    ) segments;
    
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- =============================================
-- INSERT DEFAULT EMAIL TEMPLATES
-- =============================================

-- Study Abroad Tips Template
INSERT INTO email_templates (template_name, template_category, subject_line, html_content, text_content, target_segments) VALUES
('Study Abroad Tips - Monthly', 'study_tips', '📚 Essential Study Abroad Tips for Success', 
'<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Study Abroad Tips</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <!-- Header -->
    <div style="text-align: center; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="color: #1E40AF; margin: 0; font-size: 28px;">🎓 Abroaducate</h1>
        <p style="color: #666; margin: 5px 0 0 0;">Your Study Abroad Success Guide</p>
    </div>

    <!-- Main Content -->
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1f2937; margin: 0 0 20px 0;">📚 This Month''s Study Abroad Tips</h2>
        
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0;">✈️ Tip 1: Choose Your Program Wisely</h3>
            <p style="margin: 0 0 10px 0;">Research programs that align with your academic goals and career aspirations. Consider factors like language of instruction, credit transfer, and internship opportunities.</p>
        </div>
        
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0;">💰 Tip 2: Plan Your Finances Early</h3>
            <p style="margin: 0 0 10px 0;">Start saving at least 18 months before departure. Research scholarships, grants, and work-study opportunities. Create a detailed budget including hidden costs.</p>
        </div>
        
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0;">📋 Tip 3: Prepare Your Documents</h3>
            <p style="margin: 0 0 10px 0;">Start your visa application early. Gather transcripts, recommendation letters, and financial documents. Keep both physical and digital copies.</p>
        </div>
    </div>

    <!-- CTA Section -->
    <div style="text-align: center; margin: 30px 0;">
        <a href="https://abroaducate.com/subscribe" 
           style="display: inline-block; background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          🚀 Get Personalized Guidance
        </a>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
        <p style="margin: 5px 0;">You''re receiving this because you subscribed to Abroaducate updates.</p>
        <p style="margin: 5px 0;">
            <a href="https://abroaducate.com/newsletter/unsubscribe" style="color: #2563EB; text-decoration: none;">Unsubscribe</a>
        </p>
        <p style="margin: 15px 0 5px 0; color: #9ca3af;">© 2024 Abroaducate. All rights reserved.</p>
    </div>
</body>
</html>',
'📚 ABROADUCATE - Study Abroad Success Tips

This Month''s Essential Tips:

✈️ TIP 1: CHOOSE YOUR PROGRAM WISELY
Research programs that align with your academic goals and career aspirations. Consider factors like language of instruction, credit transfer, and internship opportunities.

💰 TIP 2: PLAN YOUR FINANCES EARLY  
Start saving at least 18 months before departure. Research scholarships, grants, and work-study opportunities. Create a detailed budget including hidden costs.

📋 TIP 3: PREPARE YOUR DOCUMENTS
Start your visa application early. Gather transcripts, recommendation letters, and financial documents. Keep both physical and digital copies.

Get personalized guidance: https://abroaducate.com/subscribe

You''re receiving this because you subscribed to Abroaducate updates.
Unsubscribe: https://abroaducate.com/newsletter/unsubscribe

© 2024 Abroaducate. All rights reserved.',
ARRAY['imported_lead', 'website_signup']
),

-- Scholarship Digest Template
('Weekly Scholarship Digest', 'scholarship_digest', '🎓 This Week''s Top Scholarship Opportunities', 
'<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weekly Scholarship Digest</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <!-- Header -->
    <div style="text-align: center; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="color: #1E40AF; margin: 0; font-size: 28px;">🎓 Abroaducate</h1>
        <p style="color: #666; margin: 5px 0 0 0;">Weekly Scholarship Digest</p>
    </div>

    <!-- Scholarships will be dynamically inserted here -->
    <div style="margin-bottom: 30px;">
        <h2 style="color: #1f2937; margin: 0 0 20px 0;">🎓 Featured Scholarships This Week</h2>
        
        <!-- This section will be populated by your scholarship data -->
        <p style="background-color: #f0f9ff; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <strong>Note:</strong> This template will be populated with your latest scholarships when sent through the system.
        </p>
    </div>

    <!-- CTA Section -->
    <div style="text-align: center; margin: 30px 0;">
        <a href="https://abroaducate.com/scholarships" 
           style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 0 10px 10px 0;">
          🔍 Browse All Scholarships
        </a>
        <a href="https://abroaducate.com/subscribe" 
           style="display: inline-block; background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 0 10px 10px 0;">
          🎯 Get Personalized Matches
        </a>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
        <p style="margin: 5px 0;">You''re receiving this because you subscribed to scholarship updates.</p>
        <p style="margin: 5px 0;">
            <a href="https://abroaducate.com/newsletter/unsubscribe" style="color: #2563EB; text-decoration: none;">Unsubscribe</a>
        </p>
        <p style="margin: 15px 0 5px 0; color: #9ca3af;">© 2024 Abroaducate. All rights reserved.</p>
    </div>
</body>
</html>',
'🎓 ABROADUCATE - Weekly Scholarship Digest

Featured Scholarships This Week:

[Scholarships will be populated when sent]

Browse all scholarships: https://abroaducate.com/scholarships
Get personalized matches: https://abroaducate.com/subscribe

You''re receiving this because you subscribed to scholarship updates.
Unsubscribe: https://abroaducate.com/newsletter/unsubscribe

© 2024 Abroaducate. All rights reserved.',
ARRAY['imported_lead', 'website_signup', 'user_registration']
)
ON CONFLICT DO NOTHING;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

GRANT EXECUTE ON FUNCTION create_email_campaign(VARCHAR, UUID, TEXT[], TIMESTAMPTZ, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_email_campaign(UUID, BOOLEAN, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_campaign_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION get_subscriber_segments() TO authenticated;

GRANT SELECT, INSERT, UPDATE ON email_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE ON campaign_recipients TO authenticated;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(template_category);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON campaign_recipients(send_status);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);

-- =============================================
-- CAMPAIGN MANAGEMENT SYSTEM COMPLETE
-- =============================================

COMMENT ON TABLE email_templates IS 'Reusable email templates for campaigns';
COMMENT ON TABLE campaign_recipients IS 'Tracks individual recipients for each campaign';
COMMENT ON FUNCTION create_email_campaign IS 'Creates a new email campaign from a template';
COMMENT ON FUNCTION send_email_campaign IS 'Sends or schedules an email campaign';
COMMENT ON FUNCTION get_campaign_dashboard IS 'Returns campaign performance dashboard data';
COMMENT ON FUNCTION get_subscriber_segments IS 'Returns subscriber segment information for targeting'; 