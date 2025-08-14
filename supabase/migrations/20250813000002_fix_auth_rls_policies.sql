-- Fix authentication and RLS policy issues after search path changes
-- This addresses login redirect issues caused by RLS policy failures

-- Ensure auth schema functions work properly with search path
-- Note: auth.uid() is a built-in function but RLS policies might need refresh

-- Refresh all RLS policies that use auth.uid() to ensure they work after search path changes

-- 1. Newsletter system RLS policies
DROP POLICY IF EXISTS "Admin can manage all newsletter subscribers" ON newsletter_subscribers;
CREATE POLICY "Admin can manage all newsletter subscribers" ON newsletter_subscribers FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_subscriptions us 
        WHERE us.user_id = auth.uid() 
        AND us.plan_type = 'admin'
    )
);

DROP POLICY IF EXISTS "Admin can manage newsletter settings" ON newsletter_settings;
CREATE POLICY "Admin can manage newsletter settings" ON newsletter_settings FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_subscriptions us 
        WHERE us.user_id = auth.uid() 
        AND us.plan_type = 'admin'
    )
);

DROP POLICY IF EXISTS "Admin can manage newsletter campaigns" ON newsletter_campaigns;
CREATE POLICY "Admin can manage newsletter campaigns" ON newsletter_campaigns FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_subscriptions us 
        WHERE us.user_id = auth.uid() 
        AND us.plan_type = 'admin'
    )
);

DROP POLICY IF EXISTS "Admin can view newsletter email logs" ON newsletter_email_logs;
CREATE POLICY "Admin can view newsletter email logs" ON newsletter_email_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_subscriptions us 
        WHERE us.user_id = auth.uid() 
        AND us.plan_type = 'admin'
    )
);

-- 2. Email reminders system RLS policies
DROP POLICY IF EXISTS "Users can view own email logs" ON email_logs;
CREATE POLICY "Users can view own email logs" ON email_logs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;
CREATE POLICY "Users can manage own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own calendar events" ON calendar_events;
CREATE POLICY "Users can manage own calendar events" ON calendar_events FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own activity" ON user_activity;
CREATE POLICY "Users can view own activity" ON user_activity FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own reminders" ON reminders;
CREATE POLICY "Users can manage own reminders" ON reminders FOR ALL USING (auth.uid() = user_id);

-- 3. Scholarship tracking RLS policies
DROP POLICY IF EXISTS "Users can insert own interactions" ON user_scholarship_interactions;
CREATE POLICY "Users can insert own interactions" ON user_scholarship_interactions 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own interactions" ON user_scholarship_interactions;
CREATE POLICY "Users can update own interactions" ON user_scholarship_interactions 
FOR UPDATE USING (auth.uid() = user_id);

-- 4. Ensure auth schema is accessible
-- This is critical for authentication to work properly
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;

-- 5. Refresh any views that might use auth functions
DROP VIEW IF EXISTS user_scholarship_deadlines;
CREATE OR REPLACE VIEW user_scholarship_deadlines AS
SELECT 
    s.id as scholarship_id,
    s.title,
    s.provider,
    s.location,
    s.deadline,
    s.amount,
    EXTRACT(DAYS FROM (s.deadline - NOW())) as days_until_deadline,
    usi.status as application_status,
    usi.is_saved,
    usi.is_applied,
    usi.user_id
FROM scholarships s
JOIN user_scholarship_interactions usi ON s.id = usi.scholarship_id
WHERE s.deadline >= NOW()
AND s.deadline <= NOW() + INTERVAL '90 days'
AND (usi.is_saved = true OR usi.is_applied = true);

-- Enable RLS on the view
ALTER VIEW user_scholarship_deadlines SET (security_invoker = true);

-- 6. Ensure all authentication-related functions have proper permissions
-- This fixes issues where auth functions might not be accessible
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.role() TO authenticated;

-- Migration complete: Fix authentication and RLS policy issues after search path changes - resolves login redirect problems
