-- =============================================================================
-- Fix Supabase Advisor warnings: Function Search Path Mutable
-- Sets search_path = public on all listed functions so the linter is satisfied.
-- Run in Supabase SQL Editor or via supabase db push
-- =============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND p.proname IN (
        'can_manage_blog', 'update_sops_updated_at', 'set_updated_at', 'update_lesson_updated_at',
        'update_student_progress', 'update_school_student_count', 'calculate_student_level',
        'get_city_cost_data', 'calculate_reading_time', 'get_recommended_lessons',
        'get_business_user_by_email', 'update_class_student_count', 'register_school_unified',
        'update_updated_at_column', 'register_school_simple', 'update_trial_status',
        'check_trial_usage_limit', 'check_class_capacity', 'get_available_classes',
        'refresh_user_session', 'get_admin_users', 'force_session_refresh', 'add_user_to_school',
        'check_teacher_schedule_conflict', 'calculate_profile_completion', 'update_profile_completion',
        'verify_business_password', 'calculate_standardized_gpa', 'update_standardized_gpa',
        'register_business_school', 'is_admin', 'can_manage_admins', 'can_manage_scholarships',
        'can_access_analytics', 'can_manage_content', 'add_admin_user', 'remove_admin_user'
      )
      AND (p.proconfig IS NULL OR NOT (p.proconfig::text LIKE '%search_path%'))
  LOOP
    EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public', r.proname, r.args);
  END LOOP;
END $$;
