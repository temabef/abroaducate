-- Fix for get_application_dashboard function
-- Add SET search_path = '' to secure the function

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
SET search_path = ''  -- 🔒 SECURITY FIX: Set fixed search path
AS $$
DECLARE
    sop_id_type text;
BEGIN
    -- Get the actual data type of sops.id to return correct type
    SELECT data_type INTO sop_id_type 
    FROM information_schema.columns 
    WHERE table_name = 'sops' AND column_name = 'id';
    
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
    FROM public.sops s  -- 🔒 SECURITY FIX: Explicitly specify schema
    WHERE s.user_id = user_uuid
    ORDER BY 
        CASE WHEN s.application_deadline IS NULL THEN 1 ELSE 0 END,
        s.application_deadline ASC,
        s.updated_at DESC;
END;
$$; 