-- Database Fix for SOP Generation Issue
-- Run this in your Supabase SQL Editor to fix the schema issue

-- First, let's check what columns exist in the current sops table
-- and add the missing ones if needed

-- Add content column if it doesn't exist (for new schema)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sops' AND column_name = 'content') THEN
        ALTER TABLE sops ADD COLUMN content TEXT;
    END IF;
END $$;

-- Add original_content column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sops' AND column_name = 'original_content') THEN
        ALTER TABLE sops ADD COLUMN original_content TEXT;
    END IF;
END $$;

-- Add word_count column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sops' AND column_name = 'word_count') THEN
        ALTER TABLE sops ADD COLUMN word_count INTEGER;
    END IF;
END $$;

-- Add form_data column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sops' AND column_name = 'form_data') THEN
        ALTER TABLE sops ADD COLUMN form_data JSONB;
    END IF;
END $$;

-- Add status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sops' AND column_name = 'status') THEN
        ALTER TABLE sops ADD COLUMN status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'submitted'));
    END IF;
END $$;

-- Add university_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sops' AND column_name = 'university_name') THEN
        ALTER TABLE sops ADD COLUMN university_name TEXT;
    END IF;
END $$;

-- Add program_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sops' AND column_name = 'program_name') THEN
        ALTER TABLE sops ADD COLUMN program_name TEXT;
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sops' AND column_name = 'updated_at') THEN
        ALTER TABLE sops ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- If there's a generated_sop column, copy its data to content column
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'sops' AND column_name = 'generated_sop') THEN
        UPDATE sops 
        SET content = generated_sop,
            original_content = COALESCE(original_content, generated_sop)
        WHERE content IS NULL AND generated_sop IS NOT NULL;
    END IF;
END $$;

-- Make content column NOT NULL if it has data
ALTER TABLE sops ALTER COLUMN content SET NOT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sops_user_id ON sops(user_id);
CREATE INDEX IF NOT EXISTS idx_sops_created_at ON sops(created_at);
CREATE INDEX IF NOT EXISTS idx_sops_updated_at ON sops(updated_at);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Show the current table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'sops' 
ORDER BY ordinal_position; 