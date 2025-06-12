-- 🔧 DEBUG AND FIX FUNCTIONS - Comprehensive Approach
-- First drop, then recreate with security fixes

-- ========================================
-- STEP 1: Drop all problematic functions first
-- ========================================

-- Drop update_updated_at_column (might have multiple versions)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop create_default_subscription
DROP FUNCTION IF EXISTS create_default_subscription() CASCADE;

-- Drop get_current_usage (with parameter)
DROP FUNCTION IF EXISTS get_current_usage(UUID) CASCADE;

-- Drop log_preference_changes
DROP FUNCTION IF EXISTS log_preference_changes() CASCADE;

-- Drop auto_create_calendar_reminders
DROP FUNCTION IF EXISTS auto_create_calendar_reminders() CASCADE;

-- Drop get_users_needing_reminders
DROP FUNCTION IF EXISTS get_users_needing_reminders() CASCADE;

-- Drop get_application_dashboard (with parameter)
DROP FUNCTION IF EXISTS get_application_dashboard(UUID) CASCADE;

-- Drop get_user_sop_stats (with parameter)  
DROP FUNCTION IF EXISTS get_user_sop_stats(UUID) CASCADE;

-- Drop increment_usage (multiple versions with different signatures)
DROP FUNCTION IF EXISTS increment_usage(UUID, TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS increment_usage(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS increment_usage() CASCADE;

-- ========================================
-- STEP 2: Recreate all functions with security fixes
-- ========================================

-- FIX 1: update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- FIX 2: create_default_subscription
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    BEGIN
        INSERT INTO public.user_subscriptions (user_id, plan_type, status)
        VALUES (NEW.id, 'free', 'active');
    EXCEPTION WHEN unique_violation THEN
        NULL;
    END;
    RETURN NEW;
END;
$$;

-- FIX 3: get_current_usage
CREATE OR REPLACE FUNCTION get_current_usage(user_uuid UUID)
RETURNS TABLE (
    sops_created INTEGER,
    ai_improvements_used INTEGER,
    analytics_generated INTEGER,
    plagiarism_checks INTEGER
)
LANGUAGE plpgsql
SET search_path = ''
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

-- FIX 4: log_preference_changes
CREATE OR REPLACE FUNCTION log_preference_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
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

-- FIX 5: auto_create_calendar_reminders
CREATE OR REPLACE FUNCTION auto_create_calendar_reminders()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    user_prefs RECORD;
    scholarship_info RECORD;
BEGIN
    SELECT * INTO user_prefs 
    FROM public.user_preferences 
    WHERE user_id = NEW.user_id;
    
    IF user_prefs.calendar_enabled != true THEN
        RETURN NEW;
    END IF;
    
    SELECT * INTO scholarship_info
    FROM public.scholarships 
    WHERE id = NEW.scholarship_id;
    
    IF scholarship_info.deadline IS NULL THEN
        RETURN NEW;
    END IF;
    
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
        scholarship_info.deadline - INTERVAL '2 hours',
        scholarship_info.deadline,
        'pending'
    ) ON CONFLICT (user_id, external_event_id, calendar_provider) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- FIX 6: get_users_needing_reminders
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
SET search_path = ''
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
    JOIN auth.users au ON usi.user_id = au.id
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

-- FIX 7: get_application_dashboard
CREATE OR REPLACE FUNCTION get_application_dashboard(user_uuid UUID)
RETURNS TABLE (
    sop_id BIGINT,
    university_name TEXT,
    program_name TEXT,
    country TEXT,
    program_type TEXT,
    application_deadline DATE,
    status TEXT,
    word_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    days_until_deadline INTEGER,
    deadline_status TEXT
)
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id::BIGINT as sop_id,
        s.university_name,
        s.program_name,
        s.country,
        s.program_type,
        s.application_deadline,
        s.status,
        s.word_count,
        s.created_at,
        s.updated_at,
        CASE 
            WHEN s.application_deadline IS NULL THEN NULL
            ELSE (s.application_deadline - CURRENT_DATE)::INTEGER
        END as days_until_deadline,
        CASE 
            WHEN s.application_deadline IS NULL THEN 'no_deadline'
            WHEN s.application_deadline < CURRENT_DATE THEN 'overdue'
            WHEN s.application_deadline <= CURRENT_DATE + INTERVAL '30 days' THEN 'urgent'
            WHEN s.application_deadline <= CURRENT_DATE + INTERVAL '90 days' THEN 'upcoming'
            ELSE 'distant'
        END as deadline_status
    FROM public.sops s
    WHERE s.user_id = user_uuid
    ORDER BY 
        CASE WHEN s.application_deadline IS NULL THEN 1 ELSE 0 END,
        s.application_deadline ASC,
        s.updated_at DESC;
END;
$$;

-- FIX 8: get_user_sop_stats
CREATE OR REPLACE FUNCTION get_user_sop_stats(user_uuid UUID)
RETURNS TABLE (
    total_sops INTEGER,
    draft_sops INTEGER,
    final_sops INTEGER,
    submitted_applications INTEGER,
    pending_deadlines INTEGER,
    overdue_deadlines INTEGER,
    countries_applied INTEGER,
    avg_word_count INTEGER,
    most_recent_activity TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_sops,
        COUNT(*) FILTER (WHERE status = 'draft')::INTEGER as draft_sops,
        COUNT(*) FILTER (WHERE status = 'final')::INTEGER as final_sops,
        COUNT(*) FILTER (WHERE application_submitted = true)::INTEGER as submitted_applications,
        COUNT(*) FILTER (WHERE application_deadline >= CURRENT_DATE AND application_submitted = false)::INTEGER as pending_deadlines,
        COUNT(*) FILTER (WHERE application_deadline < CURRENT_DATE AND application_submitted = false)::INTEGER as overdue_deadlines,
        COUNT(DISTINCT country)::INTEGER as countries_applied,
        AVG(word_count)::INTEGER as avg_word_count,
        MAX(updated_at) as most_recent_activity
    FROM public.sops
    WHERE user_id = user_uuid;
END;
$$;

-- FIX 9: increment_usage (main version)
CREATE OR REPLACE FUNCTION increment_usage(
    user_uuid UUID,
    usage_type TEXT,
    increment_by INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    current_month DATE := DATE_TRUNC('month', CURRENT_DATE);
BEGIN
    IF user_uuid != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: Cannot modify usage for other users';
    END IF;

    INSERT INTO public.user_usage (user_id, month, sops_created, ai_improvements_used, analytics_generated, plagiarism_checks)
    VALUES (
        user_uuid,
        current_month,
        CASE WHEN usage_type = 'sops_created' THEN increment_by ELSE 0 END,
        CASE WHEN usage_type = 'ai_improvements_used' THEN increment_by ELSE 0 END,
        CASE WHEN usage_type = 'analytics_generated' THEN increment_by ELSE 0 END,
        CASE WHEN usage_type = 'plagiarism_checks' THEN increment_by ELSE 0 END
    )
    ON CONFLICT (user_id, month) DO UPDATE SET
        sops_created = public.user_usage.sops_created + 
            CASE WHEN usage_type = 'sops_created' THEN increment_by ELSE 0 END,
        ai_improvements_used = public.user_usage.ai_improvements_used + 
            CASE WHEN usage_type = 'ai_improvements_used' THEN increment_by ELSE 0 END,
        analytics_generated = public.user_usage.analytics_generated + 
            CASE WHEN usage_type = 'analytics_generated' THEN increment_by ELSE 0 END,
        plagiarism_checks = public.user_usage.plagiarism_checks + 
            CASE WHEN usage_type = 'plagiarism_checks' THEN increment_by ELSE 0 END,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$; 