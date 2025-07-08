-- ACTIVATE IELTS WRITING & SPEAKING PRACTICE
-- Run this SQL script on your Supabase database to activate the new sections

-- First, get or create the IELTS test with proper UUID handling
DO $$
DECLARE
    ielts_test_id UUID;
BEGIN
    -- Check if IELTS test already exists
    SELECT id INTO ielts_test_id FROM practice_tests WHERE slug = 'ielts' LIMIT 1;
    
    -- If it doesn't exist, create it
    IF ielts_test_id IS NULL THEN
        INSERT INTO practice_tests (slug, name, description)
        VALUES (
            'ielts', 
            'IELTS Academic Practice Test',
            'Complete IELTS Academic practice test with Reading, Listening, Writing, and Speaking sections'
        ) RETURNING id INTO ielts_test_id;
        
        RAISE NOTICE 'Created new IELTS test with ID: %', ielts_test_id;
    ELSE
        RAISE NOTICE 'Found existing IELTS test with ID: %', ielts_test_id;
    END IF;
END $$;

-- ===============================
-- WRITING SECTION (2 Practice Sets)
-- ===============================

-- Insert Writing Practice Sets using dynamic IELTS test ID
DO $$
DECLARE
    ielts_test_id UUID;
    writing_task1_id UUID;
    writing_task2_id UUID;
BEGIN
    -- Get the IELTS test ID
    SELECT id INTO ielts_test_id FROM practice_tests WHERE slug = 'ielts' LIMIT 1;
    
    IF ielts_test_id IS NULL THEN
        RAISE EXCEPTION 'IELTS test not found. Please ensure the test exists first.';
    END IF;
    
    -- Check if Writing Task 1 set exists, if not create it
    SELECT id INTO writing_task1_id 
    FROM practice_sets 
    WHERE test_id = ielts_test_id AND section = 'writing' AND title = 'IELTS Writing Task 1: Data Description';
    
    IF writing_task1_id IS NULL THEN
        INSERT INTO practice_sets (test_id, section, title, sort_order)
        VALUES (ielts_test_id, 'writing', 'IELTS Writing Task 1: Data Description', 20)
        RETURNING id INTO writing_task1_id;
    END IF;
    
    -- Check if Writing Task 2 set exists, if not create it
    SELECT id INTO writing_task2_id 
    FROM practice_sets 
    WHERE test_id = ielts_test_id AND section = 'writing' AND title = 'IELTS Writing Task 2: Opinion Essays';
    
    IF writing_task2_id IS NULL THEN
        INSERT INTO practice_sets (test_id, section, title, sort_order)
        VALUES (ielts_test_id, 'writing', 'IELTS Writing Task 2: Opinion Essays', 21)
        RETURNING id INTO writing_task2_id;
    END IF;
    
    RAISE NOTICE 'Created/updated writing practice sets';
    RAISE NOTICE 'Task 1 Set ID: %', writing_task1_id;
    RAISE NOTICE 'Task 2 Set ID: %', writing_task2_id;
END $$;

-- Writing Task 1 Questions
DO $$
DECLARE
    writing_task1_id UUID;
BEGIN
    -- Get Writing Task 1 set ID
    SELECT ps.id INTO writing_task1_id 
    FROM practice_sets ps 
    JOIN practice_tests pt ON ps.test_id = pt.id 
    WHERE pt.slug = 'ielts' AND ps.title LIKE '%Task 1%' 
    LIMIT 1;
    
    IF writing_task1_id IS NULL THEN
        RAISE EXCEPTION 'Writing Task 1 practice set not found';
    END IF;
    
    -- Insert questions for Task 1
    INSERT INTO practice_questions (set_id, question_text, explanation, question_type, sort_order, metadata)
    VALUES 
      (
        writing_task1_id,
        'The chart below shows the percentage of households with different types of internet connections in Country X from 2010 to 2020. Summarize the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        'Key assessment criteria: 1) Task Achievement - address all parts of the task, 2) Coherence and Cohesion - logical organization, 3) Lexical Resource - appropriate vocabulary, 4) Grammatical Range and Accuracy - varied and accurate grammar. Focus on: overview of trends, key data points, comparisons between different connection types.',
        'essay',
        1,
        '{"task_type": "chart_description", "word_limit": 150, "time_limit": 1200, "assessment_focus": ["task_achievement", "coherence", "vocabulary", "grammar"]}'::jsonb
      ),
      (
        writing_task1_id,
        'The line graph below shows energy consumption by fuel type in a European country between 1980 and 2020. Summarize the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        'Structure your response: 1) Introduction - paraphrase the question, 2) Overview - main trends without specific data, 3) Body paragraphs - detailed analysis with specific figures and comparisons. Use linking words and varied vocabulary for describing trends.',
        'essay',
        2,
        '{"task_type": "line_graph", "word_limit": 150, "time_limit": 1200, "key_skills": ["data_interpretation", "trend_description", "comparison"]}'::jsonb
      ),
      (
        writing_task1_id,
        'The diagram below shows the process of manufacturing chocolate from cocoa beans. Summarize the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
        'For process diagrams: 1) Use sequence words (first, then, next, finally), 2) Use passive voice appropriately, 3) Describe each stage clearly, 4) Don''t add information not shown in the diagram.',
        'essay',
        3,
        '{"task_type": "process_diagram", "word_limit": 150, "time_limit": 1200, "key_skills": ["process_description", "sequencing", "passive_voice"]}'::jsonb
      )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Inserted Writing Task 1 questions for set ID: %', writing_task1_id;
END $$;

-- Writing Task 2 Questions  
DO $$
DECLARE
    writing_task2_id UUID;
BEGIN
    -- Get Writing Task 2 set ID
    SELECT ps.id INTO writing_task2_id 
    FROM practice_sets ps 
    JOIN practice_tests pt ON ps.test_id = pt.id 
    WHERE pt.slug = 'ielts' AND ps.title LIKE '%Task 2%' 
    LIMIT 1;
    
    IF writing_task2_id IS NULL THEN
        RAISE EXCEPTION 'Writing Task 2 practice set not found';
    END IF;
    
    -- Insert questions for Task 2
    INSERT INTO practice_questions (set_id, question_text, explanation, question_type, sort_order, metadata)
    VALUES 
      (
        writing_task2_id,
        'Some people believe that universities should focus on providing practical skills rather than theoretical knowledge. To what extent do you agree or disagree with this statement? Give reasons for your answer and include any relevant examples from your own knowledge or experience. Write at least 250 words.',
        'This is an opinion essay requiring you to: 1) Present a clear position, 2) Support your arguments with examples and reasoning, 3) Consider different perspectives, 4) Demonstrate critical thinking. Structure: Introduction with thesis statement, body paragraphs with topic sentences and supporting details, conclusion summarizing your position.',
        'essay',
        1,
        '{"task_type": "opinion_essay", "word_limit": 250, "time_limit": 2400, "essay_structure": ["introduction", "body_paragraphs", "conclusion"], "skills": ["argumentation", "critical_thinking", "examples"]}'::jsonb
      ),
      (
        writing_task2_id,
        'In many countries, the proportion of older people is steadily increasing. Does this trend have more positive or negative effects on society? Discuss both views and give your own opinion. Write at least 250 words.',
        'This is a discussion essay requiring balanced analysis: 1) Discuss positive effects of aging population, 2) Discuss negative effects, 3) Give your own opinion with justification. Consider economic, social, and healthcare implications. Use specific examples and demonstrate understanding of complex issues.',
        'essay',
        2,
        '{"task_type": "discussion_essay", "word_limit": 250, "time_limit": 2400, "required_elements": ["positive_effects", "negative_effects", "personal_opinion"], "topics": ["economics", "healthcare", "social_impact"]}'::jsonb
      ),
      (
        writing_task2_id,
        'Some people think that children should be taught to compete, while others believe that children should be taught to cooperate. Discuss both these views and give your own opinion. Write at least 250 words.',
        'Balance discussion: Present arguments for competition (builds resilience, prepares for real world) and cooperation (builds social skills, creates harmony). Give your opinion with clear reasoning and examples from education, sports, or workplace scenarios.',
        'essay',
        3,
        '{"task_type": "discussion_essay", "word_limit": 250, "time_limit": 2400, "required_elements": ["competition_benefits", "cooperation_benefits", "personal_opinion"], "topics": ["education", "child_development", "social_skills"]}'::jsonb
      )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Inserted Writing Task 2 questions for set ID: %', writing_task2_id;
END $$;

-- ===============================
-- SPEAKING SECTION (3 Practice Sets)
-- ===============================

-- Insert Speaking Practice Sets using dynamic IELTS test ID
DO $$
DECLARE
    ielts_test_id UUID;
    speaking_part1_id UUID;
    speaking_part2_id UUID;
    speaking_part3_id UUID;
BEGIN
    -- Get the IELTS test ID
    SELECT id INTO ielts_test_id FROM practice_tests WHERE slug = 'ielts' LIMIT 1;
    
    IF ielts_test_id IS NULL THEN
        RAISE EXCEPTION 'IELTS test not found. Please ensure the test exists first.';
    END IF;
    
    -- Check if Speaking Part 1 set exists, if not create it
    SELECT id INTO speaking_part1_id 
    FROM practice_sets 
    WHERE test_id = ielts_test_id AND section = 'speaking' AND title = 'IELTS Speaking Part 1: Personal Questions';
    
    IF speaking_part1_id IS NULL THEN
        INSERT INTO practice_sets (test_id, section, title, sort_order)
        VALUES (ielts_test_id, 'speaking', 'IELTS Speaking Part 1: Personal Questions', 30)
        RETURNING id INTO speaking_part1_id;
    END IF;
    
    -- Check if Speaking Part 2 set exists, if not create it
    SELECT id INTO speaking_part2_id 
    FROM practice_sets 
    WHERE test_id = ielts_test_id AND section = 'speaking' AND title = 'IELTS Speaking Part 2: Individual Long Turn';
    
    IF speaking_part2_id IS NULL THEN
        INSERT INTO practice_sets (test_id, section, title, sort_order)
        VALUES (ielts_test_id, 'speaking', 'IELTS Speaking Part 2: Individual Long Turn', 31)
        RETURNING id INTO speaking_part2_id;
    END IF;
    
    -- Check if Speaking Part 3 set exists, if not create it
    SELECT id INTO speaking_part3_id 
    FROM practice_sets 
    WHERE test_id = ielts_test_id AND section = 'speaking' AND title = 'IELTS Speaking Part 3: Discussion';
    
    IF speaking_part3_id IS NULL THEN
        INSERT INTO practice_sets (test_id, section, title, sort_order)
        VALUES (ielts_test_id, 'speaking', 'IELTS Speaking Part 3: Discussion', 32)
        RETURNING id INTO speaking_part3_id;
    END IF;
    
    RAISE NOTICE 'Created/updated speaking practice sets';
    RAISE NOTICE 'Part 1 Set ID: %', speaking_part1_id;
    RAISE NOTICE 'Part 2 Set ID: %', speaking_part2_id;
    RAISE NOTICE 'Part 3 Set ID: %', speaking_part3_id;
END $$;

-- Speaking Part 1 Questions
DO $$
DECLARE
    speaking_part1_id UUID;
BEGIN
    -- Get Speaking Part 1 set ID
    SELECT ps.id INTO speaking_part1_id 
    FROM practice_sets ps 
    JOIN practice_tests pt ON ps.test_id = pt.id 
    WHERE pt.slug = 'ielts' AND ps.title LIKE '%Part 1%' 
    LIMIT 1;
    
    IF speaking_part1_id IS NULL THEN
        RAISE EXCEPTION 'Speaking Part 1 practice set not found';
    END IF;
    
    -- Insert questions for Part 1
    INSERT INTO practice_questions (set_id, question_text, explanation, question_type, sort_order, metadata)
    VALUES 
      (
        speaking_part1_id,
        'Tell me about your hometown. What is it like? What do you like most about living there?',
        'Part 1 questions are personal and familiar topics. Speak naturally for 1-2 minutes total. Assessment criteria: Fluency and coherence, pronunciation, lexical resource, grammatical range and accuracy. Tips: Give extended answers with examples, use varied vocabulary, speak clearly.',
        'speaking_prompt',
        1,
        '{"part": 1, "time_limit": 120, "topic": "hometown", "difficulty": "basic", "skills": ["fluency", "pronunciation", "vocabulary", "grammar"]}'::jsonb
      ),
      (
        speaking_part1_id,
        'Do you prefer to study in the morning or in the evening? Why?',
        'Express your preference clearly and give reasons. Use comparative language and personal examples. This tests your ability to express preferences and justify choices using appropriate language.',
        'speaking_prompt',
        2,
        '{"part": 1, "time_limit": 60, "topic": "study_habits", "difficulty": "basic", "focus": ["preferences", "justification", "personal_experience"]}'::jsonb
      ),
      (
        speaking_part1_id,
        'What kind of music do you like? How often do you listen to music?',
        'Part 1 questions should elicit personal information. Practice expressing preferences, frequency, and giving reasons. Use appropriate vocabulary for music genres and time expressions.',
        'speaking_prompt',
        3,
        '{"part": 1, "time_limit": 90, "topic": "music", "difficulty": "basic", "skills": ["preferences", "frequency_expressions", "personal_interests"]}'::jsonb
      )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Inserted Speaking Part 1 questions for set ID: %', speaking_part1_id;
END $$;

-- Speaking Part 2 Questions
DO $$
DECLARE
    speaking_part2_id UUID;
BEGIN
    -- Get Speaking Part 2 set ID
    SELECT ps.id INTO speaking_part2_id 
    FROM practice_sets ps 
    JOIN practice_tests pt ON ps.test_id = pt.id 
    WHERE pt.slug = 'ielts' AND ps.title LIKE '%Part 2%' 
    LIMIT 1;
    
    IF speaking_part2_id IS NULL THEN
        RAISE EXCEPTION 'Speaking Part 2 practice set not found';
    END IF;
    
    -- Insert questions for Part 2
    INSERT INTO practice_questions (set_id, question_text, explanation, question_type, sort_order, metadata)
    VALUES 
      (
        speaking_part2_id,
        'Describe a technological device that you find useful. You should say: what the device is, when and how you use it, what you use it for, and explain why you find it useful.',
        'Part 2 is an individual long turn. You have 1 minute to prepare and should speak for 1-2 minutes. Structure your answer around the bullet points provided. Use descriptive language, examples, and personal experiences. Maintain fluency even if you make minor errors.',
        'speaking_prompt',
        1,
        '{"part": 2, "preparation_time": 60, "speaking_time": 120, "topic": "technology", "structure": ["what", "when_how", "purpose", "explanation"], "difficulty": "intermediate"}'::jsonb
      ),
      (
        speaking_part2_id,
        'Describe a book that you enjoyed reading. You should say: what the book was about, when you read it, why you chose to read it, and explain what you liked about this book.',
        'Cover all bullet points systematically. Use past tenses appropriately when describing when you read it. Include specific details about the plot, characters, or themes that made it enjoyable.',
        'speaking_prompt',
        2,
        '{"part": 2, "preparation_time": 60, "speaking_time": 120, "topic": "books_reading", "structure": ["content", "timing", "choice_reason", "positive_aspects"], "difficulty": "intermediate"}'::jsonb
      ),
      (
        speaking_part2_id,
        'Describe a place you visited that was particularly memorable. You should say: where it was, when you went there, who you went with, and explain why it was so memorable.',
        'Use vivid descriptive language to paint a picture of the place. Include sensory details (what you saw, heard, felt). Explain the emotional impact and why it stays in your memory.',
        'speaking_prompt',
        3,
        '{"part": 2, "preparation_time": 60, "speaking_time": 120, "topic": "travel_places", "structure": ["location", "timing", "companions", "memorable_aspects"], "difficulty": "intermediate"}'::jsonb
      )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Inserted Speaking Part 2 questions for set ID: %', speaking_part2_id;
END $$;

-- Speaking Part 3 Questions  
DO $$
DECLARE
    speaking_part3_id UUID;
BEGIN
    -- Get Speaking Part 3 set ID
    SELECT ps.id INTO speaking_part3_id 
    FROM practice_sets ps 
    JOIN practice_tests pt ON ps.test_id = pt.id 
    WHERE pt.slug = 'ielts' AND ps.title LIKE '%Part 3%' 
    LIMIT 1;
    
    IF speaking_part3_id IS NULL THEN
        RAISE EXCEPTION 'Speaking Part 3 practice set not found';
    END IF;
    
    -- Insert questions for Part 3
    INSERT INTO practice_questions (set_id, question_text, explanation, question_type, sort_order, metadata)
    VALUES 
      (
        speaking_part3_id,
        'How do you think technology will change education in the future?',
        'Part 3 involves abstract discussion related to Part 2 topic. Demonstrate ability to: express and justify opinions, speculate about future trends, compare different perspectives, use advanced vocabulary and complex grammar structures. Speak for 4-5 minutes total in this section.',
        'speaking_prompt',
        1,
        '{"part": 3, "time_limit": 300, "topic": "technology_education", "difficulty": "advanced", "skills": ["speculation", "opinion", "analysis", "future_trends"]}'::jsonb
      ),
      (
        speaking_part3_id,
        'Do you think reading books is still important in the digital age? Why or why not?',
        'Discuss the relevance of traditional reading versus digital media. Consider cognitive benefits, accessibility, and changing literacy habits. Present balanced arguments and support with examples.',
        'speaking_prompt',
        2,
        '{"part": 3, "time_limit": 180, "topic": "reading_digital_age", "difficulty": "advanced", "skills": ["argumentation", "comparison", "cultural_analysis", "evidence_support"]}'::jsonb
      ),
      (
        speaking_part3_id,
        'What are the advantages and disadvantages of mass tourism for local communities?',
        'Analyze economic, cultural, and environmental impacts. Discuss both positive effects (job creation, cultural exchange) and negative effects (overcrowding, cultural commercialization). Use specific examples from different countries or regions.',
        'speaking_prompt',
        3,
        '{"part": 3, "time_limit": 240, "topic": "tourism_impact", "difficulty": "advanced", "skills": ["impact_analysis", "examples", "economic_understanding", "cultural_awareness"]}'::jsonb
      )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Inserted Speaking Part 3 questions for set ID: %', speaking_part3_id;
END $$;

-- ===============================
-- VERIFICATION QUERY
-- ===============================

-- Check what we've created
SELECT 
    'Writing & Speaking Practice Sets Created Successfully!' as status,
    COUNT(DISTINCT ps.id) as total_sets,
    COUNT(DISTINCT pq.id) as total_questions
FROM practice_tests pt
JOIN practice_sets ps ON pt.id = ps.test_id
LEFT JOIN practice_questions pq ON ps.id = pq.set_id
WHERE pt.slug = 'ielts' 
AND ps.section IN ('writing', 'speaking');

-- ===============================
-- ACTIVATION COMPLETE
-- ===============================

DO $$
BEGIN
    RAISE NOTICE '✅ IELTS Writing & Speaking sections activated successfully!';
    RAISE NOTICE 'Available sections:';
    RAISE NOTICE '- Reading Practice (3 sets) ✅';
    RAISE NOTICE '- Writing Practice (Task 1 & Task 2) ✅ NEW!';
    RAISE NOTICE '- Speaking Practice (Parts 1, 2 & 3) ✅ NEW!';
    RAISE NOTICE '- Listening Practice (Coming Soon)';
    RAISE NOTICE '';
    RAISE NOTICE 'Access URLs:';
    RAISE NOTICE '- Reading: /practice/ielts/reading';
    RAISE NOTICE '- Writing: /practice/ielts/writing';
    RAISE NOTICE '- Speaking: /practice/ielts/speaking';
END $$; 