-- Check the actual database structure for IELTS practice tables
-- This will help us understand what columns exist

-- Check if practice_tests table exists and its structure
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practice_tests') THEN
        RAISE NOTICE 'practice_tests table exists';
        RAISE NOTICE 'Columns in practice_tests:';
    ELSE
        RAISE NOTICE 'practice_tests table does NOT exist';
    END IF;
END $$;

-- Show all columns in practice_tests table
SELECT 
    'practice_tests columns:' as table_info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'practice_tests'
ORDER BY ordinal_position;

-- Check practice_sets table structure
SELECT 
    'practice_sets columns:' as table_info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'practice_sets'
ORDER BY ordinal_position;

-- Check practice_questions table structure  
SELECT 
    'practice_questions columns:' as table_info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'practice_questions'
ORDER BY ordinal_position;

-- Check practice_choices table structure
SELECT 
    'practice_choices columns:' as table_info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'practice_choices'
ORDER BY ordinal_position;

-- Check what data already exists
SELECT 'Existing practice_tests:' as info, * FROM practice_tests LIMIT 5;

SELECT 'Existing practice_sets:' as info, * FROM practice_sets LIMIT 5;

SELECT 'Existing practice_questions:' as info, * FROM practice_questions LIMIT 5;

SELECT 'Existing practice_choices:' as info, * FROM practice_choices LIMIT 5; 