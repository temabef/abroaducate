-- Complete fix for IELTS Reading bug
-- This script will clean up the data and ensure proper question-choice relationships

-- ==================================================
-- STEP 1: Clean up existing data to prevent conflicts
-- ==================================================

-- First, let's see what we have
SELECT 'Current IELTS reading data before cleanup:' as info;

-- Delete existing IELTS reading choices to start fresh
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
-- STEP 2: Ensure IELTS test exists
-- ==================================================

-- Insert IELTS test if it doesn't exist
INSERT INTO practice_tests (id, slug, name, description, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'ielts',
    'IELTS Academic',
    'International English Language Testing System - Academic Module',
    NOW(),
    NOW()
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ==================================================
-- STEP 3: Create clean IELTS reading set
-- ==================================================

-- Insert the reading practice set
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
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    passage = EXCLUDED.passage,
    updated_at = NOW();

-- ==================================================
-- STEP 4: Create questions with proper structure
-- ==================================================

-- Insert questions with clear question types
INSERT INTO practice_questions (id, set_id, sort_order, question_type, question_text, explanation, created_at, updated_at)
VALUES 
    (
        gen_random_uuid(),
        (SELECT id FROM practice_sets WHERE test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts') AND section = 'reading' LIMIT 1),
        1,
        'multiple_choice',
        'What is the primary purpose of AI in educational settings according to the passage?',
        'The passage states that AI technologies offer solutions for personalized instruction, automated assessment, and adaptive learning systems, with the main goal being to enhance learning outcomes.',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        (SELECT id FROM practice_sets WHERE test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts') AND section = 'reading' LIMIT 1),
        2,
        'multiple_choice',
        'According to the passage, what percentage improvement in student performance can AI-powered educational tools achieve?',
        'The passage specifically mentions that AI-powered educational tools can improve student performance by up to 23% when properly implemented.',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        (SELECT id FROM practice_sets WHERE test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts') AND section = 'reading' LIMIT 1),
        3,
        'multiple_choice',
        'How does the passage describe the future role of teachers in AI-enhanced education?',
        'The passage clearly states that teachers become facilitators who guide students in using AI tools effectively, rather than being replaced by AI systems.',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        (SELECT id FROM practice_sets WHERE test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts') AND section = 'reading' LIMIT 1),
        4,
        'multiple_choice',
        'The passage states that AI systems will completely replace teachers in the classroom.',
        'This is false. The passage explicitly states that rather than replacing educators, AI systems are designed to augment their capabilities.',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        (SELECT id FROM practice_sets WHERE test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts') AND section = 'reading' LIMIT 1),
        5,
        'multiple_choice',
        'Privacy concerns are mentioned as a challenge in implementing AI in education.',
        'This is true. The passage specifically mentions that privacy concerns represent one of the primary challenges in implementing AI in education.',
        NOW(),
        NOW()
    )
ON CONFLICT (id) DO UPDATE SET
    question_text = EXCLUDED.question_text,
    explanation = EXCLUDED.explanation,
    updated_at = NOW();

-- ==================================================
-- STEP 5: Create choices with proper structure
-- ==================================================

-- Insert choices for multiple choice questions (Q1-Q3) - exactly 4 choices each
DO $$
DECLARE
    q1_id UUID;
    q2_id UUID;
    q3_id UUID;
    q4_id UUID;
    q5_id UUID;
BEGIN
    -- Get question IDs
    SELECT id INTO q1_id FROM practice_questions 
    WHERE set_id = (SELECT id FROM practice_sets WHERE test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts') AND section = 'reading' LIMIT 1)
    AND sort_order = 1;
    
    SELECT id INTO q2_id FROM practice_questions 
    WHERE set_id = (SELECT id FROM practice_sets WHERE test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts') AND section = 'reading' LIMIT 1)
    AND sort_order = 2;
    
    SELECT id INTO q3_id FROM practice_questions 
    WHERE set_id = (SELECT id FROM practice_sets WHERE test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts') AND section = 'reading' LIMIT 1)
    AND sort_order = 3;
    
    SELECT id INTO q4_id FROM practice_questions 
    WHERE set_id = (SELECT id FROM practice_sets WHERE test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts') AND section = 'reading' LIMIT 1)
    AND sort_order = 4;
    
    SELECT id INTO q5_id FROM practice_questions 
    WHERE set_id = (SELECT id FROM practice_sets WHERE test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts') AND section = 'reading' LIMIT 1)
    AND sort_order = 5;
    
    -- Insert choices for Question 1 (4 options)
    INSERT INTO practice_choices (id, question_id, choice_text, is_correct, sort_order, created_at)
    VALUES 
        (gen_random_uuid(), q1_id, 'To replace traditional teachers in the classroom', false, 1, NOW()),
        (gen_random_uuid(), q1_id, 'To analyze student performance and personalize instruction', true, 2, NOW()),
        (gen_random_uuid(), q1_id, 'To provide entertainment during study sessions', false, 3, NOW()),
        (gen_random_uuid(), q1_id, 'To eliminate the need for standardized testing', false, 4, NOW());
    
    -- Insert choices for Question 2 (4 options)
    INSERT INTO practice_choices (id, question_id, choice_text, is_correct, sort_order, created_at)
    VALUES 
        (gen_random_uuid(), q2_id, '15%', false, 1, NOW()),
        (gen_random_uuid(), q2_id, '20%', false, 2, NOW()),
        (gen_random_uuid(), q2_id, '23%', true, 3, NOW()),
        (gen_random_uuid(), q2_id, '25%', false, 4, NOW());
    
    -- Insert choices for Question 3 (4 options)
    INSERT INTO practice_choices (id, question_id, choice_text, is_correct, sort_order, created_at)
    VALUES 
        (gen_random_uuid(), q3_id, 'Teachers will be completely replaced by AI systems', false, 1, NOW()),
        (gen_random_uuid(), q3_id, 'Teachers will become facilitators who guide students in using AI tools', true, 2, NOW()),
        (gen_random_uuid(), q3_id, 'Teachers will only work with students who cannot use AI', false, 3, NOW()),
        (gen_random_uuid(), q3_id, 'Teachers will focus exclusively on grading and administration', false, 4, NOW());
    
    -- Insert choices for Question 4 (True/False - 2 options)
    INSERT INTO practice_choices (id, question_id, choice_text, is_correct, sort_order, created_at)
    VALUES 
        (gen_random_uuid(), q4_id, 'True', false, 1, NOW()),
        (gen_random_uuid(), q4_id, 'False', true, 2, NOW());
    
    -- Insert choices for Question 5 (True/False - 2 options)
    INSERT INTO practice_choices (id, question_id, choice_text, is_correct, sort_order, created_at)
    VALUES 
        (gen_random_uuid(), q5_id, 'True', true, 1, NOW()),
        (gen_random_uuid(), q5_id, 'False', false, 2, NOW());
END $$;

-- ==================================================
-- STEP 6: Verification and status report
-- ==================================================

-- Verify the data structure
DO $$
DECLARE
    test_count INTEGER;
    set_count INTEGER; 
    question_count INTEGER;
    choice_count INTEGER;
    q_record RECORD;
BEGIN
    -- Count created records
    SELECT COUNT(*) INTO test_count FROM practice_tests WHERE slug = 'ielts';
    SELECT COUNT(*) INTO set_count FROM practice_sets WHERE test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts') AND section = 'reading';
    SELECT COUNT(*) INTO question_count FROM practice_questions WHERE set_id = (SELECT id FROM practice_sets WHERE test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts') AND section = 'reading' LIMIT 1);
    SELECT COUNT(*) INTO choice_count FROM practice_choices WHERE question_id IN (SELECT id FROM practice_questions WHERE set_id = (SELECT id FROM practice_sets WHERE test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts') AND section = 'reading' LIMIT 1));
    
    RAISE NOTICE '=== IELTS Reading Fix Complete ===';
    RAISE NOTICE 'Tests: %, Sets: %, Questions: %, Choices: %', test_count, set_count, question_count, choice_count;
    
    -- Verify each question has correct number of choices
    FOR q_record IN 
        SELECT id, question_text, question_type, sort_order
        FROM practice_questions 
        WHERE set_id = (SELECT id FROM practice_sets WHERE test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts') AND section = 'reading' LIMIT 1)
        ORDER BY sort_order
    LOOP
        SELECT COUNT(*) INTO choice_count 
        FROM practice_choices 
        WHERE question_id = q_record.id;
        
        RAISE NOTICE 'Question % (%): % choices (expected: %)', 
            q_record.sort_order, 
            q_record.question_type, 
            choice_count,
            CASE 
                WHEN q_record.question_type = 'multiple_choice' THEN 
                    CASE 
                        WHEN q_record.sort_order IN (4, 5) THEN 2  -- True/False questions
                        ELSE 4  -- Regular multiple choice questions
                    END
                ELSE 0
            END;
    END LOOP;
    
    RAISE NOTICE '=== Fix Complete - IELTS Reading should now work correctly ===';
END $$;

-- Show final data for verification
SELECT 
    'Final Verification:' as info,
    ps.title as set_title,
    pq.sort_order as question_order,
    pq.question_type,
    pq.question_text,
    COUNT(pc.id) as choice_count
FROM practice_sets ps
JOIN practice_questions pq ON ps.id = pq.set_id
LEFT JOIN practice_choices pc ON pq.id = pc.question_id
WHERE ps.test_id = (SELECT id FROM practice_tests WHERE slug = 'ielts')
AND ps.section = 'reading'
GROUP BY ps.title, pq.sort_order, pq.question_type, pq.question_text
ORDER BY pq.sort_order; 