-- Fix constraint for Advertised Position application_method

-- First, check current constraint
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'scholarships'::regclass
AND conname = 'valid_application_method';

-- Drop the constraint
ALTER TABLE scholarships DROP CONSTRAINT IF EXISTS valid_application_method;

-- Recreate with all valid values including "Apply Online"
ALTER TABLE scholarships ADD CONSTRAINT valid_application_method 
CHECK (application_method IS NULL OR application_method IN (
    'Direct Apply', 
    'Contact Professor First', 
    'Apply Online',
    'Email Application',
    'Portal Application'
));

-- Test inserting an Advertised Position scholarship
INSERT INTO scholarships (
    title, 
    provider,
    amount, 
    deadline,
    location,
    field,
    level,
    type,
    description, 
    funding_category, 
    university_name,
    professor_name,
    professor_email,
    funding_type,
    application_method,
    position_details,
    is_active
) VALUES (
    'Test Advertised Position', 
    'Test University',
    '$50,000/year',
    '2024-12-31',
    'United States',
    'Computer Science',
    'PhD',
    'Research-based',
    'Test position',
    'Advertised Position', 
    'Test University',
    'Dr. Test Professor',
    'test@test.edu',
    'RA',
    'Apply Online',
    'Test research position',
    true
);

-- If successful, delete the test record
DELETE FROM scholarships WHERE title = 'Test Advertised Position';

-- Show table structure to help with CSV mapping
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'scholarships' 
ORDER BY ordinal_position; 