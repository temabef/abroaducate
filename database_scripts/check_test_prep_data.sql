-- ========================================
-- CHECK TEST PREP DATA - DIAGNOSTIC SCRIPT
-- ========================================
-- Run this in Supabase SQL Editor to diagnose test prep issues

-- 1. Check if practice_sets table exists
SELECT 
  'practice_sets_exists' as check_type,
  COUNT(*) as exists
FROM information_schema.tables 
WHERE table_name = 'practice_sets';

-- 2. Check practice_sets structure
SELECT 
  'practice_sets_columns' as check_type,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'practice_sets'
ORDER BY ordinal_position;

-- 3. Check practice_sets data count
SELECT 
  'practice_sets_count' as check_type,
  COUNT(*) as total_sets
FROM practice_sets;

-- 4. Show all practice_sets data
SELECT 
  'practice_sets_all' as check_type,
  id,
  title,
  section,
  sort_order
FROM practice_sets
ORDER BY section, sort_order;

-- 5. Check practice_questions table exists
SELECT 
  'practice_questions_exists' as check_type,
  COUNT(*) as exists
FROM information_schema.tables 
WHERE table_name = 'practice_questions';

-- 6. Check practice_questions structure
SELECT 
  'practice_questions_columns' as check_type,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'practice_questions'
ORDER BY ordinal_position;

-- 7. Check practice_questions data count
SELECT 
  'practice_questions_count' as check_type,
  COUNT(*) as total_questions
FROM practice_questions;

-- 8. Show sample practice_questions data
SELECT 
  'practice_questions_sample' as check_type,
  id,
  set_id,
  question_text,
  question_type,
  sort_order
FROM practice_questions
ORDER BY set_id, sort_order
LIMIT 10;

-- 9. Check practice_choices table exists
SELECT 
  'practice_choices_exists' as check_type,
  COUNT(*) as exists
FROM information_schema.tables 
WHERE table_name = 'practice_choices';

-- 10. Check practice_choices data count
SELECT 
  'practice_choices_count' as check_type,
  COUNT(*) as total_choices
FROM practice_choices;

-- 11. Show sample practice_choices data
SELECT 
  'practice_choices_sample' as check_type,
  id,
  question_id,
  choice_text,
  is_correct,
  sort_order
FROM practice_choices
ORDER BY question_id, sort_order
LIMIT 10;

-- 12. Test the exact query that the CMS uses
SELECT 
  'cms_query_test' as check_type,
  ps.id,
  ps.title,
  ps.section,
  ps.sort_order,
  COUNT(pq.id) as question_count
FROM practice_sets ps
LEFT JOIN practice_questions pq ON ps.id = pq.set_id
GROUP BY ps.id, ps.title, ps.section, ps.sort_order
ORDER BY ps.section, ps.sort_order;

SELECT 'Test prep data check completed!' as final_status; 