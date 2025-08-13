-- =============================================
-- Phase 2: Email Reminders & Calendar Integration
-- =============================================

-- 1. Email Logs Table
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email_type VARCHAR(50) NOT NULL CHECK (email_type IN ('deadline', 'milestone', 'document', 'subscription')),
    recipients TEXT[] NOT NULL,
    subject TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'partial_failure')),
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    scholarship_data JSONB,
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Preferences Table (Enhanced)
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Email Preferences
    email_enabled BOOLEAN DEFAULT TRUE,
    email_deadlines BOOLEAN DEFAULT TRUE,
    email_milestones BOOLEAN DEFAULT TRUE,
    email_reminders BOOLEAN DEFAULT TRUE,
    email_frequency VARCHAR(20) DEFAULT 'daily' CHECK (email_frequency IN ('immediate', 'daily', 'weekly')),
    
    -- Calendar Preferences
    calendar_enabled BOOLEAN DEFAULT FALSE,
    calendar_provider VARCHAR(20) DEFAULT 'google' CHECK (calendar_provider IN ('google', 'outlook', 'apple')),
    calendar_id TEXT,
    calendar_access_token TEXT,
    calendar_refresh_token TEXT,
    calendar_token_expires_at TIMESTAMPTZ,
    
    -- Notification Preferences
    browser_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    phone_number TEXT,
    
    -- Reminder Timing
    reminder_days INTEGER[] DEFAULT ARRAY[30, 14, 7, 3, 1],
    business_hours_only BOOLEAN DEFAULT FALSE,
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Calendar Events Table
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    scholarship_id UUID REFERENCES scholarships(id) ON DELETE CASCADE,
    calendar_provider VARCHAR(20) NOT NULL,
    external_event_id TEXT NOT NULL, -- Google Calendar event ID, etc.
    event_type VARCHAR(30) DEFAULT 'deadline' CHECK (event_type IN ('deadline', 'reminder', 'milestone')),
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    location TEXT,
    reminder_minutes INTEGER[] DEFAULT ARRAY[1440, 480, 60], -- 24h, 8h, 1h before
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
    sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('pending', 'synced', 'failed')),
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, external_event_id, calendar_provider)
);

-- 4. User Activity Log (Enhanced)
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(30), -- 'scholarship', 'document', 'email', 'calendar'
    entity_id UUID,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Reminders Table (Enhanced from existing)
DO $$
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reminders' AND column_name = 'email_sent') THEN
        ALTER TABLE reminders ADD COLUMN email_sent BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reminders' AND column_name = 'email_sent_at') THEN
        ALTER TABLE reminders ADD COLUMN email_sent_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reminders' AND column_name = 'calendar_event_id') THEN
        ALTER TABLE reminders ADD COLUMN calendar_event_id UUID REFERENCES calendar_events(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reminders' AND column_name = 'reminder_days_before') THEN
        ALTER TABLE reminders ADD COLUMN reminder_days_before INTEGER;
    END IF;
END $$;

-- =============================================
-- INDEXES for Performance
-- =============================================

-- Email logs indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_type_status ON email_logs(email_type, status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);

-- User preferences indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_email_enabled ON user_preferences(email_enabled);

-- Calendar events indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_scholarship_id ON calendar_events(scholarship_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_external_id ON calendar_events(external_event_id);

-- User activity indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at);

-- Enhanced reminders indexes
CREATE INDEX IF NOT EXISTS idx_reminders_email_sent ON reminders(email_sent, reminder_date);
CREATE INDEX IF NOT EXISTS idx_reminders_calendar_event ON reminders(calendar_event_id);

-- =============================================
-- VIEWS for Easy Querying
-- =============================================

-- View: User deadline reminders with email status
CREATE OR REPLACE VIEW user_deadline_reminders WITH (security_invoker = true) AS
SELECT 
    r.id as reminder_id,
    r.user_id,
    r.title,
    r.message,
    r.reminder_date,
    r.priority,
    r.status as reminder_status,
    r.email_sent,
    r.email_sent_at,
    r.reminder_days_before,
    s.id as scholarship_id,
    s.title as scholarship_title,
    s.provider,
    s.deadline,
    s.amount,
    EXTRACT(DAYS FROM (s.deadline - NOW())) as days_until_deadline,
    up.email_enabled,
    up.email_deadlines,
    up.email_frequency,
    up.timezone
FROM reminders r
LEFT JOIN scholarships s ON r.application_id::UUID = s.id
LEFT JOIN user_preferences up ON r.user_id = up.user_id
WHERE r.type = 'deadline' 
  AND r.status = 'active'
  AND s.deadline >= NOW()
ORDER BY s.deadline ASC;

-- View: Calendar integration status
CREATE OR REPLACE VIEW user_calendar_status WITH (security_invoker = true) AS
SELECT 
    u.id as user_id,
    u.email,
    up.calendar_enabled,
    up.calendar_provider,
    up.calendar_id,
    CASE 
        WHEN up.calendar_token_expires_at > NOW() THEN 'active'
        WHEN up.calendar_token_expires_at IS NOT NULL THEN 'expired'
        ELSE 'not_connected'
    END as connection_status,
    COUNT(ce.id) as total_events,
    COUNT(CASE WHEN ce.sync_status = 'synced' THEN 1 END) as synced_events,
    COUNT(CASE WHEN ce.sync_status = 'failed' THEN 1 END) as failed_events
FROM auth.users u
LEFT JOIN user_preferences up ON u.id = up.user_id
LEFT JOIN calendar_events ce ON u.id = ce.user_id
GROUP BY u.id, u.email, up.calendar_enabled, up.calendar_provider, up.calendar_id, up.calendar_token_expires_at;

-- =============================================
-- FUNCTIONS for Email Reminder Logic
-- =============================================

-- Function: Get users needing deadline reminders
CREATE OR REPLACE FUNCTION get_users_needing_reminders()
RETURNS TABLE (
    user_id UUID,
    user_email TEXT,
    scholarship_id UUID,
    scholarship_title TEXT,
    provider TEXT,
    deadline TIMESTAMPTZ,
    days_until_deadline INTEGER,
    urgency TEXT,
    reminder_days_before INTEGER,
    email_preferences JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        usi.user_id,
        au.email as user_email,
        s.id as scholarship_id,
        s.title as scholarship_title,
        s.provider,
        s.deadline,
        EXTRACT(DAYS FROM (s.deadline - NOW()))::INTEGER as days_until_deadline,
        CASE 
            WHEN EXTRACT(DAYS FROM (s.deadline - NOW())) <= 1 THEN 'critical'
            WHEN EXTRACT(DAYS FROM (s.deadline - NOW())) <= 3 THEN 'urgent'
            WHEN EXTRACT(DAYS FROM (s.deadline - NOW())) <= 7 THEN 'important'
            ELSE 'moderate'
        END as urgency,
        unnest(COALESCE(up.reminder_days, ARRAY[30, 14, 7, 3, 1])) as reminder_days_before,
        jsonb_build_object(
            'email_enabled', COALESCE(up.email_enabled, true),
            'email_deadlines', COALESCE(up.email_deadlines, true),
            'email_frequency', COALESCE(up.email_frequency, 'daily'),
            'timezone', COALESCE(up.timezone, 'UTC')
        ) as email_preferences
    FROM user_scholarship_interactions usi
    JOIN auth.users au ON usi.user_id = au.id
    JOIN scholarships s ON usi.scholarship_id = s.id
    LEFT JOIN user_preferences up ON usi.user_id = up.user_id
    WHERE s.deadline >= NOW()
      AND s.deadline <= NOW() + INTERVAL '31 days'
      AND usi.status IN ('interested', 'applied')
      AND EXTRACT(DAYS FROM (s.deadline - NOW())) = ANY(COALESCE(up.reminder_days, ARRAY[30, 14, 7, 3, 1]))
      AND COALESCE(up.email_enabled, true) = true
      AND COALESCE(up.email_deadlines, true) = true
    ORDER BY s.deadline ASC;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGER FUNCTIONS
-- =============================================

-- Function: Auto-create calendar events for new scholarship interactions
CREATE OR REPLACE FUNCTION auto_create_calendar_reminders()
RETURNS TRIGGER AS $$
DECLARE
    user_prefs RECORD;
    deadline_date TIMESTAMPTZ;
    scholarship_info RECORD;
BEGIN
    -- Get user preferences
    SELECT * INTO user_prefs 
    FROM user_preferences 
    WHERE user_id = NEW.user_id;
    
    -- Skip if calendar not enabled
    IF user_prefs.calendar_enabled != true THEN
        RETURN NEW;
    END IF;
    
    -- Get scholarship details
    SELECT * INTO scholarship_info
    FROM scholarships 
    WHERE id = NEW.scholarship_id;
    
    IF scholarship_info.deadline IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Insert calendar event placeholder (will be synced later)
    INSERT INTO calendar_events (
        user_id,
        scholarship_id,
        calendar_provider,
        external_event_id,
        title,
        description,
        start_time,
        end_time,
        sync_status
    ) VALUES (
        NEW.user_id,
        NEW.scholarship_id,
        COALESCE(user_prefs.calendar_provider, 'google'),
        'pending-' || NEW.user_id || '-' || NEW.scholarship_id,
        scholarship_info.title || ' - Application Deadline',
        'Scholarship application deadline for ' || scholarship_info.title || ' (' || scholarship_info.provider || ')',
        scholarship_info.deadline - INTERVAL '2 hours', -- 2 hours before deadline
        scholarship_info.deadline,
        'pending'
    ) ON CONFLICT (user_id, external_event_id, calendar_provider) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto calendar events
DROP TRIGGER IF EXISTS trigger_auto_calendar_events ON user_scholarship_interactions;
CREATE TRIGGER trigger_auto_calendar_events
    AFTER INSERT ON user_scholarship_interactions
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_calendar_reminders();

-- Function: Update user activity on preference changes
CREATE OR REPLACE FUNCTION log_preference_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_activity (
        user_id,
        activity_type,
        entity_type,
        description,
        metadata
    ) VALUES (
        NEW.user_id,
        'preferences_updated',
        'settings',
        'User updated notification preferences',
        jsonb_build_object(
            'old_email_enabled', OLD.email_enabled,
            'new_email_enabled', NEW.email_enabled,
            'old_calendar_enabled', OLD.calendar_enabled,
            'new_calendar_enabled', NEW.calendar_enabled,
            'email_frequency', NEW.email_frequency
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for preference logging
DROP TRIGGER IF EXISTS trigger_log_preference_changes ON user_preferences;
CREATE TRIGGER trigger_log_preference_changes
    AFTER UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION log_preference_changes();

-- =============================================
-- RLS POLICIES
-- =============================================

-- Email logs policies
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own email logs" ON email_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert email logs" ON email_logs FOR INSERT WITH CHECK (true);

-- User preferences policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);

-- Calendar events policies
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own calendar events" ON calendar_events FOR ALL USING (auth.uid() = user_id);

-- User activity policies
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own activity" ON user_activity FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can log activity" ON user_activity FOR INSERT WITH CHECK (true);

-- =============================================
-- INITIAL DATA
-- =============================================

-- Create default preferences for existing users
INSERT INTO user_preferences (user_id, email_enabled, email_deadlines, email_frequency)
SELECT id, true, true, 'daily'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_preferences WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- =============================================
-- COMPLETED
-- =============================================

COMMENT ON TABLE email_logs IS 'Tracks all email reminders sent to users';
COMMENT ON TABLE user_preferences IS 'User notification and calendar preferences';
COMMENT ON TABLE calendar_events IS 'Calendar integration events for scholarship deadlines';
COMMENT ON TABLE user_activity IS 'Comprehensive user activity logging';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Phase 2 Email Reminders & Calendar Integration migration completed successfully!';
    RAISE NOTICE 'New features: Email tracking, Calendar sync, Enhanced preferences, Activity logging';
END $$; 