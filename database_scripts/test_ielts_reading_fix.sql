-- Test script to verify IELTS Reading fix
-- Run this after applying the main fix

-- ==================================================
-- STEP 1: Verify data structure
-- ==================================================

-- Check if we have the correct number of questions and choices
SELECT 
    'Data Verification:' as info,
    COUNT(DISTINCT pq.id) as questions,
    COUNT(pc.id) as total_choices,
    COUNT(pc.id) / COUNT(DISTINCT pq.id) as avg_choices_per_question
FROM practice_sets ps
JOIN practice_questions pq ON ps.id = pq.set_id
LEFT JOIN practice_choices pc ON pq.id = pc.question_id
WHERE ps.test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts')
AND ps.section = 'reading';

-- ==================================================
-- STEP 2: Check each question individually
-- ==================================================

-- Show each question with its choices
SELECT 
    'Question Details:' as info,
    pq.sort_order as question_number,
    pq.question_type,
    pq.question_text,
    COUNT(pc.id) as choice_count,
    STRING_AGG(pc.choice_text, ' | ' ORDER BY pc.sort_order) as choices
FROM practice_sets ps
JOIN practice_questions pq ON ps.id = pq.set_id
LEFT JOIN practice_choices pc ON pq.id = pc.question_id
WHERE ps.test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts')
AND ps.section = 'reading'
GROUP BY pq.sort_order, pq.question_type, pq.question_text
ORDER BY pq.sort_order;

-- ==================================================
-- STEP 3: Verify correct answers
-- ==================================================

-- Show correct answers for each question
SELECT 
    'Correct Answers:' as info,
    pq.sort_order as question_number,
    pq.question_text,
    pc.choice_text as correct_answer
FROM practice_sets ps
JOIN practice_questions pq ON ps.id = pq.set_id
JOIN practice_choices pc ON pq.id = pc.question_id
WHERE ps.test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts')
AND ps.section = 'reading'
AND pc.is_correct = true
ORDER BY pq.sort_order;

-- ==================================================
-- STEP 4: Test data integrity
-- ==================================================

-- Check for any questions without choices
SELECT 'Questions without choices:' as issue, COUNT(*) as count
FROM practice_sets ps
JOIN practice_questions pq ON ps.id = pq.set_id
LEFT JOIN practice_choices pc ON pq.id = pc.question_id
WHERE ps.test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts')
AND ps.section = 'reading'
AND pc.id IS NULL;

-- Check for questions with wrong number of choices
SELECT 
    'Questions with wrong choice count:' as issue,
    pq.sort_order,
    pq.question_type,
    COUNT(pc.id) as actual_choices,
    CASE 
        WHEN pq.question_type = 'true_false' THEN 2
        WHEN pq.question_type = 'multiple_choice' THEN 4
        ELSE 'unknown'
    END as expected_choices
FROM practice_sets ps
JOIN practice_questions pq ON ps.id = pq.set_id
LEFT JOIN practice_choices pc ON pq.id = pc.question_id
WHERE ps.test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts')
AND ps.section = 'reading'
GROUP BY pq.sort_order, pq.question_type
HAVING 
    (pq.question_type = 'true_false' AND COUNT(pc.id) != 2) OR
    (pq.question_type = 'multiple_choice' AND COUNT(pc.id) != 4);

-- ==================================================
-- STEP 5: Final status
-- ==================================================

SELECT 'IELTS Reading Test Status:' as status,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ All tests passed - IELTS Reading should work correctly'
        ELSE '❌ Issues found - Check the results above'
    END as result
FROM (
    SELECT 1 as test
    FROM practice_sets ps
    JOIN practice_questions pq ON ps.id = pq.set_id
    LEFT JOIN practice_choices pc ON pq.id = pc.question_id
    WHERE ps.test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts')
    AND ps.section = 'reading'
    AND pc.id IS NULL
    
    UNION ALL
    
    SELECT 1 as test
    FROM practice_sets ps
    JOIN practice_questions pq ON ps.id = pq.set_id
    LEFT JOIN practice_choices pc ON pq.id = pc.question_id
    WHERE ps.test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts')
    AND ps.section = 'reading'
    GROUP BY pq.sort_order, pq.question_type
    HAVING 
        (pq.question_type = 'true_false' AND COUNT(pc.id) != 2) OR
        (pq.question_type = 'multiple_choice' AND COUNT(pc.id) != 4)
) as issues; 