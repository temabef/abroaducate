-- Comprehensive SOP Generation Database Fix
-- This script ensures the sops table has all necessary columns for SOP generation to work

-- 1. First, let's check the current table structure
SELECT 'Current SOPs table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'sops' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Add all possible columns that might be needed
-- This ensures compatibility with any schema version

-- Core content columns
ALTER TABLE sops ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE sops ADD COLUMN IF NOT EXISTS original_content TEXT;
ALTER TABLE sops ADD COLUMN IF NOT EXISTS generated_sop TEXT;

-- University and program info
ALTER TABLE sops ADD COLUMN IF NOT EXISTS university_name TEXT;
ALTER TABLE sops ADD COLUMN IF NOT EXISTS program_name TEXT;
ALTER TABLE sops ADD COLUMN IF NOT EXISTS university TEXT;
ALTER TABLE sops ADD COLUMN IF NOT EXISTS program TEXT;

-- Metadata columns
ALTER TABLE sops ADD COLUMN IF NOT EXISTS word_count INTEGER;
ALTER TABLE sops ADD COLUMN IF NOT EXISTS form_data JSONB;
ALTER TABLE sops ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE sops ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Additional columns that might exist in different schemas
ALTER TABLE sops ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE sops ADD COLUMN IF NOT EXISTS application_deadline DATE;
ALTER TABLE sops ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sops ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;

-- 3. Copy data between columns if needed (for backward compatibility)
-- If content is empty but generated_sop has data, copy it
UPDATE sops 
SET content = generated_sop 
WHERE (content IS NULL OR content = '') AND generated_sop IS NOT NULL;

-- If original_content is empty but content has data, copy it
UPDATE sops 
SET original_content = content 
WHERE (original_content IS NULL OR original_content = '') AND content IS NOT NULL;

-- If university_name is empty but university has data, copy it
UPDATE sops 
SET university_name = university 
WHERE (university_name IS NULL OR university_name = '') AND university IS NOT NULL;

-- If program_name is empty but program has data, copy it
UPDATE sops 
SET program_name = program 
WHERE (program_name IS NULL OR program_name = '') AND program IS NOT NULL;

-- 4. Set NOT NULL constraints where appropriate
-- Note: We'll keep content nullable to avoid issues with existing data
-- The application logic will handle validation

-- 5. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sops_user_id ON sops(user_id);
CREATE INDEX IF NOT EXISTS idx_sops_created_at ON sops(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sops_updated_at ON sops(updated_at DESC);

-- Use GIN index for full-text search on content instead of btree
-- This handles large text content better
CREATE INDEX IF NOT EXISTS idx_sops_content_gin ON sops USING gin(to_tsvector('english', content)) WHERE content IS NOT NULL;

-- Add index on word_count for filtering
CREATE INDEX IF NOT EXISTS idx_sops_word_count ON sops(word_count) WHERE word_count IS NOT NULL;

-- 6. Ensure RLS policies exist
DO $$
BEGIN
    -- Check if RLS is enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'sops' AND rowsecurity = true
    ) THEN
        ALTER TABLE sops ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Create basic RLS policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sops' AND policyname = 'Users can access own sops'
    ) THEN
        CREATE POLICY "Users can access own sops" ON sops
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- 7. Create trigger for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_sops_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sops_updated_at ON sops;
CREATE TRIGGER trigger_update_sops_updated_at
    BEFORE UPDATE ON sops
    FOR EACH ROW
    EXECUTE FUNCTION update_sops_updated_at();

-- 8. Verify the fix
SELECT 'SOPs table structure after fix:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'sops' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. Test insert capability
DO $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000000';
    test_result RECORD;
BEGIN
    -- Try to insert a test record (will be rolled back)
    INSERT INTO sops (
        user_id, 
        content, 
        original_content, 
        university_name, 
        program_name, 
        word_count, 
        form_data, 
        status
    ) VALUES (
        test_user_id,
        'Test SOP content',
        'Test SOP content',
        'Test University',
        'Test Program',
        10,
        '{"test": "data"}'::jsonb,
        'draft'
    ) RETURNING * INTO test_result;
    
    -- If we get here, the insert worked
    RAISE NOTICE '✅ Database schema is working correctly for SOP generation';
    
    -- Rollback the test insert
    ROLLBACK;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Database schema issue: %', SQLERRM;
    ROLLBACK;
END $$;

-- 10. Show final status
SELECT 'SOP Generation Database Fix Complete' as status;
