-- Database Schema Fix for SOP Generation
-- Copy and paste this into your Supabase SQL Editor

-- Check current table structure
SELECT 'Current sops table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sops' 
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
ALTER TABLE sops 
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS original_content TEXT,
ADD COLUMN IF NOT EXISTS word_count INTEGER,
ADD COLUMN IF NOT EXISTS form_data JSONB,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS university_name TEXT,
ADD COLUMN IF NOT EXISTS program_name TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Copy data from generated_sop to content if it exists
UPDATE sops 
SET content = COALESCE(content, generated_sop),
    original_content = COALESCE(original_content, generated_sop)
WHERE generated_sop IS NOT NULL;

-- Make sure content is not null for existing records
UPDATE sops SET content = 'Generated SOP content' WHERE content IS NULL;

-- Add constraints
ALTER TABLE sops ALTER COLUMN content SET NOT NULL;
ALTER TABLE sops ALTER COLUMN university_name SET NOT NULL;
ALTER TABLE sops ALTER COLUMN program_name SET NOT NULL;

-- Add status check constraint if it doesn't exist
DO $$ 
BEGIN
    ALTER TABLE sops ADD CONSTRAINT sops_status_check 
    CHECK (status IN ('draft', 'final', 'submitted'));
EXCEPTION 
    WHEN duplicate_object THEN null;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_sops_user_id ON sops(user_id);
CREATE INDEX IF NOT EXISTS idx_sops_created_at ON sops(created_at);
CREATE INDEX IF NOT EXISTS idx_sops_updated_at ON sops(updated_at);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Schema update completed!' as result; 