-- Fix Database Errors (Manual Form + Table Structure)

-- First, check table structure (proper SQL commands instead of \d)
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'scholarships' 
ORDER BY ordinal_position;

-- Check existing constraints
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'scholarships'::regclass
AND contype = 'c';

-- Drop and recreate the problematic constraint with all valid values
ALTER TABLE scholarships DROP CONSTRAINT IF EXISTS valid_application_method;

-- Add the constraint with all required values
ALTER TABLE scholarships ADD CONSTRAINT valid_application_method 
CHECK (application_method IS NULL OR application_method IN (
    'Direct Apply', 
    'Contact Professor First', 
    'Advertised Position',
    'Apply Online',
    'Email Application',
    'Portal Application'
));

-- Also fix the funding_type constraint to include all possible values
ALTER TABLE scholarships DROP CONSTRAINT IF EXISTS valid_funding_type;

ALTER TABLE scholarships ADD CONSTRAINT valid_funding_type 
CHECK (funding_type IS NULL OR funding_type IN (
    'RA', 
    'TA', 
    'GA', 
    'Full Funding', 
    'Tuition Waiver', 
    'Mixed', 
    'Postdoc',
    'Fellowship',
    'Scholarship'
));

-- Ensure all graduate funding columns exist
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS funding_category TEXT DEFAULT 'Traditional Scholarship';
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS university_name TEXT;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS program_name TEXT;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS funding_type TEXT;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS application_method TEXT;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS professor_name TEXT;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS professor_email TEXT;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS position_details TEXT;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS has_automatic_funding BOOLEAN DEFAULT false;

-- Test inserting a sample record to verify constraints work
INSERT INTO scholarships (
    title, 
    description, 
    amount, 
    funding_category, 
    application_method, 
    funding_type,
    is_active
) VALUES (
    'Test Scholarship', 
    'Testing constraints', 
    5000, 
    'Graduate Program Funding', 
    'Direct Apply', 
    'RA',
    true
);

-- If successful, delete the test record
DELETE FROM scholarships WHERE title = 'Test Scholarship' AND description = 'Testing constraints'; 