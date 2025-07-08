-- IELTS Practice System - CORRECTED FIX
-- This fixes the data structure issue (was creating 16 questions instead of 5)

-- ==================================================
-- STEP 1: CLEAN SLATE - Remove all existing IELTS data
-- ==================================================

DO $$
BEGIN
    RAISE NOTICE 'Starting CORRECTED IELTS Practice System Fix...';
    
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
-- STEP 2: CREATE FRESH IELTS DATA (FIXED VERSION)
-- ==================================================

DO $$
DECLARE
    test_id UUID;
    set_id UUID;
    q1_id UUID := gen_random_uuid();
    q2_id UUID := gen_random_uuid();
    q3_id UUID := gen_random_uuid();
    q4_id UUID := gen_random_uuid();
    q5_id UUID := gen_random_uuid();
BEGIN
    -- Create the IELTS test
    INSERT INTO practice_tests (id, slug, name, description)
    VALUES (
        gen_random_uuid(),
        'ielts',
        'IELTS Academic Practice Test',
        'International English Language Testing System - Academic module'
    ) RETURNING id INTO test_id;
    
    RAISE NOTICE 'Created IELTS test with ID: %', test_id;
    
    -- Create practice set
    set_id := gen_random_uuid();
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
    
    RAISE NOTICE 'Created practice set with ID: %', set_id;
    
    -- Create exactly 5 questions
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
    
    RAISE NOTICE 'Created 5 questions';
    
    -- Create answer choices (20 total: 4 for each of first 3 questions, 2 for each true/false)
    INSERT INTO practice_choices (id, question_id, choice_text, is_correct) VALUES
    -- Question 1 choices (4 choices)
    (gen_random_uuid(), q1_id, 'To replace traditional teachers in the classroom', false),
    (gen_random_uuid(), q1_id, 'To analyze student performance and personalize instruction', true),
    (gen_random_uuid(), q1_id, 'To provide entertainment during study sessions', false),
    (gen_random_uuid(), q1_id, 'To eliminate the need for standardized testing', false),
    
    -- Question 2 choices (4 choices)
    (gen_random_uuid(), q2_id, '15%', false),
    (gen_random_uuid(), q2_id, '20%', false),
    (gen_random_uuid(), q2_id, '23%', true),
    (gen_random_uuid(), q2_id, '25%', false),
    
    -- Question 3 choices (4 choices)
    (gen_random_uuid(), q3_id, 'Teachers will be completely replaced by AI systems', false),
    (gen_random_uuid(), q3_id, 'Teachers will become facilitators who guide students in using AI tools', true),
    (gen_random_uuid(), q3_id, 'Teachers will only work with students who cannot use AI', false),
    (gen_random_uuid(), q3_id, 'Teachers will focus exclusively on grading and administration', false),
    
    -- Question 4 (True/False - 2 choices)
    (gen_random_uuid(), q4_id, 'True', false),
    (gen_random_uuid(), q4_id, 'False', true),
    
    -- Question 5 (True/False - 2 choices)
    (gen_random_uuid(), q5_id, 'True', true),
    (gen_random_uuid(), q5_id, 'False', false);
    
    RAISE NOTICE 'Created 20 answer choices (4+4+4+2+2)';
    
    RAISE NOTICE '=================================';
    RAISE NOTICE '🎯 CORRECTED IELTS PRACTICE FIX COMPLETE';
    RAISE NOTICE '=================================';
    RAISE NOTICE 'Expected structure:';
    RAISE NOTICE '- 1 test (ielts)';
    RAISE NOTICE '- 1 practice set (reading)';
    RAISE NOTICE '- 5 questions (3 multiple choice + 2 true/false)';
    RAISE NOTICE '- 20 total choices (4+4+4+2+2)';
    RAISE NOTICE '=================================';
    
END $$;

-- ==================================================
-- STEP 3: VERIFICATION
-- ==================================================

-- Final verification with correct expected counts
SELECT 
    '✅ FINAL VERIFICATION' as status,
    pt.slug as test_slug,
    pt.name as test_name,
    ps.title as set_title,
    ps.section,
    COUNT(DISTINCT pq.id) as total_questions,
    COUNT(pc.id) as total_choices
FROM practice_tests pt
JOIN practice_sets ps ON pt.id = ps.test_id
JOIN practice_questions pq ON ps.id = pq.set_id
JOIN practice_choices pc ON pq.id = pc.question_id
WHERE pt.slug = 'ielts'
GROUP BY pt.slug, pt.name, ps.title, ps.section;

-- Show question breakdown
SELECT 
    'QUESTION BREAKDOWN' as info,
    pq.sort_order as question_number,
    LEFT(pq.question_text, 50) || '...' as question_preview,
    COUNT(pc.id) as choice_count
FROM practice_tests pt
JOIN practice_sets ps ON pt.id = ps.test_id
JOIN practice_questions pq ON ps.id = pq.set_id
JOIN practice_choices pc ON pq.id = pc.question_id
WHERE pt.slug = 'ielts'
GROUP BY pq.id, pq.sort_order, pq.question_text
ORDER BY pq.sort_order; 