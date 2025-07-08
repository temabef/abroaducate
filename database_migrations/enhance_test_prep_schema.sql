-- Enhanced Test Prep Schema Migration
-- Supports multiple question types: reading, listening, writing, speaking
-- Created: $(date)

-- 1. Add passage column to practice_sets if it doesn't exist
ALTER TABLE practice_sets 
ADD COLUMN IF NOT EXISTS passage TEXT;

-- 2. Add question_type and additional metadata columns to practice_questions
ALTER TABLE practice_questions 
ADD COLUMN IF NOT EXISTS question_type VARCHAR(20) DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'essay', 'short_answer', 'speaking_prompt', 'listening_comprehension')),
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 3. Add sort_order to practice_choices if it doesn't exist
ALTER TABLE practice_choices 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_practice_sets_section ON practice_sets(section);
CREATE INDEX IF NOT EXISTS idx_practice_questions_question_type ON practice_questions(question_type);
CREATE INDEX IF NOT EXISTS idx_practice_questions_sort_order ON practice_questions(sort_order);
CREATE INDEX IF NOT EXISTS idx_practice_choices_sort_order ON practice_choices(sort_order);

-- 5. Add comments to document the enhanced schema
COMMENT ON COLUMN practice_sets.passage IS 'Reading passage for reading comprehension questions';
COMMENT ON COLUMN practice_questions.question_type IS 'Type of question: multiple_choice, essay, short_answer, speaking_prompt, listening_comprehension';
COMMENT ON COLUMN practice_questions.audio_url IS 'URL to audio file for listening questions';
COMMENT ON COLUMN practice_questions.metadata IS 'Additional question metadata (time limits, difficulty, etc.)';

-- 6. Insert additional practice tests for different test types
INSERT INTO practice_tests (slug, name, description)
VALUES 
  ('toefl', 'TOEFL', 'Test of English as a Foreign Language'),
  ('gre', 'GRE', 'Graduate Record Examinations'),
  ('gmat', 'GMAT', 'Graduate Management Admission Test')
ON CONFLICT (slug) DO NOTHING;

-- 7. Create sample listening and writing sets for IELTS
WITH ielts_test AS (
  SELECT id FROM practice_tests WHERE slug = 'ielts' LIMIT 1
)
INSERT INTO practice_sets (test_id, section, title, sort_order)
SELECT id, 'listening', 'IELTS Listening Practice Set 1', 10 FROM ielts_test
UNION ALL
SELECT id, 'writing', 'IELTS Writing Task 1 Practice', 20 FROM ielts_test  
UNION ALL
SELECT id, 'speaking', 'IELTS Speaking Part 1 Practice', 30 FROM ielts_test
ON CONFLICT DO NOTHING;

-- 8. Update existing questions to have proper question types
UPDATE practice_questions 
SET question_type = 'multiple_choice'
WHERE question_type IS NULL AND EXISTS (
  SELECT 1 FROM practice_choices WHERE practice_choices.question_id = practice_questions.id
);

UPDATE practice_questions 
SET question_type = 'essay'
WHERE question_type IS NULL 
AND NOT EXISTS (
  SELECT 1 FROM practice_choices WHERE practice_choices.question_id = practice_questions.id
)
AND EXISTS (
  SELECT 1 FROM practice_sets 
  WHERE practice_sets.id = practice_questions.set_id 
  AND practice_sets.section IN ('writing')
);

UPDATE practice_questions 
SET question_type = 'speaking_prompt'
WHERE question_type IS NULL 
AND NOT EXISTS (
  SELECT 1 FROM practice_choices WHERE practice_choices.question_id = practice_questions.id
)
AND EXISTS (
  SELECT 1 FROM practice_sets 
  WHERE practice_sets.id = practice_questions.set_id 
  AND practice_sets.section IN ('speaking')
);

-- 9. Add sample writing prompts
WITH writing_set AS (
  SELECT ps.id 
  FROM practice_sets ps 
  JOIN practice_tests pt ON ps.test_id = pt.id 
  WHERE pt.slug = 'ielts' AND ps.section = 'writing' 
  LIMIT 1
)
INSERT INTO practice_questions (set_id, question_text, explanation, question_type, sort_order)
SELECT 
  id,
  'The chart below shows the percentage of households in different income brackets in City X in 2020. Summarize the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
  'Focus on: 1) Overview of main trends, 2) Key data points and comparisons, 3) Accurate data representation, 4) Appropriate vocabulary for describing charts',
  'essay',
  1
FROM writing_set
WHERE NOT EXISTS (
  SELECT 1 FROM practice_questions pq 
  JOIN writing_set ws ON pq.set_id = ws.id
);

-- 10. Add sample speaking prompts  
WITH speaking_set AS (
  SELECT ps.id 
  FROM practice_sets ps 
  JOIN practice_tests pt ON ps.test_id = pt.id 
  WHERE pt.slug = 'ielts' AND ps.section = 'speaking' 
  LIMIT 1
)
INSERT INTO practice_questions (set_id, question_text, explanation, question_type, sort_order, metadata)
SELECT 
  id,
  'Tell me about your hometown. What is it like? What do you like most about living there?',
  'Speaking Part 1 question. Keep your answer to 1-2 minutes. Focus on: describing your hometown, expressing preferences, using varied vocabulary and grammar structures.',
  'speaking_prompt',
  1,
  '{"time_limit_seconds": 120, "part": 1, "difficulty": "basic"}'::jsonb
FROM speaking_set
WHERE NOT EXISTS (
  SELECT 1 FROM practice_questions pq 
  JOIN speaking_set ss ON pq.set_id = ss.id
);

-- 11. Create a function to get question type statistics
CREATE OR REPLACE FUNCTION get_test_prep_stats()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_sets', COUNT(*),
    'by_section', jsonb_object_agg(section, section_count),
    'total_questions', (SELECT COUNT(*) FROM practice_questions),
    'by_question_type', (
      SELECT jsonb_object_agg(question_type, type_count)
      FROM (
        SELECT question_type, COUNT(*) as type_count
        FROM practice_questions
        GROUP BY question_type
      ) qt
    )
  ) INTO result
  FROM (
    SELECT section, COUNT(*) as section_count
    FROM practice_sets
    GROUP BY section
  ) sc;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 12. Add RLS policies for test prep content management
-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Admin can manage practice_sets" ON practice_sets;
DROP POLICY IF EXISTS "Admin can manage practice_questions" ON practice_questions;
DROP POLICY IF EXISTS "Admin can manage practice_choices" ON practice_choices;

-- Admins can manage all test prep content
CREATE POLICY "Admin can manage practice_sets" ON practice_sets FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_subscriptions us 
  WHERE us.user_id = auth.uid() 
  AND us.plan_type = 'admin'
));

CREATE POLICY "Admin can manage practice_questions" ON practice_questions FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_subscriptions us 
  WHERE us.user_id = auth.uid() 
  AND us.plan_type = 'admin'
));

CREATE POLICY "Admin can manage practice_choices" ON practice_choices FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_subscriptions us 
  WHERE us.user_id = auth.uid() 
  AND us.plan_type = 'admin'
));

-- 13. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON practice_tests TO authenticated;
GRANT ALL ON practice_sets TO authenticated; 
GRANT ALL ON practice_questions TO authenticated;
GRANT ALL ON practice_choices TO authenticated;

-- Enable RLS on tables if not already enabled
ALTER TABLE practice_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_questions ENABLE ROW LEVEL SECURITY;  
ALTER TABLE practice_choices ENABLE ROW LEVEL SECURITY;

-- Migration complete
SELECT 'Enhanced test prep schema migration completed successfully' as result; 