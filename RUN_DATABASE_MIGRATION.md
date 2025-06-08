# Database Migration Required

## Issue
The dashboard is showing "No SOP Generated Yet" because it's trying to fetch database columns that don't exist yet.

## Solution
Run the database migration to add the missing columns.

## Steps

### 1. Go to Supabase Dashboard
- Open your Supabase project dashboard
- Navigate to the **SQL Editor**

### 2. Run the Migration Script
Copy and paste the following SQL script and execute it:

```sql
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
```

### 3. Verify the Migration
Run this query to check if the new columns were added:

```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'sops' 
ORDER BY ordinal_position;
```

### 4. Update Dashboard Query
After running the migration, update the dashboard to fetch all fields:

In `src/routes/dashboard/+page.ts`, change line 14-16 from:
```typescript
.select('id, form_data, generated_sop') // Select core fields that exist
```

To:
```typescript
.select('id, form_data, generated_sop, edit_history, updated_at, is_edited') // Select all fields
```

## Expected Result
- Your existing SOPs should reappear on the dashboard
- Save functionality will work properly
- Edit tracking will be enabled

## Alternative Quick Fix
If you can't run the migration immediately, the dashboard should still work with existing SOPs using just the core fields. 