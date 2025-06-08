# URGENT: Database Schema Fix for SOP Generation

## Problem
SOP generation is failing with error: `"Could not find the 'content' column of 'sops' in the schema cache"`

## Solution
Your database schema needs to be updated. Follow these steps:

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**

### Step 2: Run this SQL Script
Copy and paste this entire script and click "Run":

```sql
-- Fix database schema for SOP generation
-- Add missing columns if they don't exist

-- Check current structure
SELECT 'Current sops table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sops' 
ORDER BY ordinal_position;

-- Add missing columns
ALTER TABLE sops 
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS original_content TEXT,
ADD COLUMN IF NOT EXISTS word_count INTEGER,
ADD COLUMN IF NOT EXISTS form_data JSONB,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS university_name TEXT,
ADD COLUMN IF NOT EXISTS program_name TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS application_deadline DATE,
ADD COLUMN IF NOT EXISTS application_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS submission_date DATE,
ADD COLUMN IF NOT EXISTS application_notes TEXT,
ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]';

-- Copy data from old columns to new ones if they exist
UPDATE sops 
SET content = COALESCE(content, generated_sop),
    original_content = COALESCE(original_content, generated_sop),
    university_name = COALESCE(university_name, university),
    program_name = COALESCE(program_name, program)
WHERE (generated_sop IS NOT NULL OR university IS NOT NULL OR program IS NOT NULL);

-- Set default values for empty records
UPDATE sops SET 
    content = COALESCE(content, 'Generated SOP content'),
    university_name = COALESCE(university_name, 'Unknown University'),
    program_name = COALESCE(program_name, 'Unknown Program')
WHERE content IS NULL OR university_name IS NULL OR program_name IS NULL;

-- Make required columns NOT NULL
ALTER TABLE sops 
ALTER COLUMN content SET NOT NULL,
ALTER COLUMN university_name SET NOT NULL,
ALTER COLUMN program_name SET NOT NULL;

-- Add status constraint
DO $$ 
BEGIN
    ALTER TABLE sops ADD CONSTRAINT sops_status_check 
    CHECK (status IN ('draft', 'final', 'submitted'));
EXCEPTION 
    WHEN duplicate_object THEN null;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sops_user_id ON sops(user_id);
CREATE INDEX IF NOT EXISTS idx_sops_created_at ON sops(created_at);
CREATE INDEX IF NOT EXISTS idx_sops_updated_at ON sops(updated_at);
CREATE INDEX IF NOT EXISTS idx_sops_application_deadline ON sops(application_deadline);

-- Enable RLS if not already enabled
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;

-- Add RLS policies if they don't exist
DO $$
BEGIN
    -- Policy for SELECT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sops' AND policyname = 'Users can only access their own SOPs'
    ) THEN
        CREATE POLICY "Users can only access their own SOPs" ON sops
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Show final structure
SELECT 'Updated sops table structure:' as result;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'sops' 
ORDER BY ordinal_position;

SELECT 'Schema fix completed!' as status;
```

### Step 3: Verify the Fix
After running the script, you should see:
- A list of all columns in the sops table
- "Schema fix completed!" message

### Step 4: Test SOP Generation
1. Go back to your app
2. Fill out the SOP form
3. Click "Generate SOP"
4. It should now work without getting stuck!

## What This Fixes
- Adds all missing database columns
- Migrates data from old column names to new ones
- Sets up proper constraints and indexes
- Refreshes the database schema cache

## If You Still Have Issues
If you continue to have problems after running this script:

1. Check the browser console for any new error messages
2. Try refreshing your application completely
3. Clear browser cache and cookies
4. Contact support with the new error details

## Alternative Quick Fix
If you can't access Supabase SQL Editor right now, you can temporarily restart your development server to clear any cached connections:

```bash
# Stop the dev server (Ctrl+C)
# Then restart it
npm run dev
```

But you'll still need to run the database migration to permanently fix the issue. 