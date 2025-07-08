-- Simple check of practice table structures
-- Run this first to see what columns exist

-- Check practice_tests table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'practice_tests'
ORDER BY ordinal_position;

-- Check practice_sets table columns  
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'practice_sets'
ORDER BY ordinal_position;

-- Check practice_questions table columns
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'practice_questions'  
ORDER BY ordinal_position;

-- Check practice_choices table columns
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'practice_choices'
ORDER BY ordinal_position;

-- Show existing data
SELECT * FROM practice_tests LIMIT 3;
SELECT * FROM practice_sets LIMIT 3;
SELECT * FROM practice_questions LIMIT 3;
SELECT * FROM practice_choices LIMIT 3; 