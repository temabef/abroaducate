-- Check the question_type constraint on practice_questions table
-- This will help us understand what values are allowed

-- Check the constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'practice_questions'::regclass 
AND contype = 'c';

-- Check what question_type values currently exist
SELECT DISTINCT question_type, COUNT(*) as count
FROM practice_questions
GROUP BY question_type
ORDER BY question_type;

-- Check if there are any existing true/false questions with different naming
SELECT DISTINCT question_type, COUNT(*) as count
FROM practice_questions
WHERE question_type ILIKE '%true%' OR question_type ILIKE '%false%'
GROUP BY question_type; 