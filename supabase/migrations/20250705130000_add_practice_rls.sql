-- Add RLS policies for public read access to practice tables

-- RLS for practice_tests: Allow all users to read
ALTER TABLE practice_tests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON practice_tests;
CREATE POLICY "Enable read access for all users" ON practice_tests FOR SELECT USING (TRUE);

-- RLS for practice_sets: Allow all users to read
ALTER TABLE practice_sets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON practice_sets;
CREATE POLICY "Enable read access for all users" ON practice_sets FOR SELECT USING (TRUE);

-- RLS for practice_questions: Allow all users to read
ALTER TABLE practice_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON practice_questions;
CREATE POLICY "Enable read access for all users" ON practice_questions FOR SELECT USING (TRUE);

-- RLS for practice_choices: Allow all users to read
ALTER TABLE practice_choices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON practice_choices;
CREATE POLICY "Enable read access for all users" ON practice_choices FOR SELECT USING (TRUE); 