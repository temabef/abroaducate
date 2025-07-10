-- =============================================
-- ENHANCED NEWSLETTER SEGMENTATION SYSTEM
-- Properly manage 8000 emails vs registered users
-- =============================================

-- 1. Enhanced Newsletter Subscribers Table
-- Add columns to better segment and manage different user types
ALTER TABLE newsletter_subscribers 
ADD COLUMN IF NOT EXISTS email_segment VARCHAR(50) DEFAULT 'general' 
    CHECK (email_segment IN ('imported_lead', 'website_signup', 'user_registration', 'ebook_download', 'webinar_attendee', 'general')),
ADD COLUMN IF NOT EXISTS import_batch_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_engagement_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS conversion_likelihood VARCHAR(20) DEFAULT 'unknown' 
    CHECK (conversion_likelihood IN ('high', 'medium', 'low', 'unknown')),
ADD COLUMN IF NOT EXISTS preferred_content_type VARCHAR(50) DEFAULT 'general' 
    CHECK (preferred_content_type IN ('scholarships_only', 'study_tips', 'general', 'announcements')),
ADD COLUMN IF NOT EXISTS registration_attempted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS registration_completed_at TIMESTAMPTZ;

-- 2. Email Content Categories Table
-- Define different types of content for different segments
CREATE TABLE IF NOT EXISTS newsletter_content_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(100) UNIQUE NOT NULL,
    target_segments TEXT[] NOT NULL, -- Which email segments receive this content
    send_frequency VARCHAR(20) DEFAULT 'weekly',
    priority_level INTEGER DEFAULT 5, -- 1-10, higher = more important
    content_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Subscriber Engagement Tracking
CREATE TABLE IF NOT EXISTS newsletter_engagement_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscriber_id UUID REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('email_opened', 'link_clicked', 'unsubscribed', 'bounced', 'marked_spam', 'registration_attempted')),
    event_metadata JSONB,
    campaign_id UUID REFERENCES newsletter_campaigns(id) ON DELETE SET NULL,
    occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Transition Tracking Table
-- Track when newsletter subscribers become registered users
CREATE TABLE IF NOT EXISTS newsletter_to_user_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscriber_id UUID REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    transition_source VARCHAR(100), -- How they registered: 'direct', 'email_cta', 'website', etc.
    emails_received_before_registration INTEGER DEFAULT 0,
    days_subscribed_before_registration INTEGER,
    last_newsletter_engagement_at TIMESTAMPTZ,
    transitioned_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(subscriber_id, user_id)
);

-- =============================================
-- CONTENT MANAGEMENT FUNCTIONS
-- =============================================

-- Function: Segment-aware newsletter subscriber addition
CREATE OR REPLACE FUNCTION add_segmented_newsletter_subscriber(
    p_email VARCHAR(255),
    p_source VARCHAR(100) DEFAULT 'website',
    p_segment VARCHAR(50) DEFAULT 'general',
    p_import_batch_id VARCHAR(100) DEFAULT NULL,
    p_content_preferences JSONB DEFAULT '{"scholarships": true, "study_tips": false, "announcements": false}'::jsonb
)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    subscriber_id UUID;
    email_clean VARCHAR(255);
    is_new_subscriber BOOLEAN := false;
BEGIN
    email_clean := LOWER(TRIM(p_email));
    
    -- Validate email format
    IF email_clean !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid email format'
        );
    END IF;
    
    -- Insert or update subscriber
    INSERT INTO newsletter_subscribers (
        email, 
        source,
        email_segment,
        import_batch_id,
        scholarship_digest,
        weekly_updates,
        marketing_emails,
        preferred_content_type
    ) VALUES (
        email_clean,
        p_source,
        p_segment,
        p_import_batch_id,
        COALESCE((p_content_preferences->>'scholarships')::boolean, true),
        COALESCE((p_content_preferences->>'study_tips')::boolean, false),
        COALESCE((p_content_preferences->>'announcements')::boolean, false),
        CASE 
            WHEN (p_content_preferences->>'scholarships')::boolean = true THEN 'scholarships_only'
            ELSE 'general'
        END
    )
    ON CONFLICT (email) DO UPDATE SET
        -- Only update if not already converted to user
        source = CASE WHEN newsletter_subscribers.converted_to_user THEN newsletter_subscribers.source ELSE EXCLUDED.source END,
        email_segment = CASE WHEN newsletter_subscribers.converted_to_user THEN newsletter_subscribers.email_segment ELSE EXCLUDED.email_segment END,
        import_batch_id = CASE WHEN newsletter_subscribers.import_batch_id IS NULL THEN EXCLUDED.import_batch_id ELSE newsletter_subscribers.import_batch_id END,
        status = 'active',
        updated_at = NOW()
    RETURNING id, (xmax = 0) INTO subscriber_id, is_new_subscriber;
    
    RETURN jsonb_build_object(
        'success', true,
        'subscriber_id', subscriber_id,
        'email', email_clean,
        'is_new_subscriber', is_new_subscriber,
        'segment', p_segment
    );
END;
$$;

-- Function: Get newsletter statistics by segment
CREATE OR REPLACE FUNCTION get_newsletter_stats_by_segment()
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result JSONB;
BEGIN
    WITH segment_stats AS (
        SELECT 
            email_segment,
            COUNT(*) as total_count,
            COUNT(*) FILTER (WHERE status = 'active') as active_count,
            COUNT(*) FILTER (WHERE converted_to_user = true) as converted_count,
            COUNT(*) FILTER (WHERE engagement_score > 5) as engaged_count,
            AVG(engagement_score) as avg_engagement
        FROM newsletter_subscribers
        GROUP BY email_segment
    ),
    overall_stats AS (
        SELECT 
            COUNT(*) as total_subscribers,
            COUNT(*) FILTER (WHERE status = 'active') as active_subscribers,
            COUNT(*) FILTER (WHERE converted_to_user = true) as total_conversions,
            COUNT(*) FILTER (WHERE email_segment = 'imported_lead') as imported_leads,
            COUNT(*) FILTER (WHERE email_segment = 'user_registration') as user_registrations
        FROM newsletter_subscribers
    )
    SELECT jsonb_build_object(
        'overall', row_to_json(overall_stats.*),
        'by_segment', jsonb_object_agg(email_segment, row_to_json(segment_stats.*))
    ) INTO result
    FROM segment_stats, overall_stats
    GROUP BY overall_stats.*;
    
    RETURN result;
END;
$$;

-- Function: Handle newsletter subscriber to user transition
CREATE OR REPLACE FUNCTION transition_newsletter_subscriber_to_user(
    p_email VARCHAR(255),
    p_user_id UUID,
    p_transition_source VARCHAR(100) DEFAULT 'registration'
)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    subscriber_record RECORD;
    transition_id UUID;
    days_subscribed INTEGER;
    emails_received INTEGER;
BEGIN
    -- Find the newsletter subscriber
    SELECT * INTO subscriber_record
    FROM newsletter_subscribers 
    WHERE LOWER(email) = LOWER(TRIM(p_email))
    AND status = 'active';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Newsletter subscriber not found'
        );
    END IF;
    
    -- Calculate subscription metrics
    days_subscribed := EXTRACT(DAYS FROM (NOW() - subscriber_record.subscribed_at));
    emails_received := COALESCE(subscriber_record.total_emails_sent, 0);
    
    -- Update newsletter subscriber record
    UPDATE newsletter_subscribers 
    SET 
        converted_to_user = true,
        converted_at = NOW(),
        user_id = p_user_id,
        email_segment = 'user_registration',
        updated_at = NOW()
    WHERE id = subscriber_record.id;
    
    -- Record the transition
    INSERT INTO newsletter_to_user_transitions (
        subscriber_id,
        user_id,
        transition_source,
        emails_received_before_registration,
        days_subscribed_before_registration,
        last_newsletter_engagement_at
    ) VALUES (
        subscriber_record.id,
        p_user_id,
        p_transition_source,
        emails_received,
        days_subscribed,
        subscriber_record.last_engagement_at
    ) RETURNING id INTO transition_id;
    
    -- Copy newsletter preferences to user preferences
    INSERT INTO user_preferences (
        user_id,
        email_enabled,
        scholarship_digest,
        weekly_updates,
        email_frequency
    ) VALUES (
        p_user_id,
        true,
        subscriber_record.scholarship_digest,
        subscriber_record.weekly_updates,
        'weekly'
    ) ON CONFLICT (user_id) DO UPDATE SET
        scholarship_digest = EXCLUDED.scholarship_digest,
        weekly_updates = EXCLUDED.weekly_updates;
    
    RETURN jsonb_build_object(
        'success', true,
        'transition_id', transition_id,
        'days_subscribed', days_subscribed,
        'emails_received', emails_received,
        'engagement_score', subscriber_record.engagement_score
    );
END;
$$;

-- Function: Get content recommendations by segment
CREATE OR REPLACE FUNCTION get_content_for_segment(p_segment VARCHAR(50))
RETURNS TABLE (
    content_type VARCHAR(50),
    should_send BOOLEAN,
    frequency VARCHAR(20),
    priority INTEGER
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ncc.category_name,
        (p_segment = ANY(ncc.target_segments)) as should_send,
        ncc.send_frequency,
        ncc.priority_level
    FROM newsletter_content_categories ncc
    ORDER BY ncc.priority_level DESC;
END;
$$;

-- =============================================
-- CONTENT CATEGORY SETUP
-- =============================================

-- Insert content categories for different segments
INSERT INTO newsletter_content_categories (category_name, target_segments, send_frequency, priority_level, content_description) VALUES
('scholarship_digest_basic', ARRAY['imported_lead', 'website_signup', 'general'], 'weekly', 8, 'General scholarship opportunities for non-users'),
('scholarship_digest_personalized', ARRAY['user_registration'], 'weekly', 9, 'Personalized scholarships based on user profile'),
('study_abroad_tips', ARRAY['imported_lead', 'website_signup', 'ebook_download'], 'bi-weekly', 6, 'General study abroad guidance and tips'),
('platform_announcements', ARRAY['imported_lead', 'website_signup', 'user_registration'], 'monthly', 4, 'New features and platform updates'),
('conversion_campaign', ARRAY['imported_lead', 'website_signup'], 'monthly', 7, 'Encouraging registration and platform usage'),
('user_onboarding', ARRAY['user_registration'], 'triggered', 10, 'Welcome series for new registered users'),
('high_value_scholarships', ARRAY['imported_lead', 'website_signup', 'user_registration'], 'as-needed', 9, 'Major scholarship opportunities worth highlighting')
ON CONFLICT (category_name) DO NOTHING;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Newsletter subscribers enhanced indexes
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_segment ON newsletter_subscribers(email_segment);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_batch ON newsletter_subscribers(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_engagement ON newsletter_subscribers(engagement_score);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_converted ON newsletter_subscribers(converted_to_user);

-- Engagement tracking indexes
CREATE INDEX IF NOT EXISTS idx_newsletter_engagement_subscriber ON newsletter_engagement_events(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_engagement_type ON newsletter_engagement_events(event_type);
CREATE INDEX IF NOT EXISTS idx_newsletter_engagement_date ON newsletter_engagement_events(occurred_at);

-- Transition tracking indexes
CREATE INDEX IF NOT EXISTS idx_newsletter_transitions_subscriber ON newsletter_to_user_transitions(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_transitions_user ON newsletter_to_user_transitions(user_id);

-- =============================================
-- UPDATED VIEWS FOR SEGMENTATION
-- =============================================

-- Drop existing views and recreate with segmentation
DROP VIEW IF EXISTS active_newsletter_subscribers;
DROP VIEW IF EXISTS newsletter_campaign_performance;

-- Enhanced active subscribers view
CREATE VIEW active_newsletter_subscribers_segmented AS
SELECT 
    email_segment,
    import_batch_id,
    COUNT(*) as total_subscribers,
    COUNT(*) FILTER (WHERE scholarship_digest = true) as digest_subscribers,
    COUNT(*) FILTER (WHERE last_email_sent > NOW() - INTERVAL '30 days') as recent_recipients,
    COUNT(*) FILTER (WHERE converted_to_user = true) as converted_users,
    AVG(engagement_score) as avg_engagement_score,
    AVG(total_opens) as avg_opens,
    AVG(total_clicks) as avg_clicks,
    COUNT(*) FILTER (WHERE engagement_score > 5) as highly_engaged,
    MIN(subscribed_at) as first_subscriber_date,
    MAX(subscribed_at) as latest_subscriber_date
FROM newsletter_subscribers
WHERE status = 'active'
GROUP BY email_segment, import_batch_id
ORDER BY email_segment, total_subscribers DESC;

-- Import batch performance view
CREATE VIEW newsletter_import_performance AS
SELECT 
    import_batch_id,
    source,
    COUNT(*) as total_imported,
    COUNT(*) FILTER (WHERE status = 'active') as still_active,
    COUNT(*) FILTER (WHERE converted_to_user = true) as converted,
    COUNT(*) FILTER (WHERE status = 'unsubscribed') as unsubscribed,
    COUNT(*) FILTER (WHERE engagement_score > 5) as engaged,
    ROUND(
        (COUNT(*) FILTER (WHERE converted_to_user = true)::DECIMAL / COUNT(*) * 100), 2
    ) as conversion_rate_percent,
    ROUND(
        (COUNT(*) FILTER (WHERE status = 'unsubscribed')::DECIMAL / COUNT(*) * 100), 2
    ) as unsubscribe_rate_percent,
    MIN(subscribed_at) as import_date,
    AVG(engagement_score) as avg_engagement
FROM newsletter_subscribers
WHERE import_batch_id IS NOT NULL
GROUP BY import_batch_id, source
ORDER BY conversion_rate_percent DESC, total_imported DESC;

-- Grant permissions
GRANT EXECUTE ON FUNCTION add_segmented_newsletter_subscriber(VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_newsletter_stats_by_segment() TO authenticated;
GRANT EXECUTE ON FUNCTION transition_newsletter_subscriber_to_user(VARCHAR, UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_content_for_segment(VARCHAR) TO authenticated;

GRANT SELECT ON newsletter_content_categories TO authenticated;
GRANT SELECT ON active_newsletter_subscribers_segmented TO authenticated;
GRANT SELECT ON newsletter_import_performance TO authenticated;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

COMMENT ON TABLE newsletter_subscribers IS 'Enhanced newsletter system with proper segmentation for 8000 imports vs registered users';
COMMENT ON TABLE newsletter_content_categories IS 'Defines what content goes to which subscriber segments';
COMMENT ON TABLE newsletter_engagement_events IS 'Tracks engagement events for scoring and optimization';
COMMENT ON TABLE newsletter_to_user_transitions IS 'Tracks successful conversions from newsletter to registered users'; 