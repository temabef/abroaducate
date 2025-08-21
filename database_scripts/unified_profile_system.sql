-- Unified Profile System
-- Extend the existing user_quick_profile table to support both scholarship and university matching systems
-- This ensures users only need to fill their profile once for both systems

-- Add new columns to support university matching system
ALTER TABLE public.user_quick_profile 
ADD COLUMN IF NOT EXISTS gpa DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS value_approach TEXT CHECK (value_approach IN ('maximum_savings', 'value_for_money', 'scholarship_hunter', 'investment_focused')),
ADD COLUMN IF NOT EXISTS qualities TEXT[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS research_interest TEXT;

-- Add comments for the new columns
COMMENT ON COLUMN public.user_quick_profile.gpa IS 'User GPA on 4.0 scale (for university matching)';
COMMENT ON COLUMN public.user_quick_profile.value_approach IS 'User approach to value (for university matching)';
COMMENT ON COLUMN public.user_quick_profile.qualities IS 'Array of qualities user values in universities';
COMMENT ON COLUMN public.user_quick_profile.research_interest IS 'Research interests (for university matching)';

-- Update the table comment
COMMENT ON TABLE public.user_quick_profile IS 'Unified user profile for both scholarship matching and university matching systems';

-- Create a function to populate GPA from gpa_range for existing records
CREATE OR REPLACE FUNCTION populate_gpa_from_range()
RETURNS void AS $$
BEGIN
    UPDATE public.user_quick_profile 
    SET gpa = CASE 
        WHEN gpa_range = '<2.5' THEN 2.25
        WHEN gpa_range = '2.5-3.0' THEN 2.75
        WHEN gpa_range = '3.0-3.5' THEN 3.25
        WHEN gpa_range = '3.5-4.0' THEN 3.75
        ELSE 3.0
    END
    WHERE gpa IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Run the function to populate existing records
SELECT populate_gpa_from_range();

-- Drop the function after use
DROP FUNCTION populate_gpa_from_range();

-- Create a view for backward compatibility with scholarship system
CREATE OR REPLACE VIEW scholarship_profile AS
SELECT 
    user_id,
    degree_level,
    field_of_study,
    preferred_countries,
    gpa_range,
    scholarship_priority,
    created_at,
    updated_at
FROM public.user_quick_profile;

-- Create a view for university matching system
CREATE OR REPLACE VIEW university_profile AS
SELECT 
    user_id,
    gpa,
    field_of_study,
    degree_level,
    value_approach,
    scholarship_priority,
    qualities,
    preferred_countries,
    research_interest,
    created_at,
    updated_at
FROM public.user_quick_profile;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_quick_profile_gpa ON public.user_quick_profile(gpa);
CREATE INDEX IF NOT EXISTS idx_user_quick_profile_value_approach ON public.user_quick_profile(value_approach);
CREATE INDEX IF NOT EXISTS idx_user_quick_profile_qualities ON public.user_quick_profile USING GIN(qualities);

-- Grant permissions on the views
GRANT SELECT ON scholarship_profile TO authenticated;
GRANT SELECT ON university_profile TO authenticated;
