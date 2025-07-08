-- Debug IELTS Practice Loading Issue
-- Run this to see exactly what data exists and identify problems

-- Check the practice_tests table
SELECT 'PRACTICE_TESTS' as table_name, * FROM practice_tests WHERE slug = 'ielts';

-- Check practice_sets 
SELECT 'PRACTICE_SETS' as table_name, 
       ps.id, ps.test_id, ps.section, ps.title, ps.sort_order,
       LENGTH(ps.passage) as passage_length
FROM practice_sets ps 
JOIN practice_tests pt ON ps.test_id = pt.id 
WHERE pt.slug = 'ielts';

-- Check practice_questions
SELECT 'PRACTICE_QUESTIONS' as table_name,
       pq.id, pq.set_id, pq.question_text, pq.sort_order,
       LENGTH(pq.explanation) as explanation_length
FROM practice_questions pq
JOIN practice_sets ps ON pq.set_id = ps.id
JOIN practice_tests pt ON ps.test_id = pt.id
WHERE pt.slug = 'ielts'
ORDER BY pq.sort_order;

-- Check practice_choices
SELECT 'PRACTICE_CHOICES' as table_name,
       pc.id, pc.question_id, pc.choice_text, pc.is_correct,
       pq.question_text as question_for_choice
FROM practice_choices pc
JOIN practice_questions pq ON pc.question_id = pq.id
JOIN practice_sets ps ON pq.set_id = ps.id
JOIN practice_tests pt ON ps.test_id = pt.id
WHERE pt.slug = 'ielts'
ORDER BY pq.sort_order, pc.choice_text;

-- Count summary
SELECT 
    'SUMMARY' as info,
    COUNT(DISTINCT pt.id) as tests,
    COUNT(DISTINCT ps.id) as sets,
    COUNT(DISTINCT pq.id) as questions,
    COUNT(pc.id) as total_choices
FROM practice_tests pt
LEFT JOIN practice_sets ps ON pt.id = ps.test_id
LEFT JOIN practice_questions pq ON ps.id = pq.set_id  
LEFT JOIN practice_choices pc ON pq.id = pc.question_id
WHERE pt.slug = 'ielts';

-- Check what the frontend query would see
SELECT 'FRONTEND_QUERY_SIMULATION' as info,
       pq.id, pq.question_text, pq.explanation,
       COUNT(pc.id) as choice_count
FROM practice_tests pt
JOIN practice_sets ps ON pt.id = ps.test_id
JOIN practice_questions pq ON ps.id = pq.set_id
LEFT JOIN practice_choices pc ON pq.id = pc.question_id
WHERE pt.slug = 'ielts' AND ps.section = 'reading'
GROUP BY pq.id, pq.question_text, pq.explanation
ORDER BY pq.sort_order; 