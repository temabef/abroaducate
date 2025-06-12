-- 🚨 CRITICAL SECURITY FIXES for Views
-- Fix user_calendar_status and user_deadline_reminders

-- ========================================
-- FIX 1: user_calendar_status 
-- PROBLEM: Exposes all users' emails to any authenticated user
-- SOLUTION: Only show current user's data, remove auth.users exposure
-- ========================================

DROP VIEW IF EXISTS public.user_calendar_status;

CREATE VIEW public.user_calendar_status AS
SELECT 
    auth.uid() AS user_id,  -- 🔒 SECURITY FIX: Only current user's ID
    up.calendar_enabled,
    up.calendar_provider,
    up.calendar_id,
    CASE
        WHEN (up.calendar_token_expires_at > now()) THEN 'active'::text
        WHEN (up.calendar_token_expires_at IS NOT NULL) THEN 'expired'::text
        ELSE 'not_connected'::text
    END AS connection_status,
    count(ce.id) AS total_events,
    count(
        CASE
            WHEN ((ce.sync_status)::text = 'synced'::text) THEN 1
            ELSE NULL::integer
        END) AS synced_events,
    count(
        CASE
            WHEN ((ce.sync_status)::text = 'failed'::text) THEN 1
            ELSE NULL::integer
        END) AS failed_events
FROM user_preferences up
LEFT JOIN calendar_events ce ON (auth.uid() = ce.user_id)
WHERE up.user_id = auth.uid()  -- 🔒 SECURITY FIX: Only current user's data
GROUP BY up.calendar_enabled, up.calendar_provider, up.calendar_id, up.calendar_token_expires_at;

-- ========================================
-- FIX 2: user_deadline_reminders
-- PROBLEM: Uses SECURITY DEFINER (runs with creator permissions)
-- SOLUTION: Remove SECURITY DEFINER, add proper user filtering
-- ========================================

DROP VIEW IF EXISTS public.user_deadline_reminders;

CREATE VIEW public.user_deadline_reminders AS
SELECT 
    r.id AS reminder_id,
    r.user_id,
    r.title,
    r.message,
    r.reminder_date,
    r.priority,
    r.status AS reminder_status,
    r.email_sent,
    r.email_sent_at,
    r.reminder_days_before,
    s.id AS scholarship_id,
    s.title AS scholarship_title,
    s.provider,
    s.deadline,
    s.amount,
    EXTRACT(days FROM ((s.deadline)::timestamp with time zone - now())) AS days_until_deadline,
    up.email_enabled,
    up.email_deadlines,
    up.email_frequency,
    up.timezone
FROM reminders r
LEFT JOIN scholarships s ON (((r.application_id)::uuid = s.id))
LEFT JOIN user_preferences up ON (r.user_id = up.user_id)
WHERE ((r.type)::text = 'deadline'::text) 
    AND ((r.status)::text = 'active'::text) 
    AND (s.deadline >= now())
    AND r.user_id = auth.uid()  -- 🔒 SECURITY FIX: Only current user's reminders
ORDER BY s.deadline;

-- ========================================
-- FIX 3: Set proper RLS policies for these views if needed
-- ========================================

-- Enable RLS on the underlying tables if not already enabled
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to ensure users only see their own data
CREATE POLICY IF NOT EXISTS "Users can only see own preferences" ON public.user_preferences
FOR ALL TO authenticated
USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can only see own calendar events" ON public.calendar_events
FOR ALL TO authenticated
USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can only see own reminders" ON public.reminders
FOR ALL TO authenticated
USING (user_id = auth.uid()); 