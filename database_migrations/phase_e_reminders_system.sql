-- Phase E: Timeline & Reminder System Database Schema
-- This migration adds reminder and notification functionality

-- ===================================
-- REMINDERS TABLE
-- ===================================

CREATE TABLE IF NOT EXISTS reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    
    -- Reminder details
    type VARCHAR(50) NOT NULL CHECK (type IN ('deadline', 'milestone', 'custom', 'document')),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    
    -- Timing
    reminder_date TIMESTAMPTZ NOT NULL,
    snoozed_until TIMESTAMPTZ,
    recurring BOOLEAN DEFAULT FALSE,
    recurring_interval VARCHAR(20) CHECK (recurring_interval IN ('daily', 'weekly', 'monthly')),
    
    -- Metadata
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dismissed', 'snoozed')),
    event_id VARCHAR(100), -- For linking to timeline events
    
    -- Notification tracking
    email_sent BOOLEAN DEFAULT FALSE,
    push_sent BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX (user_id),
    INDEX (reminder_date),
    INDEX (status),
    INDEX (application_id)
);

-- ===================================
-- MILESTONE TEMPLATES
-- ===================================

CREATE TABLE IF NOT EXISTS milestone_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    days_before_deadline INTEGER NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('documents', 'tests', 'essays', 'application', 'financial')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    auto_generate BOOLEAN DEFAULT TRUE,
    is_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default milestone templates
INSERT INTO milestone_templates (name, description, days_before_deadline, category, priority, auto_generate, is_required) VALUES
('Complete Test Preparation', 'Finish GRE/TOEFL/IELTS preparation and take required tests', 90, 'tests', 'high', TRUE, TRUE),
('Request Letters of Recommendation', 'Contact professors and employers for recommendation letters', 75, 'documents', 'high', TRUE, TRUE),
('Complete SOP First Draft', 'Finish first draft of Statement of Purpose', 60, 'essays', 'medium', TRUE, TRUE),
('Gather Academic Documents', 'Collect transcripts, certificates, and other academic records', 45, 'documents', 'medium', TRUE, TRUE),
('Prepare Financial Documents', 'Bank statements, sponsorship letters, and financial aid applications', 45, 'financial', 'medium', TRUE, FALSE),
('Complete Application Essays', 'Finalize all required essays and personal statements', 30, 'essays', 'high', TRUE, TRUE),
('Final Document Review', 'Review and finalize all application materials', 14, 'application', 'high', TRUE, TRUE),
('Submit Application', 'Submit complete application before deadline', 3, 'application', 'urgent', TRUE, TRUE),
('Application Fee Payment', 'Pay application fees and confirm submission', 2, 'application', 'urgent', TRUE, TRUE);

-- ===================================
-- TIMELINE EVENTS TABLE
-- ===================================

CREATE TABLE IF NOT EXISTS timeline_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    
    -- Event details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('deadline', 'milestone', 'reminder', 'submission', 'interview', 'decision')),
    
    -- Status and priority
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'today', 'overdue', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Metadata
    is_auto_generated BOOLEAN DEFAULT FALSE,
    milestone_template_id UUID REFERENCES milestone_templates(id),
    completion_date TIMESTAMPTZ,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX (user_id),
    INDEX (event_date),
    INDEX (application_id),
    INDEX (status)
);

-- ===================================
-- USER NOTIFICATION PREFERENCES
-- ===================================

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- Email preferences
    email_enabled BOOLEAN DEFAULT TRUE,
    email_deadlines BOOLEAN DEFAULT TRUE,
    email_milestones BOOLEAN DEFAULT TRUE,
    email_reminders BOOLEAN DEFAULT TRUE,
    email_frequency VARCHAR(20) DEFAULT 'daily' CHECK (email_frequency IN ('immediate', 'daily', 'weekly')),
    
    -- Push notification preferences
    push_enabled BOOLEAN DEFAULT TRUE,
    push_deadlines BOOLEAN DEFAULT TRUE,
    push_milestones BOOLEAN DEFAULT TRUE,
    push_reminders BOOLEAN DEFAULT TRUE,
    
    -- Timing preferences
    preferred_reminder_time TIME DEFAULT '09:00:00',
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Advanced settings
    auto_generate_milestones BOOLEAN DEFAULT TRUE,
    reminder_days_before JSONB DEFAULT '[30, 14, 7, 3, 1]',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- FUNCTIONS FOR TIMELINE MANAGEMENT
-- ===================================

-- Function to auto-generate milestones for new applications
CREATE OR REPLACE FUNCTION generate_application_milestones(
    app_id UUID,
    user_uuid UUID,
    deadline_date DATE
) RETURNS VOID AS $$
DECLARE
    template RECORD;
    milestone_date DATE;
BEGIN
    -- Get user preferences
    DECLARE
        user_prefs RECORD;
    BEGIN
        SELECT * INTO user_prefs 
        FROM notification_preferences 
        WHERE user_id = user_uuid;
        
        -- If no preferences exist or auto-generation is disabled, exit
        IF NOT FOUND OR NOT user_prefs.auto_generate_milestones THEN
            RETURN;
        END IF;
    END;
    
    -- Generate milestones from templates
    FOR template IN 
        SELECT * FROM milestone_templates 
        WHERE auto_generate = TRUE 
        ORDER BY days_before_deadline DESC
    LOOP
        -- Calculate milestone date
        milestone_date := deadline_date - INTERVAL '1 day' * template.days_before_deadline;
        
        -- Only create future milestones
        IF milestone_date >= CURRENT_DATE THEN
            INSERT INTO timeline_events (
                user_id,
                application_id,
                title,
                description,
                event_date,
                event_type,
                priority,
                is_auto_generated,
                milestone_template_id
            ) VALUES (
                user_uuid,
                app_id,
                template.name,
                template.description,
                milestone_date,
                'milestone',
                template.priority,
                TRUE,
                template.id
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update timeline event status based on dates
CREATE OR REPLACE FUNCTION update_timeline_status() RETURNS VOID AS $$
BEGIN
    -- Update overdue events
    UPDATE timeline_events 
    SET status = 'overdue'
    WHERE event_date < CURRENT_DATE 
      AND status IN ('upcoming', 'today');
    
    -- Update today's events
    UPDATE timeline_events 
    SET status = 'today'
    WHERE event_date = CURRENT_DATE 
      AND status = 'upcoming';
      
    -- Update reminder status based on snooze
    UPDATE reminders 
    SET status = 'active'
    WHERE status = 'snoozed' 
      AND snoozed_until <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get upcoming reminders for a user
CREATE OR REPLACE FUNCTION get_user_reminders(
    user_uuid UUID,
    days_ahead INTEGER DEFAULT 7
) RETURNS TABLE (
    reminder_id UUID,
    title VARCHAR(255),
    message TEXT,
    reminder_date TIMESTAMPTZ,
    priority VARCHAR(20),
    type VARCHAR(50),
    application_id UUID,
    university_name TEXT,
    program_name TEXT,
    days_until INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id as reminder_id,
        r.title,
        r.message,
        r.reminder_date,
        r.priority,
        r.type,
        r.application_id,
        a.university_name,
        a.program_name,
        EXTRACT(DAY FROM (r.reminder_date::DATE - CURRENT_DATE))::INTEGER as days_until
    FROM reminders r
    LEFT JOIN applications a ON r.application_id = a.id
    WHERE r.user_id = user_uuid
      AND r.status = 'active'
      AND r.reminder_date <= (CURRENT_DATE + INTERVAL '1 day' * days_ahead)
    ORDER BY r.reminder_date ASC;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- TRIGGERS FOR AUTO-GENERATION
-- ===================================

-- Trigger to auto-generate milestones when applications are created
CREATE OR REPLACE FUNCTION trigger_generate_milestones() RETURNS TRIGGER AS $$
BEGIN
    -- Only generate if deadline exists
    IF NEW.application_deadline IS NOT NULL THEN
        PERFORM generate_application_milestones(
            NEW.id,
            NEW.user_id,
            NEW.application_deadline
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER applications_milestone_trigger
    AFTER INSERT ON applications
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generate_milestones();

-- Trigger to update timeline status daily
CREATE OR REPLACE FUNCTION schedule_status_updates() RETURNS VOID AS $$
BEGIN
    -- This would be called by a cron job or scheduled task
    PERFORM update_timeline_status();
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- VIEWS FOR DASHBOARD INTEGRATION
-- ===================================

-- View for dashboard timeline overview
CREATE OR REPLACE VIEW dashboard_timeline AS
SELECT 
    te.id,
    te.title,
    te.event_date,
    te.event_type,
    te.status,
    te.priority,
    a.university_name,
    a.program_name,
    EXTRACT(DAY FROM (te.event_date - CURRENT_DATE))::INTEGER as days_until,
    te.user_id
FROM timeline_events te
JOIN applications a ON te.application_id = a.id
WHERE te.status IN ('upcoming', 'today', 'overdue')
ORDER BY te.event_date ASC;

-- View for urgent reminders
CREATE OR REPLACE VIEW urgent_reminders AS
SELECT 
    r.id,
    r.title,
    r.reminder_date,
    r.priority,
    r.type,
    a.university_name,
    a.program_name,
    r.user_id
FROM reminders r
LEFT JOIN applications a ON r.application_id = a.id
WHERE r.status = 'active'
  AND r.reminder_date <= (NOW() + INTERVAL '24 hours')
ORDER BY r.reminder_date ASC;

-- ===================================
-- RLS POLICIES
-- ===================================

-- Enable RLS on all tables
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_templates ENABLE ROW LEVEL SECURITY;

-- Policies for reminders
CREATE POLICY "Users can manage their own reminders" ON reminders
    FOR ALL USING (auth.uid() = user_id);

-- Policies for timeline events
CREATE POLICY "Users can manage their own timeline events" ON timeline_events
    FOR ALL USING (auth.uid() = user_id);

-- Policies for notification preferences
CREATE POLICY "Users can manage their own notification preferences" ON notification_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Policies for milestone templates (read-only for all authenticated users)
CREATE POLICY "Authenticated users can read milestone templates" ON milestone_templates
    FOR SELECT USING (auth.role() = 'authenticated');

-- ===================================
-- INITIAL DATA SETUP
-- ===================================

-- Create default notification preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM notification_preferences);

-- ===================================
-- INDEXES FOR PERFORMANCE
-- ===================================

CREATE INDEX IF NOT EXISTS idx_reminders_user_date ON reminders(user_id, reminder_date);
CREATE INDEX IF NOT EXISTS idx_reminders_status_date ON reminders(status, reminder_date);
CREATE INDEX IF NOT EXISTS idx_timeline_user_date ON timeline_events(user_id, event_date);
CREATE INDEX IF NOT EXISTS idx_timeline_status_date ON timeline_events(status, event_date);
CREATE INDEX IF NOT EXISTS idx_timeline_application ON timeline_events(application_id, event_date);