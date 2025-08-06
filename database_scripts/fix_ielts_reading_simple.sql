-- Simple fix for IELTS Reading bug
-- This script will clean up and recreate the IELTS reading data with proper UUIDs

-- ==================================================
-- STEP 1: Clean up existing data
-- ==================================================

-- Delete existing IELTS reading choices
DELETE FROM practice_choices 
WHERE question_id IN (
    SELECT pq.id 
    FROM practice_questions pq
    JOIN practice_sets ps ON pq.set_id = ps.id
    JOIN practice_tests pt ON ps.test_id = pt.id
    WHERE pt.slug = 'ielts' AND ps.section = 'reading'
);

-- Delete existing IELTS reading questions
DELETE FROM practice_questions 
WHERE set_id IN (
    SELECT ps.id 
    FROM practice_sets ps
    JOIN practice_tests pt ON ps.test_id = pt.id
    WHERE pt.slug = 'ielts' AND ps.section = 'reading'
);

-- Delete existing IELTS reading sets
DELETE FROM practice_sets 
WHERE test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts') 
AND section = 'reading';

-- ==================================================
-- STEP 2: Create IELTS test if needed
-- ==================================================

INSERT INTO practice_tests (id, slug, name, description, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'ielts',
    'IELTS Academic',
    'International English Language Testing System - Academic Module',
    NOW(),
    NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- ==================================================
-- STEP 3: Create reading set
-- ==================================================

INSERT INTO practice_sets (id, test_id, title, section, sort_order, passage, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    (SELECT id FROM practice_tests WHERE slug = 'ielts'),
    'AI in Education',
    'reading',
    1,
    'Artificial Intelligence in Education: Transforming Learning

The integration of artificial intelligence (AI) in educational settings has become a topic of significant interest and debate among educators, policymakers, and technology experts. As educational institutions worldwide seek to enhance learning outcomes and address diverse student needs, AI technologies offer promising solutions for personalized instruction, automated assessment, and adaptive learning systems.

Recent studies indicate that AI-powered educational tools can improve student performance by up to 23% when properly implemented. These systems analyze student behavior patterns, identify learning gaps, and provide targeted interventions that traditional teaching methods might miss. For instance, AI algorithms can detect when a student is struggling with a particular concept and automatically adjust the difficulty level or provide additional resources.

However, the role of teachers in this AI-enhanced educational landscape remains crucial. Rather than replacing educators, AI systems are designed to augment their capabilities. Teachers become facilitators who guide students in using AI tools effectively, interpret AI-generated insights, and provide the human touch that technology cannot replicate. This collaborative approach ensures that students benefit from both technological innovation and human expertise.

Privacy concerns represent one of the primary challenges in implementing AI in education. Educational institutions must carefully balance the benefits of data-driven insights with the need to protect student information. Robust data protection measures and transparent policies are essential to maintain trust and ensure compliance with privacy regulations.

The future of AI in education looks promising, with ongoing research focusing on developing more sophisticated algorithms and user-friendly interfaces. As these technologies continue to evolve, they will likely become integral components of modern educational systems, helping to create more inclusive, effective, and personalized learning experiences for students worldwide.',
    NOW(),
    NOW()
);

-- ==================================================
-- STEP 4: Create questions and choices
-- ==================================================

DO $$
DECLARE
    set_id UUID;
    q1_id UUID;
    q2_id UUID;
    q3_id UUID;
    q4_id UUID;
    q5_id UUID;
BEGIN
    -- Get the set ID
    SELECT id INTO set_id FROM practice_sets 
    WHERE test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts') 
    AND section = 'reading' 
    LIMIT 1;
    
    -- Create Question 1 (Multiple Choice)
    INSERT INTO practice_questions (id, set_id, sort_order, question_type, question_text, explanation, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        set_id,
        1,
        'multiple_choice',
        'What is the primary purpose of AI in educational settings according to the passage?',
        'The passage states that AI technologies offer solutions for personalized instruction, automated assessment, and adaptive learning systems, with the main goal being to enhance learning outcomes.',
        NOW(),
        NOW()
    ) RETURNING id INTO q1_id;
    
    -- Create Question 2 (Multiple Choice)
    INSERT INTO practice_questions (id, set_id, sort_order, question_type, question_text, explanation, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        set_id,
        2,
        'multiple_choice',
        'According to the passage, what percentage improvement in student performance can AI-powered educational tools achieve?',
        'The passage specifically mentions that AI-powered educational tools can improve student performance by up to 23% when properly implemented.',
        NOW(),
        NOW()
    ) RETURNING id INTO q2_id;
    
    -- Create Question 3 (Multiple Choice)
    INSERT INTO practice_questions (id, set_id, sort_order, question_type, question_text, explanation, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        set_id,
        3,
        'multiple_choice',
        'How does the passage describe the future role of teachers in AI-enhanced education?',
        'The passage clearly states that teachers become facilitators who guide students in using AI tools effectively, rather than being replaced by AI systems.',
        NOW(),
        NOW()
    ) RETURNING id INTO q3_id;
    
    -- Create Question 4 (True/False)
    INSERT INTO practice_questions (id, set_id, sort_order, question_type, question_text, explanation, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        set_id,
        4,
        'multiple_choice',
        'The passage states that AI systems will completely replace teachers in the classroom.',
        'This is false. The passage explicitly states that rather than replacing educators, AI systems are designed to augment their capabilities.',
        NOW(),
        NOW()
    ) RETURNING id INTO q4_id;
    
    -- Create Question 5 (True/False)
    INSERT INTO practice_questions (id, set_id, sort_order, question_type, question_text, explanation, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        set_id,
        5,
        'multiple_choice',
        'Privacy concerns are mentioned as a challenge in implementing AI in education.',
        'This is true. The passage specifically mentions that privacy concerns represent one of the primary challenges in implementing AI in education.',
        NOW(),
        NOW()
    ) RETURNING id INTO q5_id;
    
    -- Create choices for Question 1 (4 options)
    INSERT INTO practice_choices (id, question_id, choice_text, is_correct, sort_order, created_at)
    VALUES 
        (gen_random_uuid(), q1_id, 'To replace traditional teachers in the classroom', false, 1, NOW()),
        (gen_random_uuid(), q1_id, 'To analyze student performance and personalize instruction', true, 2, NOW()),
        (gen_random_uuid(), q1_id, 'To provide entertainment during study sessions', false, 3, NOW()),
        (gen_random_uuid(), q1_id, 'To eliminate the need for standardized testing', false, 4, NOW());
    
    -- Create choices for Question 2 (4 options)
    INSERT INTO practice_choices (id, question_id, choice_text, is_correct, sort_order, created_at)
    VALUES 
        (gen_random_uuid(), q2_id, '15%', false, 1, NOW()),
        (gen_random_uuid(), q2_id, '20%', false, 2, NOW()),
        (gen_random_uuid(), q2_id, '23%', true, 3, NOW()),
        (gen_random_uuid(), q2_id, '25%', false, 4, NOW());
    
    -- Create choices for Question 3 (4 options)
    INSERT INTO practice_choices (id, question_id, choice_text, is_correct, sort_order, created_at)
    VALUES 
        (gen_random_uuid(), q3_id, 'Teachers will be completely replaced by AI systems', false, 1, NOW()),
        (gen_random_uuid(), q3_id, 'Teachers will become facilitators who guide students in using AI tools', true, 2, NOW()),
        (gen_random_uuid(), q3_id, 'Teachers will only work with students who cannot use AI', false, 3, NOW()),
        (gen_random_uuid(), q3_id, 'Teachers will focus exclusively on grading and administration', false, 4, NOW());
    
    -- Create choices for Question 4 (True/False - 2 options)
    INSERT INTO practice_choices (id, question_id, choice_text, is_correct, sort_order, created_at)
    VALUES 
        (gen_random_uuid(), q4_id, 'True', false, 1, NOW()),
        (gen_random_uuid(), q4_id, 'False', true, 2, NOW());
    
    -- Create choices for Question 5 (True/False - 2 options)
    INSERT INTO practice_choices (id, question_id, choice_text, is_correct, sort_order, created_at)
    VALUES 
        (gen_random_uuid(), q5_id, 'True', true, 1, NOW()),
        (gen_random_uuid(), q5_id, 'False', false, 2, NOW());
    
    RAISE NOTICE 'IELTS Reading fix completed successfully!';
    RAISE NOTICE 'Created 5 questions with proper choice counts';
END $$;

-- ==================================================
-- STEP 5: Verification
-- ==================================================

-- Show the results
SELECT 
    'Verification:' as info,
    COUNT(DISTINCT pq.id) as questions,
    COUNT(pc.id) as total_choices,
    COUNT(pc.id) / COUNT(DISTINCT pq.id) as avg_choices_per_question
FROM practice_sets ps
JOIN practice_questions pq ON ps.id = pq.set_id
LEFT JOIN practice_choices pc ON pq.id = pc.question_id
WHERE ps.test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts')
AND ps.section = 'reading';

-- Show each question with its choice count
SELECT 
    pq.sort_order as question_number,
    pq.question_type,
    COUNT(pc.id) as choice_count
FROM practice_sets ps
JOIN practice_questions pq ON ps.id = pq.set_id
LEFT JOIN practice_choices pc ON pq.id = pc.question_id
WHERE ps.test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts')
AND ps.section = 'reading'
GROUP BY pq.sort_order, pq.question_type
ORDER BY pq.sort_order; 