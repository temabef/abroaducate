-- Fix for get_user_sop_stats function
-- Add SET search_path = '' to secure the function

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
SET search_path = ''  -- 🔒 SECURITY FIX: Set fixed search path
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
    FROM public.sops  -- 🔒 SECURITY FIX: Explicitly specify schema
    WHERE user_id = user_uuid;
END;
$$; 