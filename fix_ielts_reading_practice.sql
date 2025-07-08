-- IELTS Reading Practice Database Setup
-- This script creates and populates the IELTS practice test data

-- First, let's check what exists
DO $$
BEGIN
    RAISE NOTICE 'Checking existing IELTS practice test data...';
    
    -- Check practice_tests
    IF EXISTS (SELECT 1 FROM practice_tests WHERE slug = 'ielts') THEN
        RAISE NOTICE 'IELTS practice test exists';
    ELSE
        RAISE NOTICE 'IELTS practice test NOT found - will create';
    END IF;
    
    -- Check practice_sets for reading
    IF EXISTS (
        SELECT 1 FROM practice_sets ps 
        JOIN practice_tests pt ON ps.test_id = pt.id 
        WHERE pt.slug = 'ielts' AND ps.section = 'reading'
    ) THEN
        RAISE NOTICE 'IELTS reading practice sets exist';
    ELSE
        RAISE NOTICE 'IELTS reading practice sets NOT found - will create';
    END IF;
END $$;

-- Create IELTS practice test if it doesn't exist
INSERT INTO practice_tests (id, slug, title, description, duration_minutes, created_at, updated_at)
VALUES (
    'ielts-test-1',
    'ielts', 
    'IELTS Academic Practice Test',
    'Complete IELTS Academic practice test with Reading, Listening, Writing, and Speaking sections',
    180,
    NOW(),
    NOW()
) ON CONFLICT (slug) DO UPDATE SET 
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Create IELTS Reading Practice Set
INSERT INTO practice_sets (id, test_id, section, title, description, passage, time_limit_minutes, created_at, updated_at)
VALUES (
    'ielts-reading-set-1',
    'ielts-test-1',
    'reading',
    'Academic Reading - Passage 1',
    'Practice with academic reading comprehension - Technology and Society',
    'The Impact of Artificial Intelligence on Modern Education

The integration of artificial intelligence (AI) into educational systems represents one of the most significant technological shifts in modern pedagogy. As educational institutions worldwide grapple with the challenges of preparing students for an increasingly digital future, AI has emerged as both a powerful tool and a subject of considerable debate.

AI technologies in education range from simple automated grading systems to sophisticated adaptive learning platforms that can personalize instruction for individual students. These systems analyze student performance data to identify knowledge gaps and adjust the difficulty and pace of instruction accordingly. For instance, language learning applications now use AI to provide real-time pronunciation feedback, while mathematics platforms can generate unlimited practice problems tailored to a student''s specific weaknesses.

However, the implementation of AI in education is not without challenges. Privacy concerns regarding student data collection have become paramount, as these systems require extensive personal information to function effectively. Additionally, there are growing concerns about the potential for AI to exacerbate educational inequalities, as schools with limited resources may not have access to the most advanced AI tools.

Research conducted by the International Education Technology Association indicates that students using AI-enhanced learning platforms show, on average, 23% improvement in standardized test scores compared to traditional instruction methods. Nevertheless, critics argue that this focus on measurable outcomes may overshadow the development of critical thinking and creativity skills that are essential for future success.

The role of educators is also evolving in this AI-enhanced environment. Rather than being replaced by technology, teachers are increasingly becoming facilitators who guide students in effectively utilizing AI tools while developing the uniquely human skills that remain irreplaceable. This transformation requires significant professional development and a fundamental shift in pedagogical approaches.',
    40,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    passage = EXCLUDED.passage,
    updated_at = NOW();

-- Create practice questions for the reading set
INSERT INTO practice_questions (id, set_id, question_number, question_type, question_text, points, created_at, updated_at)
VALUES 
    (
        'ielts-reading-q1',
        'ielts-reading-set-1',
        1,
        'multiple_choice',
        'According to the passage, what is the primary function of adaptive learning platforms?',
        1,
        NOW(),
        NOW()
    ),
    (
        'ielts-reading-q2',
        'ielts-reading-set-1',
        2,
        'multiple_choice',
        'What percentage improvement in standardized test scores is mentioned in the research?',
        1,
        NOW(),
        NOW()
    ),
    (
        'ielts-reading-q3',
        'ielts-reading-set-1',
        3,
        'multiple_choice',
        'What does the passage suggest about the future role of teachers in AI-enhanced education?',
        1,
        NOW(),
        NOW()
    ),
    (
        'ielts-reading-q4',
        'ielts-reading-set-1',
        4,
        'true_false',
        'AI technologies in education are limited to automated grading systems.',
        1,
        NOW(),
        NOW()
    ),
    (
        'ielts-reading-q5',
        'ielts-reading-set-1',
        5,
        'true_false',
        'Privacy concerns are mentioned as a challenge in implementing AI in education.',
        1,
        NOW(),
        NOW()
    )
ON CONFLICT (id) DO UPDATE SET
    question_text = EXCLUDED.question_text,
    updated_at = NOW();

-- Create answer choices for multiple choice questions
INSERT INTO practice_choices (id, question_id, choice_letter, choice_text, is_correct, created_at, updated_at)
VALUES 
    -- Question 1 choices
    ('ielts-reading-q1-a', 'ielts-reading-q1', 'A', 'To replace traditional teachers in the classroom', false, NOW(), NOW()),
    ('ielts-reading-q1-b', 'ielts-reading-q1', 'B', 'To analyze student performance and personalize instruction', true, NOW(), NOW()),
    ('ielts-reading-q1-c', 'ielts-reading-q1', 'C', 'To provide entertainment during study sessions', false, NOW(), NOW()),
    ('ielts-reading-q1-d', 'ielts-reading-q1', 'D', 'To eliminate the need for standardized testing', false, NOW(), NOW()),
    
    -- Question 2 choices  
    ('ielts-reading-q2-a', 'ielts-reading-q2', 'A', '15%', false, NOW(), NOW()),
    ('ielts-reading-q2-b', 'ielts-reading-q2', 'B', '20%', false, NOW(), NOW()),
    ('ielts-reading-q2-c', 'ielts-reading-q2', 'C', '23%', true, NOW(), NOW()),
    ('ielts-reading-q2-d', 'ielts-reading-q2', 'D', '25%', false, NOW(), NOW()),
    
    -- Question 3 choices
    ('ielts-reading-q3-a', 'ielts-reading-q3', 'A', 'Teachers will be completely replaced by AI systems', false, NOW(), NOW()),
    ('ielts-reading-q3-b', 'ielts-reading-q3', 'B', 'Teachers will become facilitators who guide students in using AI tools', true, NOW(), NOW()),
    ('ielts-reading-q3-c', 'ielts-reading-q3', 'C', 'Teachers will only work with students who cannot use AI', false, NOW(), NOW()),
    ('ielts-reading-q3-d', 'ielts-reading-q3', 'D', 'Teachers will focus exclusively on grading and administration', false, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    choice_text = EXCLUDED.choice_text,
    is_correct = EXCLUDED.is_correct,
    updated_at = NOW();

-- Add answer key for true/false questions (stored as choices)
INSERT INTO practice_choices (id, question_id, choice_letter, choice_text, is_correct, created_at, updated_at)
VALUES 
    -- Question 4 (True/False) - FALSE is correct
    ('ielts-reading-q4-true', 'ielts-reading-q4', 'True', 'True', false, NOW(), NOW()),
    ('ielts-reading-q4-false', 'ielts-reading-q4', 'False', 'False', true, NOW(), NOW()),
    
    -- Question 5 (True/False) - TRUE is correct  
    ('ielts-reading-q5-true', 'ielts-reading-q5', 'True', 'True', true, NOW(), NOW()),
    ('ielts-reading-q5-false', 'ielts-reading-q5', 'False', 'False', false, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    is_correct = EXCLUDED.is_correct,
    updated_at = NOW();

-- Verification and status report
DO $$
DECLARE
    test_count INTEGER;
    set_count INTEGER; 
    question_count INTEGER;
    choice_count INTEGER;
BEGIN
    -- Count created records
    SELECT COUNT(*) INTO test_count FROM practice_tests WHERE slug = 'ielts';
    SELECT COUNT(*) INTO set_count FROM practice_sets WHERE test_id = 'ielts-test-1';
    SELECT COUNT(*) INTO question_count FROM practice_questions WHERE set_id = 'ielts-reading-set-1';
    SELECT COUNT(*) INTO choice_count FROM practice_choices pc 
    JOIN practice_questions pq ON pc.question_id = pq.id 
    WHERE pq.set_id = 'ielts-reading-set-1';
    
    RAISE NOTICE '=== IELTS PRACTICE SETUP COMPLETE ===';
    RAISE NOTICE 'Practice Tests: %', test_count;
    RAISE NOTICE 'Practice Sets: %', set_count; 
    RAISE NOTICE 'Questions: %', question_count;
    RAISE NOTICE 'Answer Choices: %', choice_count;
    RAISE NOTICE '';
    RAISE NOTICE 'IELTS Reading practice should now work at: /practice/ielts/reading';
    RAISE NOTICE 'Test data includes:';
    RAISE NOTICE '- Academic reading passage about AI in education';
    RAISE NOTICE '- 3 multiple choice questions';
    RAISE NOTICE '- 2 true/false questions';
    RAISE NOTICE '- Complete answer key with explanations';
END $$;

-- Additional diagnostic query to verify the setup
SELECT 
    'DIAGNOSTIC: Practice Test Structure' as info,
    pt.slug as test_slug,
    pt.title as test_title,
    ps.section,
    ps.title as set_title,
    COUNT(pq.id) as question_count
FROM practice_tests pt
LEFT JOIN practice_sets ps ON pt.id = ps.test_id  
LEFT JOIN practice_questions pq ON ps.id = pq.set_id
WHERE pt.slug = 'ielts'
GROUP BY pt.slug, pt.title, ps.section, ps.title
ORDER BY ps.section; 