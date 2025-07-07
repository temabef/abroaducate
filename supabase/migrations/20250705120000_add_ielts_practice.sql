-- Migration: IELTS practice module
-- 1. Tests table
CREATE TABLE IF NOT EXISTS practice_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- 2. Sets table (e.g., Reading Set 1)
CREATE TABLE IF NOT EXISTS practice_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid REFERENCES practice_tests(id) ON DELETE CASCADE,
  section text NOT NULL, -- reading, listening, etc.
  title text NOT NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 3. Questions
CREATE TABLE IF NOT EXISTS practice_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id uuid REFERENCES practice_sets(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  explanation text,
  sort_order int DEFAULT 0
);

-- 4. Choices (MCQ)
CREATE TABLE IF NOT EXISTS practice_choices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES practice_questions(id) ON DELETE CASCADE,
  choice_text text NOT NULL,
  is_correct boolean DEFAULT false
);

-- 5. User attempts
CREATE TABLE IF NOT EXISTS user_practice_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  set_id uuid REFERENCES practice_sets(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  score int
);

-- 6. User responses
CREATE TABLE IF NOT EXISTS user_practice_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid REFERENCES user_practice_attempts(id) ON DELETE CASCADE,
  question_id uuid REFERENCES practice_questions(id) ON DELETE CASCADE,
  choice_id uuid REFERENCES practice_choices(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- RLS: only user can access their attempts/responses
ALTER TABLE user_practice_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_practice_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User attempts" ON user_practice_attempts;
CREATE POLICY "User attempts" ON user_practice_attempts FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "User responses" ON user_practice_responses;
CREATE POLICY "User responses" ON user_practice_responses FOR ALL USING (
  user_id = auth.uid()
) WITH CHECK (
  user_id = auth.uid()
);

-- Seed IELTS Reading sample
INSERT INTO practice_tests (slug, name, description)
VALUES ('ielts', 'IELTS', 'International English Language Testing System')
ON CONFLICT (slug) DO NOTHING;

-- Fetch test id
WITH t AS (
  SELECT id FROM practice_tests WHERE slug = 'ielts' LIMIT 1
)
INSERT INTO practice_sets (test_id, section, title, sort_order)
SELECT id, 'reading', 'Reading Set 1', 1 FROM t
ON CONFLICT DO NOTHING;

-- Fetch set id
WITH s AS (
  SELECT id FROM practice_sets WHERE title = 'Reading Set 1' LIMIT 1
)
INSERT INTO practice_questions (set_id, question_text, explanation, sort_order)
SELECT id, 'The Eiffel Tower is located in which city?', 'The Eiffel Tower is a famous landmark in Paris, the capital of France.', 1 FROM s
UNION ALL
SELECT id, 'Which planet is known as the Red Planet?', 'Mars is often called the Red Planet due to its reddish appearance, caused by iron oxide on its surface.', 2 FROM s
UNION ALL
SELECT id, 'Water boils at what temperature (in °C)?', 'At standard atmospheric pressure, pure water boils at 100° Celsius (212° Fahrenheit).', 3 FROM s;

-- Choices
WITH q1 AS (SELECT id FROM practice_questions WHERE question_text LIKE 'The Eiffel Tower%' LIMIT 1),
q2 AS (SELECT id FROM practice_questions WHERE question_text LIKE 'Which planet%' LIMIT 1),
q3 AS (SELECT id FROM practice_questions WHERE question_text LIKE 'Water boils%' LIMIT 1)
INSERT INTO practice_choices (question_id, choice_text, is_correct)
SELECT id, 'Paris', true FROM q1
UNION ALL SELECT id, 'London', false FROM q1
UNION ALL SELECT id, 'Rome', false FROM q1
UNION ALL SELECT id, 'Mars', true FROM q2
UNION ALL SELECT id, 'Jupiter', false FROM q2
UNION ALL SELECT id, 'Venus', false FROM q2
UNION ALL SELECT id, '90', false FROM q3
UNION ALL SELECT id, '100', true FROM q3
UNION ALL SELECT id, '80', false FROM q3; 