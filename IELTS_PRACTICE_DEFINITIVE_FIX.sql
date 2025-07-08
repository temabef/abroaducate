-- IELTS Practice System - DEFINITIVE FIX
-- This script resolves all known issues with the IELTS practice database
-- Run this ONCE on your Supabase database to fix loading problems

-- ==================================================
-- STEP 1: CLEAN SLATE - Remove all existing IELTS data
-- ==================================================

DO $$
BEGIN
    RAISE NOTICE 'Starting IELTS Practice System Fix...';
    
    -- Clean up existing data in correct order (foreign keys)
    DELETE FROM practice_choices 
    WHERE question_id IN (
        SELECT pq.id FROM practice_questions pq 
        JOIN practice_sets ps ON pq.set_id = ps.id 
        JOIN practice_tests pt ON ps.test_id = pt.id 
        WHERE pt.slug = 'ielts'
    );
    
    DELETE FROM user_practice_responses 
    WHERE question_id IN (
        SELECT pq.id FROM practice_questions pq 
        JOIN practice_sets ps ON pq.set_id = ps.id 
        JOIN practice_tests pt ON ps.test_id = pt.id 
        WHERE pt.slug = 'ielts'
    );
    
    DELETE FROM user_practice_attempts 
    WHERE set_id IN (
        SELECT ps.id FROM practice_sets ps 
        JOIN practice_tests pt ON ps.test_id = pt.id 
        WHERE pt.slug = 'ielts'
    );
    
    DELETE FROM practice_questions 
    WHERE set_id IN (
        SELECT ps.id FROM practice_sets ps 
        JOIN practice_tests pt ON ps.test_id = pt.id 
        WHERE pt.slug = 'ielts'
    );
    
    DELETE FROM practice_sets 
    WHERE test_id IN (
        SELECT id FROM practice_tests WHERE slug = 'ielts'
    );
    
    DELETE FROM practice_tests WHERE slug = 'ielts';
    
    RAISE NOTICE 'Cleaned existing IELTS data';
END $$;

-- ==================================================
-- STEP 2: ENSURE SCHEMA CONSISTENCY
-- ==================================================

-- Add missing columns if they don't exist
ALTER TABLE practice_tests 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE practice_sets 
ADD COLUMN IF NOT EXISTS passage TEXT,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

ALTER TABLE practice_questions 
ADD COLUMN IF NOT EXISTS explanation TEXT,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- ==================================================
-- STEP 3: CREATE FRESH IELTS DATA
-- ==================================================

-- Create the IELTS test
INSERT INTO practice_tests (id, slug, name, description)
VALUES (
    gen_random_uuid(),
    'ielts',
    'IELTS Academic Practice Test',
    'International English Language Testing System - Academic module'
);

-- Get the test ID for foreign key references
DO $$
DECLARE
    test_id UUID;
    set_id UUID;
    q1_id UUID;
    q2_id UUID;
    q3_id UUID;
    q4_id UUID;
    q5_id UUID;
BEGIN
    -- Get the test ID
    SELECT id INTO test_id FROM practice_tests WHERE slug = 'ielts';
    set_id := gen_random_uuid();
    q1_id := gen_random_uuid();
    q2_id := gen_random_uuid();
    q3_id := gen_random_uuid();
    q4_id := gen_random_uuid();
    q5_id := gen_random_uuid();
    
    -- Create practice set with passage
    INSERT INTO practice_sets (id, test_id, section, title, sort_order, passage)
    VALUES (
        set_id,
        test_id,
        'reading',
        'IELTS Reading Practice Set 1: AI in Education',
        1,
        'The Impact of Artificial Intelligence on Modern Education

The integration of artificial intelligence (AI) into educational systems represents one of the most significant technological shifts in modern pedagogy. As educational institutions worldwide grapple with the challenges of preparing students for an increasingly digital future, AI has emerged as both a powerful tool and a subject of considerable debate.

AI technologies in education range from simple automated grading systems to sophisticated adaptive learning platforms that can personalize instruction for individual students. These systems analyze student performance data to identify knowledge gaps and adjust the difficulty and pace of instruction accordingly. For instance, language learning applications now use AI to provide real-time pronunciation feedback, while mathematics platforms can generate unlimited practice problems tailored to a student''s specific weaknesses.

However, the implementation of AI in education is not without challenges. Privacy concerns regarding student data collection have become paramount, as these systems require extensive personal information to function effectively. Additionally, there are growing concerns about the potential for AI to exacerbate educational inequalities, as schools with limited resources may not have access to the most advanced AI tools.

Research conducted by the International Education Technology Association indicates that students using AI-enhanced learning platforms show, on average, 23% improvement in standardized test scores compared to traditional instruction methods. Nevertheless, critics argue that this focus on measurable outcomes may overshadow the development of critical thinking and creativity skills that are essential for future success.

The role of educators is also evolving in this AI-enhanced environment. Rather than being replaced by technology, teachers are increasingly becoming facilitators who guide students in effectively utilizing AI tools while developing the uniquely human skills that remain irreplaceable. This transformation requires significant professional development and a fundamental shift in pedagogical approaches.

Future developments in educational AI promise even more sophisticated applications, including virtual reality learning environments and AI tutors capable of emotional intelligence. As these technologies continue to advance, the challenge for educational institutions will be balancing technological innovation with the preservation of essential human elements in the learning process.'
    );
    
    -- Create questions
    INSERT INTO practice_questions (id, set_id, question_text, explanation, sort_order) VALUES
    (
        q1_id,
        set_id,
        'According to the passage, what is the primary function of adaptive learning platforms?',
        'The passage states that adaptive learning platforms "analyze student performance data to identify knowledge gaps and adjust the difficulty and pace of instruction accordingly."',
        1
    ),
    (
        q2_id,
        set_id,
        'What percentage improvement in standardized test scores is mentioned in the research?',
        'The passage specifically mentions "23% improvement in standardized test scores compared to traditional instruction methods."',
        2
    ),
    (
        q3_id,
        set_id,
        'What does the passage suggest about the future role of teachers in AI-enhanced education?',
        'The passage indicates that "teachers are increasingly becoming facilitators who guide students in effectively utilizing AI tools while developing the uniquely human skills that remain irreplaceable."',
        3
    ),
    (
        q4_id,
        set_id,
        'AI technologies in education are limited to automated grading systems. True or False?',
        'False. The passage states that AI technologies "range from simple automated grading systems to sophisticated adaptive learning platforms," indicating they are not limited to grading systems.',
        4
    ),
    (
        q5_id,
        set_id,
        'According to the passage, privacy concerns have become important in AI education systems. True or False?',
        'True. The passage states that "Privacy concerns regarding student data collection have become paramount."',
        5
    );
    
    -- Create answer choices
    INSERT INTO practice_choices (id, question_id, choice_text, is_correct) VALUES
    -- Question 1 choices
    (gen_random_uuid(), q1_id, 'To replace traditional teachers in the classroom', false),
    (gen_random_uuid(), q1_id, 'To analyze student performance and personalize instruction', true),
    (gen_random_uuid(), q1_id, 'To provide entertainment during study sessions', false),
    (gen_random_uuid(), q1_id, 'To eliminate the need for standardized testing', false),
    
    -- Question 2 choices
    (gen_random_uuid(), q2_id, '15%', false),
    (gen_random_uuid(), q2_id, '20%', false),
    (gen_random_uuid(), q2_id, '23%', true),
    (gen_random_uuid(), q2_id, '25%', false),
    
    -- Question 3 choices
    (gen_random_uuid(), q3_id, 'Teachers will be completely replaced by AI systems', false),
    (gen_random_uuid(), q3_id, 'Teachers will become facilitators who guide students in using AI tools', true),
    (gen_random_uuid(), q3_id, 'Teachers will only work with students who cannot use AI', false),
    (gen_random_uuid(), q3_id, 'Teachers will focus exclusively on grading and administration', false),
    
    -- Question 4 (True/False)
    (gen_random_uuid(), q4_id, 'True', false),
    (gen_random_uuid(), q4_id, 'False', true),
    
    -- Question 5 (True/False)
    (gen_random_uuid(), q5_id, 'True', true),
    (gen_random_uuid(), q5_id, 'False', false);
    
    RAISE NOTICE 'Created IELTS practice data successfully';
END $$;

-- ==================================================
-- STEP 4: VERIFY AND CONFIGURE PERMISSIONS
-- ==================================================

-- Ensure RLS policies allow reading
ALTER TABLE practice_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_choices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON practice_tests;
DROP POLICY IF EXISTS "Enable read access for all users" ON practice_sets;
DROP POLICY IF EXISTS "Enable read access for all users" ON practice_questions;
DROP POLICY IF EXISTS "Enable read access for all users" ON practice_choices;

-- Create read policies for all users
CREATE POLICY "Enable read access for all users" ON practice_tests FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON practice_sets FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON practice_questions FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON practice_choices FOR SELECT USING (true);

-- Grant necessary permissions
GRANT SELECT ON practice_tests TO anon, authenticated;
GRANT SELECT ON practice_sets TO anon, authenticated;
GRANT SELECT ON practice_questions TO anon, authenticated;
GRANT SELECT ON practice_choices TO anon, authenticated;

-- ==================================================
-- STEP 5: VERIFICATION
-- ==================================================

DO $$
DECLARE
    test_count INTEGER;
    set_count INTEGER;
    question_count INTEGER;
    choice_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO test_count FROM practice_tests WHERE slug = 'ielts';
    SELECT COUNT(*) INTO set_count FROM practice_sets ps 
        JOIN practice_tests pt ON ps.test_id = pt.id WHERE pt.slug = 'ielts';
    SELECT COUNT(*) INTO question_count FROM practice_questions pq
        JOIN practice_sets ps ON pq.set_id = ps.id
        JOIN practice_tests pt ON ps.test_id = pt.id WHERE pt.slug = 'ielts';
    SELECT COUNT(*) INTO choice_count FROM practice_choices pc
        JOIN practice_questions pq ON pc.question_id = pq.id
        JOIN practice_sets ps ON pq.set_id = ps.id
        JOIN practice_tests pt ON ps.test_id = pt.id WHERE pt.slug = 'ielts';
        
    RAISE NOTICE '=================================';
    RAISE NOTICE '🎯 IELTS PRACTICE FIX COMPLETE';
    RAISE NOTICE '=================================';
    RAISE NOTICE 'Tests created: %', test_count;
    RAISE NOTICE 'Sets created: %', set_count;
    RAISE NOTICE 'Questions created: %', question_count;
    RAISE NOTICE 'Choices created: %', choice_count;
    RAISE NOTICE '';
    RAISE NOTICE '✅ IELTS Reading practice should now work at:';
    RAISE NOTICE '   /practice/ielts/reading';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Test includes:';
    RAISE NOTICE '   - 1 Academic reading passage (AI in Education)';
    RAISE NOTICE '   - 5 questions (3 multiple choice, 2 true/false)';
    RAISE NOTICE '   - Complete explanations for all answers';
    RAISE NOTICE '=================================';
END $$;

-- Final diagnostic query
SELECT 
    '✅ VERIFICATION' as status,
    pt.slug as test_slug,
    pt.name as test_name,
    ps.title as set_title,
    ps.section,
    COUNT(pq.id) as total_questions,
    COUNT(pc.id) as total_choices
FROM practice_tests pt
JOIN practice_sets ps ON pt.id = ps.test_id
JOIN practice_questions pq ON ps.id = pq.set_id
JOIN practice_choices pc ON pq.id = pc.question_id
WHERE pt.slug = 'ielts'
GROUP BY pt.slug, pt.name, ps.title, ps.section; 