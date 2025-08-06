-- ========================================
-- FIX PRACTICE_CHOICES UPDATED_AT COLUMN
-- ========================================
-- This script adds the missing updated_at column to practice_choices table

-- Add updated_at column to practice_choices if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'practice_choices' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE practice_choices ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to practice_choices table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in practice_choices table';
    END IF;
END $$;

-- Create trigger to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_practice_choices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and recreate it
DROP TRIGGER IF EXISTS trigger_update_practice_choices_updated_at ON practice_choices;

CREATE TRIGGER trigger_update_practice_choices_updated_at
    BEFORE UPDATE ON practice_choices
    FOR EACH ROW
    EXECUTE FUNCTION update_practice_choices_updated_at();

-- Verify the column was added
SELECT 
    'practice_choices table structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'practice_choices' 
AND column_name IN ('id', 'question_id', 'choice_text', 'is_correct', 'sort_order', 'created_at', 'updated_at')
ORDER BY ordinal_position;

-- Show sample data to confirm structure
SELECT 
    'Sample practice_choices data' as info,
    COUNT(*) as total_choices,
    COUNT(CASE WHEN updated_at IS NOT NULL THEN 1 END) as choices_with_updated_at
FROM practice_choices; 