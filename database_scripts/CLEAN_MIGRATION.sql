-- Migration: Add edit tracking to SOPs table
-- Add new columns to track edits
ALTER TABLE sops 
ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;

-- Add index for better performance on updated_at
CREATE INDEX IF NOT EXISTS idx_sops_updated_at ON sops(updated_at);

-- Add index for user queries
CREATE INDEX IF NOT EXISTS idx_sops_user_updated ON sops(user_id, updated_at DESC);

-- Update existing rows to set updated_at to created_at if not set
UPDATE sops 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    -- Set is_edited to true if generated_sop has changed
    IF OLD.generated_sop IS DISTINCT FROM NEW.generated_sop THEN
        NEW.is_edited = TRUE;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_sops_updated_at ON sops;
CREATE TRIGGER update_sops_updated_at 
    BEFORE UPDATE ON sops 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- Add RLS policies for the new functionality
-- Allow users to update their own SOPs
CREATE POLICY "Users can update own sops" ON sops
    FOR UPDATE USING (auth.uid() = user_id); 