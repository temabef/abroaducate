-- ========================================
-- ADD SAMPLE TEST PREP DATA
-- ========================================
-- Run this in Supabase SQL Editor to add sample test prep content

-- Check if we have any practice sets
SELECT 'Current practice sets count:' as info, COUNT(*) as count FROM practice_sets;

-- If no practice sets exist, add sample data
INSERT INTO practice_sets (id, title, section, sort_order)
SELECT 
  gen_random_uuid(),
  'IELTS Reading Practice Set 1',
  'reading',
  1
WHERE NOT EXISTS (SELECT 1 FROM practice_sets WHERE section = 'reading' LIMIT 1);

INSERT INTO practice_sets (id, title, section, sort_order)
SELECT 
  gen_random_uuid(),
  'IELTS Reading Practice Set 2',
  'reading',
  2
WHERE NOT EXISTS (SELECT 1 FROM practice_sets WHERE section = 'reading' AND sort_order = 2);

INSERT INTO practice_sets (id, title, section, sort_order)
SELECT 
  gen_random_uuid(),
  'IELTS Writing Task 1 Practice',
  'writing',
  1
WHERE NOT EXISTS (SELECT 1 FROM practice_sets WHERE section = 'writing' LIMIT 1);

INSERT INTO practice_sets (id, title, section, sort_order)
SELECT 
  gen_random_uuid(),
  'IELTS Writing Task 2 Practice',
  'writing',
  2
WHERE NOT EXISTS (SELECT 1 FROM practice_sets WHERE section = 'writing' AND sort_order = 2);

INSERT INTO practice_sets (id, title, section, sort_order)
SELECT 
  gen_random_uuid(),
  'IELTS Speaking Part 1 Practice',
  'speaking',
  1
WHERE NOT EXISTS (SELECT 1 FROM practice_sets WHERE section = 'speaking' LIMIT 1);

INSERT INTO practice_sets (id, title, section, sort_order)
SELECT 
  gen_random_uuid(),
  'IELTS Speaking Part 2 Practice',
  'speaking',
  2
WHERE NOT EXISTS (SELECT 1 FROM practice_sets WHERE section = 'speaking' AND sort_order = 2);

-- Add sample questions for the first reading set
INSERT INTO practice_questions (id, set_id, question_text, question_type, sort_order)
SELECT 
  gen_random_uuid(),
  ps.id,
  'What is the main purpose of the passage?',
  'multiple_choice',
  1
FROM practice_sets ps 
WHERE ps.section = 'reading' AND ps.sort_order = 1
AND NOT EXISTS (SELECT 1 FROM practice_questions pq WHERE pq.set_id = ps.id LIMIT 1);

INSERT INTO practice_questions (id, set_id, question_text, question_type, sort_order)
SELECT 
  gen_random_uuid(),
  ps.id,
  'According to the passage, which of the following is TRUE?',
  'multiple_choice',
  2
FROM practice_sets ps 
WHERE ps.section = 'reading' AND ps.sort_order = 1
AND NOT EXISTS (SELECT 1 FROM practice_questions pq WHERE pq.set_id = ps.id AND pq.sort_order = 2);

-- Add sample choices for the first question
INSERT INTO practice_choices (id, question_id, choice_text, is_correct, sort_order)
SELECT 
  gen_random_uuid(),
  pq.id,
  'To inform readers about new technology',
  true,
  1
FROM practice_questions pq
JOIN practice_sets ps ON pq.set_id = ps.id
WHERE ps.section = 'reading' AND ps.sort_order = 1 AND pq.sort_order = 1
AND NOT EXISTS (SELECT 1 FROM practice_choices pc WHERE pc.question_id = pq.id LIMIT 1);

INSERT INTO practice_choices (id, question_id, choice_text, is_correct, sort_order)
SELECT 
  gen_random_uuid(),
  pq.id,
  'To persuade readers to buy a product',
  false,
  2
FROM practice_questions pq
JOIN practice_sets ps ON pq.set_id = ps.id
WHERE ps.section = 'reading' AND ps.sort_order = 1 AND pq.sort_order = 1
AND NOT EXISTS (SELECT 1 FROM practice_choices pc WHERE pc.question_id = pq.id AND pc.sort_order = 2);

INSERT INTO practice_choices (id, question_id, choice_text, is_correct, sort_order)
SELECT 
  gen_random_uuid(),
  pq.id,
  'To entertain readers with a story',
  false,
  3
FROM practice_questions pq
JOIN practice_sets ps ON pq.set_id = ps.id
WHERE ps.section = 'reading' AND ps.sort_order = 1 AND pq.sort_order = 1
AND NOT EXISTS (SELECT 1 FROM practice_choices pc WHERE pc.question_id = pq.id AND pc.sort_order = 3);

-- Show the results
SELECT 'Sample test prep data added successfully!' as status;

-- Show current practice sets
SELECT 
  'Current practice sets:' as info,
  id,
  title,
  section,
  sort_order
FROM practice_sets
ORDER BY section, sort_order;

-- Show current questions
SELECT 
  'Current questions:' as info,
  pq.id,
  ps.title as set_title,
  pq.question_text,
  pq.question_type,
  pq.sort_order
FROM practice_questions pq
JOIN practice_sets ps ON pq.set_id = ps.id
ORDER BY ps.section, ps.sort_order, pq.sort_order
LIMIT 10; 