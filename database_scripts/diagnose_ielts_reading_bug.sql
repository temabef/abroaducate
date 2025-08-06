-- Diagnostic script to identify IELTS Reading bug
-- This will help us understand why questions and options are mixed up

-- ==================================================
-- STEP 1: Check current table structure
-- ==================================================

-- Check practice_choices table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'practice_choices' 
ORDER BY ordinal_position;

-- ==================================================
-- STEP 2: Check current IELTS reading data
-- ==================================================

-- Find IELTS test
SELECT 'IELTS Test:' as info, id, slug, name FROM practice_tests WHERE slug = 'ielts';

-- Find IELTS reading sets
SELECT 'IELTS Reading Sets:' as info, id, title, section, sort_order FROM practice_sets 
WHERE test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts') 
AND section = 'reading'
ORDER BY sort_order;

-- Check questions for each set
DO $$
DECLARE
    set_record RECORD;
    question_count INTEGER;
    choice_count INTEGER;
BEGIN
    FOR set_record IN 
        SELECT id, title 
        FROM practice_sets 
        WHERE test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts') 
        AND section = 'reading'
        ORDER BY sort_order
    LOOP
        RAISE NOTICE '=== Set: % ===', set_record.title;
        
        -- Count questions in this set
        SELECT COUNT(*) INTO question_count 
        FROM practice_questions 
        WHERE set_id = set_record.id;
        
        RAISE NOTICE 'Questions in set: %', question_count;
        
        -- Show each question and its choices
        FOR question_record IN 
            SELECT id, question_text, sort_order, question_type
            FROM practice_questions 
            WHERE set_id = set_record.id
            ORDER BY sort_order
        LOOP
            RAISE NOTICE 'Question %: %', question_record.sort_order, question_record.question_text;
            
            -- Count choices for this question
            SELECT COUNT(*) INTO choice_count 
            FROM practice_choices 
            WHERE question_id = question_record.id;
            
            RAISE NOTICE '  Choices for this question: %', choice_count;
            
            -- Show each choice
            FOR choice_record IN 
                SELECT id, choice_text, is_correct, choice_letter
                FROM practice_choices 
                WHERE question_id = question_record.id
                ORDER BY id
            LOOP
                RAISE NOTICE '    Choice: % (Correct: %)', choice_record.choice_text, choice_record.is_correct;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- ==================================================
-- STEP 3: Check for data inconsistencies
-- ==================================================

-- Check if there are orphaned choices (choices without questions)
SELECT 'Orphaned Choices:' as info, COUNT(*) as count
FROM practice_choices pc
LEFT JOIN practice_questions pq ON pc.question_id = pq.id
WHERE pq.id IS NULL;

-- Check if there are questions without choices
SELECT 'Questions without choices:' as info, COUNT(*) as count
FROM practice_questions pq
LEFT JOIN practice_choices pc ON pq.id = pc.question_id
WHERE pc.id IS NULL
AND pq.set_id IN (
    SELECT id FROM practice_sets 
    WHERE test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts') 
    AND section = 'reading'
);

-- Check for duplicate choice IDs
SELECT 'Duplicate choice IDs:' as info, id, COUNT(*) as count
FROM practice_choices
GROUP BY id
HAVING COUNT(*) > 1;

-- Check for questions with wrong number of choices
SELECT 'Questions with wrong choice count:' as info, 
       pq.id, 
       pq.question_text, 
       COUNT(pc.id) as choice_count,
       pq.question_type
FROM practice_questions pq
LEFT JOIN practice_choices pc ON pq.id = pc.question_id
WHERE pq.set_id IN (
    SELECT id FROM practice_sets 
    WHERE test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts') 
    AND section = 'reading'
)
GROUP BY pq.id, pq.question_text, pq.question_type
HAVING 
    (pq.question_type = 'true_false' AND COUNT(pc.id) != 2) OR
    (pq.question_type = 'multiple_choice' AND COUNT(pc.id) != 4);

-- ==================================================
-- STEP 4: Show complete data for debugging
-- ==================================================

-- Show all IELTS reading questions with their choices
SELECT 
    'Complete Data:' as info,
    ps.title as set_title,
    pq.sort_order as question_order,
    pq.question_text,
    pq.question_type,
    pc.choice_text,
    pc.is_correct,
    pc.id as choice_id
FROM practice_sets ps
JOIN practice_questions pq ON ps.id = pq.set_id
LEFT JOIN practice_choices pc ON pq.id = pc.question_id
WHERE ps.test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts')
AND ps.section = 'reading'
ORDER BY ps.sort_order, pq.sort_order, pc.id; 