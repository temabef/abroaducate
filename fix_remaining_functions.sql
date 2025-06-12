-- 🔧 Fix Remaining Functions - Add SET search_path = '' for security
-- Functions: auto_create_calendar_reminders, create_default_subscription, get_current_usage, 
--           get_users_needing_reminders, log_preference_changes, update_updated_at_column

-- ========================================
-- FIX 1: update_updated_at_column
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''  -- 🔒 SECURITY FIX: Set fixed search path
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ========================================
-- FIX 2: create_default_subscription
-- ========================================
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''  -- 🔒 SECURITY FIX: Set fixed search path
AS $$
BEGIN
    -- Use INSERT with try/catch approach
    BEGIN
        INSERT INTO public.user_subscriptions (user_id, plan_type, status)
        VALUES (NEW.id, 'free', 'active');
    EXCEPTION WHEN unique_violation THEN
        -- User already has an active subscription, do nothing
        NULL;
    END;
    RETURN NEW;
END;
$$;

-- ========================================
-- FIX 3: get_current_usage
-- ========================================
CREATE OR REPLACE FUNCTION get_current_usage(user_uuid UUID)
RETURNS TABLE (
    sops_created INTEGER,
    ai_improvements_used INTEGER,
    analytics_generated INTEGER,
    plagiarism_checks INTEGER
)
LANGUAGE plpgsql
SET search_path = ''  -- 🔒 SECURITY FIX: Set fixed search path
AS $$
DECLARE
    current_month VARCHAR(7);
BEGIN
    current_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    RETURN QUERY
    SELECT 
        COALESCE(u.sops_created, 0),
        COALESCE(u.ai_improvements_used, 0),
        COALESCE(u.analytics_generated, 0),
        COALESCE(u.plagiarism_checks, 0)
    FROM public.user_usage u
    WHERE u.user_id = user_uuid AND u.month_year = current_month
    UNION ALL
    SELECT 0, 0, 0, 0
    WHERE NOT EXISTS (
        SELECT 1 FROM public.user_usage u2 
        WHERE u2.user_id = user_uuid AND u2.month_year = current_month
    )
    LIMIT 1;
END;
$$;

-- ========================================
-- FIX 4: log_preference_changes
-- ========================================
CREATE OR REPLACE FUNCTION log_preference_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''  -- 🔒 SECURITY FIX: Set fixed search path
AS $$
BEGIN
    INSERT INTO public.user_activity (
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
$$;

-- ========================================
-- FIX 5: auto_create_calendar_reminders
-- ========================================
CREATE OR REPLACE FUNCTION auto_create_calendar_reminders()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''  -- 🔒 SECURITY FIX: Set fixed search path
AS $$
DECLARE
    user_prefs RECORD;
    deadline_date TIMESTAMPTZ;
    scholarship_info RECORD;
BEGIN
    -- Get user preferences
    SELECT * INTO user_prefs 
    FROM public.user_preferences 
    WHERE user_id = NEW.user_id;
    
    -- Skip if calendar not enabled
    IF user_prefs.calendar_enabled != true THEN
        RETURN NEW;
    END IF;
    
    -- Get scholarship details
    SELECT * INTO scholarship_info
    FROM public.scholarships 
    WHERE id = NEW.scholarship_id;
    
    IF scholarship_info.deadline IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Insert calendar event placeholder (will be synced later)
    INSERT INTO public.calendar_events (
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
$$;

-- ========================================
-- FIX 6: get_users_needing_reminders (CRITICAL - Uses auth.users)
-- ========================================
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
)
LANGUAGE plpgsql
SET search_path = ''  -- 🔒 SECURITY FIX: Set fixed search path
AS $$
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
    FROM public.user_scholarship_interactions usi
    JOIN auth.users au ON usi.user_id = au.id  -- 🔒 SECURITY NOTE: Explicit auth schema reference
    JOIN public.scholarships s ON usi.scholarship_id = s.id
    LEFT JOIN public.user_preferences up ON usi.user_id = up.user_id
    WHERE s.deadline >= NOW()
      AND s.deadline <= NOW() + INTERVAL '31 days'
      AND usi.status IN ('interested', 'applied')
      AND EXTRACT(DAYS FROM (s.deadline - NOW())) = ANY(COALESCE(up.reminder_days, ARRAY[30, 14, 7, 3, 1]))
      AND COALESCE(up.email_enabled, true) = true
      AND COALESCE(up.email_deadlines, true) = true
    ORDER BY s.deadline ASC;
END;
$$; 