-- SIMPLE ROLLBACK - Remove only what exists
-- This will clean up any partial changes that were made

-- Drop the views we created (if they exist)
DROP VIEW IF EXISTS scholarship_profile;
DROP VIEW IF EXISTS university_profile;

-- Drop the indexes we added (if they exist)
DROP INDEX IF EXISTS idx_user_quick_profile_gpa;
DROP INDEX IF EXISTS idx_user_quick_profile_value_approach;
DROP INDEX IF EXISTS idx_user_quick_profile_qualities;

-- Check what columns actually exist and remove them
DO $$
BEGIN
    -- Check if gpa column exists and remove it
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_quick_profile' AND column_name = 'gpa') THEN
        ALTER TABLE public.user_quick_profile DROP COLUMN gpa;
    END IF;
    
    -- Check if value_approach column exists and remove it
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_quick_profile' AND column_name = 'value_approach') THEN
        ALTER TABLE public.user_quick_profile DROP COLUMN value_approach;
    END IF;
    
    -- Check if qualities column exists and remove it
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_quick_profile' AND column_name = 'qualities') THEN
        ALTER TABLE public.user_quick_profile DROP COLUMN qualities;
    END IF;
    
    -- Check if research_interest column exists and remove it
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_quick_profile' AND column_name = 'research_interest') THEN
        ALTER TABLE public.user_quick_profile DROP COLUMN research_interest;
    END IF;
END $$;

-- Restore the original table comment
COMMENT ON TABLE public.user_quick_profile IS 'Quick Profile table for lightweight matching';
