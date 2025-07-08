-- IELTS Reading Practice Database Setup - CORRECTED VERSION
-- Based on actual database schema used by the application

-- Check existing data first
DO $$
BEGIN
    RAISE NOTICE 'Checking existing IELTS practice test data...';
    
    IF EXISTS (SELECT 1 FROM practice_tests WHERE slug = 'ielts') THEN
        RAISE NOTICE 'IELTS practice test exists';
    ELSE
        RAISE NOTICE 'IELTS practice test NOT found - will create';
    END IF;
END $$;

-- Create IELTS practice test (only id and slug are needed)
INSERT INTO practice_tests (id, slug)
VALUES ('ielts-test-1', 'ielts') 
ON CONFLICT (slug) DO NOTHING;

-- Create IELTS Reading Practice Set
INSERT INTO practice_sets (id, test_id, title, passage, section, sort_order)
VALUES (
    'ielts-reading-set-1',
    'ielts-test-1',
    'Academic Reading - Passage 1: AI in Education',
    'The Impact of Artificial Intelligence on Modern Education

The integration of artificial intelligence (AI) into educational systems represents one of the most significant technological shifts in modern pedagogy. As educational institutions worldwide grapple with the challenges of preparing students for an increasingly digital future, AI has emerged as both a powerful tool and a subject of considerable debate.

AI technologies in education range from simple automated grading systems to sophisticated adaptive learning platforms that can personalize instruction for individual students. These systems analyze student performance data to identify knowledge gaps and adjust the difficulty and pace of instruction accordingly. For instance, language learning applications now use AI to provide real-time pronunciation feedback, while mathematics platforms can generate unlimited practice problems tailored to a student''s specific weaknesses.

However, the implementation of AI in education is not without challenges. Privacy concerns regarding student data collection have become paramount, as these systems require extensive personal information to function effectively. Additionally, there are growing concerns about the potential for AI to exacerbate educational inequalities, as schools with limited resources may not have access to the most advanced AI tools.

Research conducted by the International Education Technology Association indicates that students using AI-enhanced learning platforms show, on average, 23% improvement in standardized test scores compared to traditional instruction methods. Nevertheless, critics argue that this focus on measurable outcomes may overshadow the development of critical thinking and creativity skills that are essential for future success.

The role of educators is also evolving in this AI-enhanced environment. Rather than being replaced by technology, teachers are increasingly becoming facilitators who guide students in effectively utilizing AI tools while developing the uniquely human skills that remain irreplaceable. This transformation requires significant professional development and a fundamental shift in pedagogical approaches.

Future developments in educational AI promise even more sophisticated applications, including virtual reality learning environments and AI tutors capable of emotional intelligence. As these technologies continue to advance, the challenge for educational institutions will be balancing technological innovation with the preservation of essential human elements in the learning process.',
    'reading',
    1
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    passage = EXCLUDED.passage;

-- Create practice questions
INSERT INTO practice_questions (id, set_id, question_text, explanation)
VALUES 
    (
        'ielts-reading-q1',
        'ielts-reading-set-1',
        'According to the passage, what is the primary function of adaptive learning platforms?',
        'The passage states that adaptive learning platforms "analyze student performance data to identify knowledge gaps and adjust the difficulty and pace of instruction accordingly."'
    ),
    (
        'ielts-reading-q2',
        'ielts-reading-set-1',
        'What percentage improvement in standardized test scores is mentioned in the research?',
        'The passage specifically mentions "23% improvement in standardized test scores compared to traditional instruction methods."'
    ),
    (
        'ielts-reading-q3',
        'ielts-reading-set-1',
        'What does the passage suggest about the future role of teachers in AI-enhanced education?',
        'The passage indicates that "teachers are increasingly becoming facilitators who guide students in effectively utilizing AI tools while developing the uniquely human skills that remain irreplaceable."'
    ),
    (
        'ielts-reading-q4',
        'ielts-reading-set-1',
        'AI technologies in education are limited to automated grading systems. True or False?',
        'False. The passage states that AI technologies "range from simple automated grading systems to sophisticated adaptive learning platforms," indicating they are not limited to grading systems.'
    ),
    (
        'ielts-reading-q5',
        'ielts-reading-set-1',
        'According to the passage, privacy concerns have become important in AI education systems. True or False?',
        'True. The passage states that "Privacy concerns regarding student data collection have become paramount."'
    )
ON CONFLICT (id) DO UPDATE SET
    question_text = EXCLUDED.question_text,
    explanation = EXCLUDED.explanation;

-- Create answer choices for multiple choice questions (Q1-Q3)
INSERT INTO practice_choices (id, question_id, choice_text, is_correct)
VALUES 
    -- Question 1 choices
    ('ielts-reading-q1-a', 'ielts-reading-q1', 'To replace traditional teachers in the classroom', false),
    ('ielts-reading-q1-b', 'ielts-reading-q1', 'To analyze student performance and personalize instruction', true),
    ('ielts-reading-q1-c', 'ielts-reading-q1', 'To provide entertainment during study sessions', false),
    ('ielts-reading-q1-d', 'ielts-reading-q1', 'To eliminate the need for standardized testing', false),
    
    -- Question 2 choices  
    ('ielts-reading-q2-a', 'ielts-reading-q2', '15%', false),
    ('ielts-reading-q2-b', 'ielts-reading-q2', '20%', false),
    ('ielts-reading-q2-c', 'ielts-reading-q2', '23%', true),
    ('ielts-reading-q2-d', 'ielts-reading-q2', '25%', false),
    
    -- Question 3 choices
    ('ielts-reading-q3-a', 'ielts-reading-q3', 'Teachers will be completely replaced by AI systems', false),
    ('ielts-reading-q3-b', 'ielts-reading-q3', 'Teachers will become facilitators who guide students in using AI tools', true),
    ('ielts-reading-q3-c', 'ielts-reading-q3', 'Teachers will only work with students who cannot use AI', false),
    ('ielts-reading-q3-d', 'ielts-reading-q3', 'Teachers will focus exclusively on grading and administration', false),
    
    -- Question 4 (True/False)
    ('ielts-reading-q4-true', 'ielts-reading-q4', 'True', false),
    ('ielts-reading-q4-false', 'ielts-reading-q4', 'False', true),
    
    -- Question 5 (True/False)
    ('ielts-reading-q5-true', 'ielts-reading-q5', 'True', true),
    ('ielts-reading-q5-false', 'ielts-reading-q5', 'False', false)
ON CONFLICT (id) DO UPDATE SET
    choice_text = EXCLUDED.choice_text,
    is_correct = EXCLUDED.is_correct;

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
    RAISE NOTICE 'Test includes: Academic reading passage with 5 questions (3 multiple choice, 2 true/false)';
END $$;

-- Final diagnostic
SELECT 
    'VERIFICATION' as status,
    pt.slug as test_slug,
    ps.title as set_title,
    ps.section,
    COUNT(pq.id) as total_questions
FROM practice_tests pt
JOIN practice_sets ps ON pt.id = ps.test_id  
LEFT JOIN practice_questions pq ON ps.id = pq.set_id
WHERE pt.slug = 'ielts'
GROUP BY pt.slug, ps.title, ps.section; 