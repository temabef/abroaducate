-- ========================================
-- DEBUG TEST PREP LOADING ISSUE
-- ========================================
-- Run this in Supabase SQL Editor to diagnose the loading problem

-- 1. Check if practice_sets table exists and has data
SELECT 
  'practice_sets_check' as check_type,
  COUNT(*) as total_sets
FROM practice_sets;

-- 2. Show all practice sets
SELECT 
  'practice_sets_data' as check_type,
  id,
  title,
  section,
  sort_order
FROM practice_sets
ORDER BY section, sort_order;

-- 3. Check if practice_questions table exists and has data
SELECT 
  'practice_questions_check' as check_type,
  COUNT(*) as total_questions
FROM practice_questions;

-- 4. Show sample questions
SELECT 
  'practice_questions_sample' as check_type,
  id,
  set_id,
  question_text,
  question_type,
  sort_order
FROM practice_questions
ORDER BY set_id, sort_order
LIMIT 5;

-- 5. Test the exact query that the CMS should use
SELECT 
  'cms_query_simulation' as check_type,
  ps.id,
  ps.title,
  ps.section,
  ps.sort_order,
  COUNT(pq.id) as question_count
FROM practice_sets ps
LEFT JOIN practice_questions pq ON ps.id = pq.set_id
GROUP BY ps.id, ps.title, ps.section, ps.sort_order
ORDER BY ps.section, ps.sort_order;

-- 6. Check if there are any foreign key issues
SELECT 
  'foreign_key_check' as check_type,
  COUNT(*) as orphaned_questions
FROM practice_questions pq
LEFT JOIN practice_sets ps ON pq.set_id = ps.id
WHERE ps.id IS NULL;

SELECT 'Debug completed - check the results above!' as final_status; 