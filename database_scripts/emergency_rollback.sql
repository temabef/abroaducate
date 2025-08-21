-- EMERGENCY ROLLBACK - Remove the problematic changes
-- This will restore the database to a working state

-- Drop the views we created
DROP VIEW IF EXISTS scholarship_profile;
DROP VIEW IF EXISTS university_profile;

-- Drop the indexes we added
DROP INDEX IF EXISTS idx_user_quick_profile_gpa;
DROP INDEX IF EXISTS idx_user_quick_profile_value_approach;
DROP INDEX IF EXISTS idx_user_quick_profile_qualities;

-- Remove the problematic CHECK constraint and columns
ALTER TABLE public.user_quick_profile 
DROP COLUMN IF EXISTS gpa,
DROP COLUMN IF EXISTS value_approach,
DROP COLUMN IF EXISTS qualities,
DROP COLUMN IF EXISTS research_interest;

-- Restore the original table comment
COMMENT ON TABLE public.user_quick_profile IS 'Quick Profile table for lightweight matching';

-- Remove any comments we added
COMMENT ON COLUMN public.user_quick_profile.gpa IS NULL;
COMMENT ON COLUMN public.user_quick_profile.value_approach IS NULL;
COMMENT ON COLUMN public.user_quick_profile.qualities IS NULL;
COMMENT ON COLUMN public.user_quick_profile.research_interest IS NULL;
