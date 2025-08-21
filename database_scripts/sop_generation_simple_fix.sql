-- Simple SOP Generation Database Fix
-- This script adds the essential columns needed for SOP generation to work

-- 1. Add essential columns that might be missing
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

-- 2. Copy data between columns if needed (for backward compatibility)
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

-- 3. Add safe indexes (avoiding large content indexing)
CREATE INDEX IF NOT EXISTS idx_sops_user_id ON sops(user_id);
CREATE INDEX IF NOT EXISTS idx_sops_created_at ON sops(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sops_updated_at ON sops(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_sops_word_count ON sops(word_count) WHERE word_count IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sops_status ON sops(status);

-- 4. Ensure RLS policies exist
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

-- 5. Create trigger for updated_at if it doesn't exist
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

-- 6. Show final status
SELECT 'Simple SOP Generation Database Fix Complete' as status;
