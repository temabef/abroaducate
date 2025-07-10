-- IELTS Reading Practice Database Setup - SAFE VERSION
-- Using generated UUIDs and careful foreign key handling

-- First, let's clean up any existing partial data
DELETE FROM practice_choices WHERE question_id IN (
    SELECT pq.id FROM practice_questions pq 
    JOIN practice_sets ps ON pq.set_id = ps.id 
    JOIN practice_tests pt ON ps.test_id = pt.id 
    WHERE pt.slug = 'ielts'
);

DELETE FROM practice_questions WHERE set_id IN (
    SELECT ps.id FROM practice_sets ps 
    JOIN practice_tests pt ON ps.test_id = pt.id 
    WHERE pt.slug = 'ielts'
);

DELETE FROM practice_sets WHERE test_id IN (
    SELECT id FROM practice_tests WHERE slug = 'ielts'
);

DELETE FROM practice_tests WHERE slug = 'ielts';

-- Now create everything fresh with generated UUIDs
DO $$
DECLARE
    test_uuid UUID;
    set_uuid UUID;
    q1_uuid UUID;
    q2_uuid UUID;
    q3_uuid UUID;
    q4_uuid UUID;
    q5_uuid UUID;
BEGIN
    -- Generate UUIDs
    test_uuid := gen_random_uuid();
    set_uuid := gen_random_uuid();
    q1_uuid := gen_random_uuid();
    q2_uuid := gen_random_uuid();
    q3_uuid := gen_random_uuid();
    q4_uuid := gen_random_uuid();
    q5_uuid := gen_random_uuid();
    
    RAISE NOTICE 'Creating IELTS practice test with UUID: %', test_uuid;
    
    -- Create practice test
    INSERT INTO practice_tests (id, slug, name)
    VALUES (test_uuid, 'ielts', 'IELTS Academic Practice Test');
    
    RAISE NOTICE 'Practice test created successfully';
    
    -- Create practice set
    INSERT INTO practice_sets (id, test_id, title, passage, section, sort_order)
    VALUES (
        set_uuid,
        test_uuid,
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
    );
    
    RAISE NOTICE 'Practice set created successfully';
    
    -- Create practice questions
    INSERT INTO practice_questions (id, set_id, question_text, explanation)
    VALUES 
        (
            q1_uuid,
            set_uuid,
            'According to the passage, what is the primary function of adaptive learning platforms?',
            'The passage states that adaptive learning platforms "analyze student performance data to identify knowledge gaps and adjust the difficulty and pace of instruction accordingly."'
        ),
        (
            q2_uuid,
            set_uuid,
            'What percentage improvement in standardized test scores is mentioned in the research?',
            'The passage specifically mentions "23% improvement in standardized test scores compared to traditional instruction methods."'
        ),
        (
            q3_uuid,
            set_uuid,
            'What does the passage suggest about the future role of teachers in AI-enhanced education?',
            'The passage indicates that "teachers are increasingly becoming facilitators who guide students in effectively utilizing AI tools while developing the uniquely human skills that remain irreplaceable."'
        ),
        (
            q4_uuid,
            set_uuid,
            'AI technologies in education are limited to automated grading systems. True or False?',
            'False. The passage states that AI technologies "range from simple automated grading systems to sophisticated adaptive learning platforms," indicating they are not limited to grading systems.'
        ),
        (
            q5_uuid,
            set_uuid,
            'According to the passage, privacy concerns have become important in AI education systems. True or False?',
            'True. The passage states that "Privacy concerns regarding student data collection have become paramount."'
        );
    
    RAISE NOTICE 'Practice questions created successfully';
    
    -- Create answer choices
    INSERT INTO practice_choices (id, question_id, choice_text, is_correct)
    VALUES 
        -- Question 1 choices
        (gen_random_uuid(), q1_uuid, 'To replace traditional teachers in the classroom', false),
        (gen_random_uuid(), q1_uuid, 'To analyze student performance and personalize instruction', true),
        (gen_random_uuid(), q1_uuid, 'To provide entertainment during study sessions', false),
        (gen_random_uuid(), q1_uuid, 'To eliminate the need for standardized testing', false),
        
        -- Question 2 choices  
        (gen_random_uuid(), q2_uuid, '15%', false),
        (gen_random_uuid(), q2_uuid, '20%', false),
        (gen_random_uuid(), q2_uuid, '23%', true),
        (gen_random_uuid(), q2_uuid, '25%', false),
        
        -- Question 3 choices
        (gen_random_uuid(), q3_uuid, 'Teachers will be completely replaced by AI systems', false),
        (gen_random_uuid(), q3_uuid, 'Teachers will become facilitators who guide students in using AI tools', true),
        (gen_random_uuid(), q3_uuid, 'Teachers will only work with students who cannot use AI', false),
        (gen_random_uuid(), q3_uuid, 'Teachers will focus exclusively on grading and administration', false),
        
        -- Question 4 (True/False)
        (gen_random_uuid(), q4_uuid, 'True', false),
        (gen_random_uuid(), q4_uuid, 'False', true),
        
        -- Question 5 (True/False)
        (gen_random_uuid(), q5_uuid, 'True', true),
        (gen_random_uuid(), q5_uuid, 'False', false);
    
    RAISE NOTICE 'Answer choices created successfully';
    
    -- Final verification
    RAISE NOTICE '=== IELTS PRACTICE SETUP COMPLETE ===';
    RAISE NOTICE 'Test UUID: %', test_uuid;
    RAISE NOTICE 'Set UUID: %', set_uuid;
    RAISE NOTICE 'IELTS Reading practice should now work at: /practice/ielts/reading';
    
END $$;

-- Verification query
SELECT 
    'VERIFICATION' as status,
    pt.slug as test_slug,
    pt.name as test_name,
    ps.title as set_title,
    ps.section,
    COUNT(pq.id) as total_questions
FROM practice_tests pt
JOIN practice_sets ps ON pt.id = ps.test_id  
LEFT JOIN practice_questions pq ON ps.id = pq.set_id
WHERE pt.slug = 'ielts'
GROUP BY pt.slug, pt.name, ps.title, ps.section;

-- Show the created data
SELECT 'Created practice test:' as info, slug, name FROM practice_tests WHERE slug = 'ielts';
SELECT 'Created practice set:' as info, title, section FROM practice_sets ps JOIN practice_tests pt ON ps.test_id = pt.id WHERE pt.slug = 'ielts';
SELECT 'Created questions:' as info, COUNT(*) as question_count FROM practice_questions pq JOIN practice_sets ps ON pq.set_id = ps.id JOIN practice_tests pt ON ps.test_id = pt.id WHERE pt.slug = 'ielts';
SELECT 'Created choices:' as info, COUNT(*) as choice_count FROM practice_choices pc JOIN practice_questions pq ON pc.question_id = pq.id JOIN practice_sets ps ON pq.set_id = ps.id JOIN practice_tests pt ON ps.test_id = pt.id WHERE pt.slug = 'ielts'; 