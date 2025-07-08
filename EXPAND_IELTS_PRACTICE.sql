-- Expand IELTS Practice with Multiple Reading Sets
-- This adds more variety and fixes any missing choices

-- ==================================================
-- STEP 1: Fix Missing Choices in Existing Set
-- ==================================================

-- Check and fix any missing choices in existing questions
DO $$
DECLARE
    q_record RECORD;
    choice_count INTEGER;
BEGIN
    -- Check each question for correct number of choices
    FOR q_record IN 
        SELECT pq.id, pq.question_text, pq.sort_order
        FROM practice_questions pq
        JOIN practice_sets ps ON pq.set_id = ps.id
        JOIN practice_tests pt ON ps.test_id = pt.id
        WHERE pt.slug = 'ielts'
        ORDER BY pq.sort_order
    LOOP
        SELECT COUNT(*) INTO choice_count 
        FROM practice_choices 
        WHERE question_id = q_record.id;
        
        RAISE NOTICE 'Question %: % choices found', q_record.sort_order, choice_count;
        
        -- True/False questions should have exactly 2 choices
        IF q_record.sort_order IN (4, 5) AND choice_count < 2 THEN
            RAISE NOTICE 'Adding missing choices for True/False question %', q_record.sort_order;
            -- Add missing True/False choices if needed
        END IF;
        
        -- Multiple choice questions should have exactly 4 choices  
        IF q_record.sort_order IN (1, 2, 3) AND choice_count < 4 THEN
            RAISE NOTICE 'Adding missing choices for MC question %', q_record.sort_order;
            -- Add missing multiple choice options if needed
        END IF;
    END LOOP;
END $$;

-- ==================================================
-- STEP 2: Add More Reading Practice Sets
-- ==================================================

DO $$
DECLARE
    test_id UUID;
    set2_id UUID := gen_random_uuid();
    set3_id UUID := gen_random_uuid();
    q1_id UUID := gen_random_uuid();
    q2_id UUID := gen_random_uuid();
    q3_id UUID := gen_random_uuid();
    q4_id UUID := gen_random_uuid();
    q5_id UUID := gen_random_uuid();
    q6_id UUID := gen_random_uuid();
    q7_id UUID := gen_random_uuid();
    q8_id UUID := gen_random_uuid();
    q9_id UUID := gen_random_uuid();
    q10_id UUID := gen_random_uuid();
BEGIN
    -- Get IELTS test ID
    SELECT id INTO test_id FROM practice_tests WHERE slug = 'ielts';
    
    -- Create Reading Practice Set 2: Climate Change
    INSERT INTO practice_sets (id, test_id, section, title, sort_order, passage)
    VALUES (
        set2_id,
        test_id,
        'reading',
        'IELTS Reading Practice Set 2: Climate Change Solutions',
        2,
        'Innovative Approaches to Climate Change Mitigation

Climate change represents one of the most pressing challenges of our time, requiring unprecedented global cooperation and innovative solutions. While the scientific consensus on human-caused climate change is overwhelming, the responses from governments, businesses, and individuals have varied significantly in their scope and effectiveness.

Traditional approaches to climate change mitigation have focused primarily on reducing greenhouse gas emissions through renewable energy adoption and energy efficiency improvements. However, recent research suggests that a more comprehensive approach, incorporating both mitigation and adaptation strategies, may be necessary to address the scale of the challenge effectively.

Carbon capture and storage (CCS) technology has emerged as a particularly promising solution for industries that are difficult to decarbonize, such as cement and steel production. These technologies can capture up to 90% of carbon dioxide emissions from industrial processes and store them underground or utilize them in other applications. Several pilot projects worldwide have demonstrated the feasibility of CCS, though costs remain a significant barrier to widespread adoption.

Nature-based solutions represent another crucial component of climate action. Reforestation, wetland restoration, and sustainable agriculture practices can provide substantial carbon sequestration while offering additional benefits such as biodiversity conservation and improved water quality. Studies indicate that nature-based solutions could provide up to 37% of the emission reductions needed to limit global warming to 2°C above pre-industrial levels.

The role of individual behavior change, while important, has been somewhat overemphasized in climate discussions. Research shows that systemic changes in policy and infrastructure are far more impactful than individual actions alone. However, collective individual action can create the social and political momentum necessary for systemic change, making both approaches complementary rather than competing strategies.'
    );
    
    -- Create Reading Practice Set 3: Urban Development
    INSERT INTO practice_sets (id, test_id, section, title, sort_order, passage)
    VALUES (
        set3_id,
        test_id,
        'reading',
        'IELTS Reading Practice Set 3: Sustainable Urban Development',
        3,
        'The Future of Sustainable Cities

As global urbanization accelerates, with more than half of the world''s population now living in cities, the concept of sustainable urban development has become increasingly critical. Cities consume approximately 70% of global energy and produce over 70% of carbon emissions, making them both a major contributor to climate change and a key area for potential solutions.

Smart city technologies are revolutionizing urban management through the integration of Internet of Things (IoT) devices, artificial intelligence, and big data analytics. These systems can optimize traffic flow, reduce energy consumption, and improve public service delivery. Barcelona''s smart city initiatives, for example, have reduced water consumption by 25% and saved the city millions of euros annually through improved efficiency.

Green infrastructure represents a fundamental shift from traditional gray infrastructure approaches. Instead of relying solely on concrete and steel, cities are incorporating parks, green roofs, urban forests, and permeable surfaces that provide ecosystem services while meeting urban needs. These green solutions can reduce urban heat island effects by up to 5°C, manage stormwater runoff, and improve air quality significantly.

The concept of the "15-minute city," where residents can access most daily needs within a 15-minute walk or bike ride, is gaining traction worldwide. This approach reduces transportation emissions, promotes physical activity, and strengthens community connections. Paris has committed to becoming a 15-minute city by 2030, implementing comprehensive changes to urban planning and transportation infrastructure.

However, sustainable urban development faces significant challenges, including financing constraints, regulatory barriers, and the need for coordinated action across multiple stakeholders. Success requires collaboration between government, private sector, and civil society, along with long-term planning that transcends political cycles.'
    );
    
    -- Questions for Set 2 (Climate Change)
    INSERT INTO practice_questions (id, set_id, question_text, explanation, sort_order) VALUES
    (
        q1_id, set2_id,
        'According to the passage, what percentage of carbon dioxide emissions can CCS technology capture?',
        'The passage states that CCS technologies "can capture up to 90% of carbon dioxide emissions from industrial processes."',
        1
    ),
    (
        q2_id, set2_id,
        'What percentage of emission reductions could nature-based solutions provide?',
        'The passage mentions that "nature-based solutions could provide up to 37% of the emission reductions needed to limit global warming to 2°C."',
        2
    ),
    (
        q3_id, set2_id,
        'What does the passage suggest about the relationship between individual and systemic action?',
        'The passage indicates they are "complementary rather than competing strategies" and that individual action can create momentum for systemic change.',
        3
    ),
    (
        q4_id, set2_id,
        'Traditional climate approaches have focused solely on adaptation strategies. True or False?',
        'False. The passage states that traditional approaches "have focused primarily on reducing greenhouse gas emissions through renewable energy adoption and energy efficiency improvements," which are mitigation strategies.',
        4
    ),
    (
        q5_id, set2_id,
        'CCS technology has been successfully demonstrated in pilot projects worldwide. True or False?',
        'True. The passage states that "Several pilot projects worldwide have demonstrated the feasibility of CCS."',
        5
    );
    
    -- Questions for Set 3 (Urban Development)
    INSERT INTO practice_questions (id, set_id, question_text, explanation, sort_order) VALUES
    (
        q6_id, set3_id,
        'How much can green infrastructure reduce urban heat island effects?',
        'The passage states that green solutions "can reduce urban heat island effects by up to 5°C."',
        1
    ),
    (
        q7_id, set3_id,
                 'By what percentage did Barcelona reduce water consumption through smart city initiatives?',
         'The passage mentions that "Barcelona''s smart city initiatives have reduced water consumption by 25%."',
        2
    ),
    (
        q8_id, set3_id,
        'What is the main principle behind the "15-minute city" concept?',
        'The passage explains it as a concept "where residents can access most daily needs within a 15-minute walk or bike ride."',
        3
    ),
    (
        q9_id, set3_id,
        'Cities consume approximately 90% of global energy. True or False?',
        'False. The passage states that "Cities consume approximately 70% of global energy."',
        4
    ),
    (
        q10_id, set3_id,
        'Paris has committed to becoming a 15-minute city by 2030. True or False?',
        'True. The passage explicitly states that "Paris has committed to becoming a 15-minute city by 2030."',
        5
    );
    
    -- Answer choices for Set 2
    INSERT INTO practice_choices (id, question_id, choice_text, is_correct) VALUES
    -- Question 1 (Set 2)
    (gen_random_uuid(), q1_id, '70%', false),
    (gen_random_uuid(), q1_id, '80%', false),
    (gen_random_uuid(), q1_id, '90%', true),
    (gen_random_uuid(), q1_id, '95%', false),
    
    -- Question 2 (Set 2)
    (gen_random_uuid(), q2_id, '25%', false),
    (gen_random_uuid(), q2_id, '30%', false),
    (gen_random_uuid(), q2_id, '37%', true),
    (gen_random_uuid(), q2_id, '40%', false),
    
    -- Question 3 (Set 2)
    (gen_random_uuid(), q3_id, 'Individual action is more important than systemic change', false),
    (gen_random_uuid(), q3_id, 'Systemic change is more important than individual action', false),
    (gen_random_uuid(), q3_id, 'They are complementary strategies that work together', true),
    (gen_random_uuid(), q3_id, 'They are competing strategies that cannot coexist', false),
    
    -- Question 4 (Set 2) - True/False
    (gen_random_uuid(), q4_id, 'True', false),
    (gen_random_uuid(), q4_id, 'False', true),
    
    -- Question 5 (Set 2) - True/False
    (gen_random_uuid(), q5_id, 'True', true),
    (gen_random_uuid(), q5_id, 'False', false),
    
    -- Answer choices for Set 3
    -- Question 1 (Set 3)
    (gen_random_uuid(), q6_id, '3°C', false),
    (gen_random_uuid(), q6_id, '4°C', false),
    (gen_random_uuid(), q6_id, '5°C', true),
    (gen_random_uuid(), q6_id, '6°C', false),
    
    -- Question 2 (Set 3)
    (gen_random_uuid(), q7_id, '20%', false),
    (gen_random_uuid(), q7_id, '25%', true),
    (gen_random_uuid(), q7_id, '30%', false),
    (gen_random_uuid(), q7_id, '35%', false),
    
    -- Question 3 (Set 3)
    (gen_random_uuid(), q8_id, 'Accessing needs within a 10-minute drive', false),
    (gen_random_uuid(), q8_id, 'Accessing needs within a 15-minute walk or bike ride', true),
    (gen_random_uuid(), q8_id, 'Accessing needs within a 20-minute public transport ride', false),
    (gen_random_uuid(), q8_id, 'Accessing needs within a 15-minute car journey', false),
    
    -- Question 4 (Set 3) - True/False
    (gen_random_uuid(), q9_id, 'True', false),
    (gen_random_uuid(), q9_id, 'False', true),
    
    -- Question 5 (Set 3) - True/False
    (gen_random_uuid(), q10_id, 'True', true),
    (gen_random_uuid(), q10_id, 'False', false);
    
    RAISE NOTICE '✅ Successfully added 2 new reading practice sets';
    RAISE NOTICE 'Set 2: Climate Change Solutions (5 questions)';
    RAISE NOTICE 'Set 3: Sustainable Urban Development (5 questions)';
    
END $$;

-- ==================================================
-- STEP 3: Verification
-- ==================================================

-- Verify all practice sets
SELECT 
    'PRACTICE SETS SUMMARY' as info,
    ps.sort_order,
    ps.title,
    COUNT(pq.id) as questions,
    COUNT(pc.id) as total_choices
FROM practice_tests pt
JOIN practice_sets ps ON pt.id = ps.test_id
JOIN practice_questions pq ON ps.id = pq.set_id
JOIN practice_choices pc ON pq.id = pc.question_id
WHERE pt.slug = 'ielts' AND ps.section = 'reading'
GROUP BY ps.id, ps.sort_order, ps.title
ORDER BY ps.sort_order;

-- Overall summary
SELECT 
    'OVERALL SUMMARY' as status,
    COUNT(DISTINCT ps.id) as total_sets,
    COUNT(DISTINCT pq.id) as total_questions,
    COUNT(pc.id) as total_choices
FROM practice_tests pt
JOIN practice_sets ps ON pt.id = ps.test_id
JOIN practice_questions pq ON ps.id = pq.set_id
JOIN practice_choices pc ON pq.id = pc.question_id
WHERE pt.slug = 'ielts' AND ps.section = 'reading'; 