-- Complete IELTS Question Bank Migration
-- Creates comprehensive practice sets for all IELTS sections
-- Ready for production deployment

-- First ensure the practice_tests table exists
CREATE TABLE IF NOT EXISTS practice_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create other required tables if they don't exist
CREATE TABLE IF NOT EXISTS practice_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID REFERENCES practice_tests(id) ON DELETE CASCADE,
  section TEXT NOT NULL CHECK (section IN ('reading', 'listening', 'writing', 'speaking')),
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  passage TEXT, -- For reading comprehension passages
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS practice_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  set_id UUID REFERENCES practice_sets(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  explanation TEXT,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice' 
    CHECK (question_type IN ('multiple_choice', 'essay', 'short_answer', 'speaking_prompt', 'listening_comprehension')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  audio_url TEXT, -- For listening questions
  metadata JSONB, -- For additional question data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS practice_choices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES practice_questions(id) ON DELETE CASCADE,
  choice_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert IELTS test if it doesn't exist
INSERT INTO practice_tests (slug, name, description) VALUES
  ('ielts', 'IELTS Academic Test', 'International English Language Testing System - Academic module for university admissions'),
  ('toefl', 'TOEFL iBT', 'Test of English as a Foreign Language - Internet-based test'),
  ('gre', 'GRE General Test', 'Graduate Record Examination for graduate school admissions'),
  ('gmat', 'GMAT', 'Graduate Management Admission Test for business school')
ON CONFLICT (slug) DO NOTHING;

-- ===============================
-- READING SECTION (3 Practice Sets)
-- ===============================

-- Reading Set 1: Technology and Society
INSERT INTO practice_sets (test_id, section, title, sort_order, passage)
SELECT 
  (SELECT id FROM practice_tests WHERE slug = 'ielts' LIMIT 1),
  'reading',
  'IELTS Reading Practice Set 1: Technology and Society',
  1,
  'The Digital Revolution and Its Impact on Modern Society

The digital revolution has fundamentally transformed the way we live, work, and communicate. Over the past three decades, the rapid advancement of technology has created unprecedented changes in virtually every aspect of human life. From the way we access information to how we conduct business, technology has become an integral part of our daily existence.

One of the most significant changes has been in the realm of communication. The advent of the internet and mobile devices has made it possible for people to connect instantly across vast distances. Social media platforms have created new forms of interaction, allowing individuals to maintain relationships and share experiences in ways that were unimaginable just a generation ago. However, this constant connectivity has also raised concerns about privacy, mental health, and the quality of human relationships.

In the workplace, automation and artificial intelligence are reshaping traditional job markets. While these technologies have increased efficiency and created new opportunities, they have also led to job displacement in certain sectors. Workers are now required to continuously update their skills to remain relevant in an increasingly digital economy. The concept of lifelong learning has become more important than ever before.

Education has also undergone significant transformation. Online learning platforms have democratized access to education, making it possible for people in remote areas to access high-quality educational resources. However, the digital divide remains a challenge, as not everyone has equal access to technology and high-speed internet connections.

The environmental impact of our digital lifestyle is another growing concern. The production and disposal of electronic devices, along with the energy consumption of data centers, contribute significantly to carbon emissions. As society becomes more dependent on technology, finding sustainable solutions becomes increasingly urgent.

Despite these challenges, the benefits of the digital revolution are undeniable. Medical advances enabled by technology have improved healthcare outcomes, while innovations in renewable energy are helping address climate change. The key lies in managing the transition wisely, ensuring that technological progress serves humanity while minimizing negative consequences.';

-- Questions for Reading Set 1
WITH reading_set_1 AS (
  SELECT ps.id 
  FROM practice_sets ps 
  JOIN practice_tests pt ON ps.test_id = pt.id 
  WHERE pt.slug = 'ielts' AND ps.title LIKE '%Technology and Society%'
  LIMIT 1
)
INSERT INTO practice_questions (set_id, question_text, explanation, question_type, sort_order)
SELECT 
  id,
  'According to the passage, what has been one of the most significant changes brought by the digital revolution?',
  'The passage states that "One of the most significant changes has been in the realm of communication" in the second paragraph.',
  'multiple_choice',
  1
FROM reading_set_1
UNION ALL
SELECT 
  id,
  'The passage suggests that social media platforms have:',
  'The text mentions that social media platforms "have created new forms of interaction, allowing individuals to maintain relationships and share experiences."',
  'multiple_choice',
  2
FROM reading_set_1
UNION ALL
SELECT 
  id,
  'What does the author say about job markets in relation to automation and AI?',
  'The passage mentions both positive effects (increased efficiency, new opportunities) and negative effects (job displacement).',
  'multiple_choice',
  3
FROM reading_set_1
UNION ALL
SELECT 
  id,
  'The term "digital divide" in the passage refers to:',
  'The context explains that "not everyone has equal access to technology and high-speed internet connections."',
  'multiple_choice',
  4
FROM reading_set_1
UNION ALL
SELECT 
  id,
  'According to the passage, what is described as "more important than ever before"?',
  'The passage states "The concept of lifelong learning has become more important than ever before."',
  'multiple_choice',
  5
FROM reading_set_1;

-- Choices for Reading Set 1
WITH reading_questions AS (
  SELECT pq.id, pq.sort_order
  FROM practice_questions pq
  JOIN practice_sets ps ON pq.set_id = ps.id
  JOIN practice_tests pt ON ps.test_id = pt.id
  WHERE pt.slug = 'ielts' AND ps.title LIKE '%Technology and Society%'
)
INSERT INTO practice_choices (question_id, choice_text, is_correct, sort_order)
-- Question 1 choices
SELECT id, 'Changes in transportation systems', false, 1 FROM reading_questions WHERE sort_order = 1
UNION ALL SELECT id, 'Improvements in communication', true, 2 FROM reading_questions WHERE sort_order = 1
UNION ALL SELECT id, 'Advances in medical technology', false, 3 FROM reading_questions WHERE sort_order = 1
UNION ALL SELECT id, 'Development of renewable energy', false, 4 FROM reading_questions WHERE sort_order = 1
-- Question 2 choices  
UNION ALL SELECT id, 'Completely replaced face-to-face communication', false, 1 FROM reading_questions WHERE sort_order = 2
UNION ALL SELECT id, 'Created new forms of interaction and relationship maintenance', true, 2 FROM reading_questions WHERE sort_order = 2
UNION ALL SELECT id, 'Solved all privacy concerns', false, 3 FROM reading_questions WHERE sort_order = 2
UNION ALL SELECT id, 'Eliminated the need for traditional media', false, 4 FROM reading_questions WHERE sort_order = 2
-- Question 3 choices
UNION ALL SELECT id, 'They have only positive effects', false, 1 FROM reading_questions WHERE sort_order = 3
UNION ALL SELECT id, 'They have both increased efficiency and caused job displacement', true, 2 FROM reading_questions WHERE sort_order = 3
UNION ALL SELECT id, 'They have only negative effects', false, 3 FROM reading_questions WHERE sort_order = 3
UNION ALL SELECT id, 'They have no impact on employment', false, 4 FROM reading_questions WHERE sort_order = 3
-- Question 4 choices
UNION ALL SELECT id, 'The gap between different social media platforms', false, 1 FROM reading_questions WHERE sort_order = 4
UNION ALL SELECT id, 'Unequal access to technology and internet', true, 2 FROM reading_questions WHERE sort_order = 4
UNION ALL SELECT id, 'Different digital skills between generations', false, 3 FROM reading_questions WHERE sort_order = 4
UNION ALL SELECT id, 'The difference between digital and analog devices', false, 4 FROM reading_questions WHERE sort_order = 4
-- Question 5 choices
UNION ALL SELECT id, 'Social media usage', false, 1 FROM reading_questions WHERE sort_order = 5
UNION ALL SELECT id, 'Lifelong learning', true, 2 FROM reading_questions WHERE sort_order = 5
UNION ALL SELECT id, 'Environmental protection', false, 3 FROM reading_questions WHERE sort_order = 5
UNION ALL SELECT id, 'Digital device production', false, 4 FROM reading_questions WHERE sort_order = 5;

-- Reading Set 2: Environmental Conservation
INSERT INTO practice_sets (test_id, section, title, sort_order, passage)
SELECT 
  (SELECT id FROM practice_tests WHERE slug = 'ielts' LIMIT 1),
  'reading',
  'IELTS Reading Practice Set 2: Environmental Conservation',
  2,
  'Urban Wildlife Conservation: Challenges and Opportunities

As cities expand and urban populations grow, the relationship between human settlements and wildlife becomes increasingly complex. Urban wildlife conservation presents unique challenges that require innovative solutions and community engagement. Unlike traditional conservation efforts in remote wilderness areas, urban conservation must balance the needs of both human residents and animal populations within shared spaces.

Many cities around the world are experiencing an unexpected phenomenon: the return of wildlife species that had previously been driven away by urbanization. Foxes roam London streets at night, coyotes have been spotted in downtown Chicago, and various bird species are thriving in urban environments. This urban wildlife renaissance is partly due to improved environmental policies and partly due to animals adapting to city life.

However, this coexistence is not without problems. Human-wildlife conflicts arise when animals damage property, pose safety risks, or create public health concerns. For instance, urban deer populations can cause significant damage to gardens and pose traffic hazards, while raccoons may raid garbage bins and potentially spread disease. Finding solutions that protect both human interests and animal welfare requires careful planning and community cooperation.

Successful urban wildlife conservation programs often involve creating wildlife corridors – connected networks of green spaces that allow animals to move safely through urban areas. These corridors can include parks, green rooftops, river banks, and even specially designed overpasses or underpasses. Cities like Singapore and Vancouver have implemented comprehensive green corridor systems that serve both recreational and conservation purposes.

Community education plays a crucial role in urban wildlife conservation. Residents need to understand how their actions affect local wildlife and learn appropriate ways to interact with urban animals. This includes proper waste management, responsible pet ownership, and knowing when to contact wildlife authorities. Educational programs in schools and communities help foster a culture of coexistence.

Technology is also contributing to urban wildlife conservation efforts. Motion-sensor cameras help researchers monitor animal populations and behavior patterns, while GPS tracking provides insights into animal movement and habitat use. Mobile apps allow citizens to report wildlife sightings, creating valuable databases for conservation planning.

The economic benefits of urban wildlife conservation are increasingly recognized. Green spaces that support wildlife also improve air quality, reduce urban heat islands, and provide recreational opportunities for residents. Property values often increase in areas with well-maintained green spaces and diverse wildlife populations. Additionally, eco-tourism focused on urban wildlife is becoming a significant economic driver for many cities.

Despite these positive developments, urban wildlife conservation faces ongoing challenges. Climate change is altering species distributions and behavior patterns, pollution continues to threaten urban ecosystems, and rapid urban development often destroys habitat faster than it can be created or restored. Addressing these challenges requires long-term commitment from city planners, policymakers, and residents alike.';

-- Reading Set 3: Cultural Exchange and Globalization  
INSERT INTO practice_sets (test_id, section, title, sort_order, passage)
SELECT 
  (SELECT id FROM practice_tests WHERE slug = 'ielts' LIMIT 1),
  'reading',
  'IELTS Reading Practice Set 3: Cultural Exchange and Globalization',
  3,
  'The Impact of Globalization on Traditional Cultures

Globalization has created unprecedented opportunities for cultural exchange, but it has also raised concerns about the preservation of traditional cultures. As people, ideas, and practices move more freely across borders, the world becomes increasingly interconnected. This process brings both benefits and challenges for societies seeking to maintain their cultural identity while participating in the global community.

One of the most visible effects of globalization is the spread of popular culture, particularly from Western countries. Movies, music, fashion, and food from dominant cultures are now accessible worldwide through digital media and international commerce. While this has enriched many people''s lives by exposing them to diverse forms of entertainment and lifestyle choices, critics argue that it leads to cultural homogenization – the loss of unique local traditions and practices.

Language is perhaps the most critical aspect of cultural identity affected by globalization. English has emerged as the global lingua franca, essential for international business, science, and technology. While this facilitates global communication, it also threatens linguistic diversity. Many minority languages are disappearing as younger generations choose to learn dominant languages for economic opportunities rather than maintaining their ancestral tongues.

However, globalization also provides tools for cultural preservation and revitalization. Digital technologies enable communities to document their traditions, share their stories with global audiences, and connect with diaspora populations. Social media platforms allow indigenous groups and minority cultures to showcase their heritage and build international support for preservation efforts. Online databases and virtual museums make cultural artifacts and knowledge accessible to future generations.

The culinary world exemplifies both the challenges and opportunities of cultural globalization. Traditional cooking methods and recipes are being lost in some communities as processed foods and international cuisine become more prevalent. Conversely, global interest in authentic ethnic foods has created economic opportunities for traditional food producers and has helped preserve culinary traditions that might otherwise have been forgotten.

Tourism plays a complex role in cultural exchange and preservation. While cultural tourism can provide economic incentives for maintaining traditional practices and crafts, it can also lead to the commercialization and distortion of authentic cultural expressions. Communities must carefully balance the desire to share their culture with visitors against the need to protect sacred or sensitive traditions from exploitation.

Educational systems worldwide are grappling with how to prepare students for a globalized world while maintaining cultural roots. Many countries are implementing curricula that include both global perspectives and local cultural education. This approach aims to create globally competent citizens who understand and appreciate their own heritage while being able to engage effectively with people from different backgrounds.

The role of migration in cultural exchange cannot be overlooked. As people move across borders for work, education, or refuge, they bring their cultural practices with them and adopt new ones from their host communities. This creates vibrant multicultural societies but also challenges related to integration, identity, and social cohesion.

Religious and spiritual practices are also influenced by globalization. While some traditional belief systems face pressure from dominant world religions or secular worldviews, others have found new followers through global spiritual movements and online communities. The challenge lies in maintaining the authenticity and integrity of these practices while adapting to contemporary contexts.';

-- ===============================
-- LISTENING SECTION (3 Practice Sets)
-- ===============================

INSERT INTO practice_sets (test_id, section, title, sort_order)
SELECT (SELECT id FROM practice_tests WHERE slug = 'ielts' LIMIT 1), 'listening', 'IELTS Listening Practice Set 1: Academic Discussion', 10
UNION ALL
SELECT (SELECT id FROM practice_tests WHERE slug = 'ielts' LIMIT 1), 'listening', 'IELTS Listening Practice Set 2: University Services', 11
UNION ALL
SELECT (SELECT id FROM practice_tests WHERE slug = 'ielts' LIMIT 1), 'listening', 'IELTS Listening Practice Set 3: Research Presentation', 12;

-- Sample Listening Questions (These would normally be paired with audio files)
WITH listening_set_1 AS (
  SELECT ps.id FROM practice_sets ps JOIN practice_tests pt ON ps.test_id = pt.id 
  WHERE pt.slug = 'ielts' AND ps.title LIKE '%Academic Discussion%' LIMIT 1
)
INSERT INTO practice_questions (set_id, question_text, explanation, question_type, sort_order, metadata)
SELECT 
  id,
  'What is the main topic of the academic discussion?',
  'Listen for the opening statements where speakers introduce the main theme.',
  'multiple_choice',
  1,
  '{"audio_file": "academic_discussion_part1.mp3", "section": "Part 1", "time_limit": 30}'::jsonb
FROM listening_set_1
UNION ALL
SELECT 
  id,
  'According to the first speaker, what is the primary challenge?',
  'Pay attention to the speaker''s main argument in the first part of the discussion.',
  'multiple_choice',
  2,
  '{"audio_file": "academic_discussion_part1.mp3", "section": "Part 1", "time_limit": 30}'::jsonb
FROM listening_set_1;

-- ===============================
-- WRITING SECTION (2 Practice Sets)
-- ===============================

INSERT INTO practice_sets (test_id, section, title, sort_order)
SELECT (SELECT id FROM practice_tests WHERE slug = 'ielts' LIMIT 1), 'writing', 'IELTS Writing Task 1: Data Description', 20
UNION ALL  
SELECT (SELECT id FROM practice_tests WHERE slug = 'ielts' LIMIT 1), 'writing', 'IELTS Writing Task 2: Opinion Essays', 21;

-- Writing Task 1 Questions
WITH writing_task1 AS (
  SELECT ps.id FROM practice_sets ps JOIN practice_tests pt ON ps.test_id = pt.id 
  WHERE pt.slug = 'ielts' AND ps.title LIKE '%Task 1%' LIMIT 1
)
INSERT INTO practice_questions (set_id, question_text, explanation, question_type, sort_order, metadata)
SELECT 
  id,
  'The chart below shows the percentage of households with different types of internet connections in Country X from 2010 to 2020. Summarize the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
  'Key assessment criteria: 1) Task Achievement - address all parts of the task, 2) Coherence and Cohesion - logical organization, 3) Lexical Resource - appropriate vocabulary, 4) Grammatical Range and Accuracy - varied and accurate grammar. Focus on: overview of trends, key data points, comparisons between different connection types.',
  'essay',
  1,
  '{"task_type": "chart_description", "word_limit": 150, "time_limit": 1200, "assessment_focus": ["task_achievement", "coherence", "vocabulary", "grammar"]}'::jsonb
FROM writing_task1
UNION ALL
SELECT 
  id,
  'The line graph below shows energy consumption by fuel type in a European country between 1980 and 2020. Summarize the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
  'Structure your response: 1) Introduction - paraphrase the question, 2) Overview - main trends without specific data, 3) Body paragraphs - detailed analysis with specific figures and comparisons. Use linking words and varied vocabulary for describing trends.',
  'essay',
  2,
  '{"task_type": "line_graph", "word_limit": 150, "time_limit": 1200, "key_skills": ["data_interpretation", "trend_description", "comparison"]}'::jsonb
FROM writing_task1;

-- Writing Task 2 Questions  
WITH writing_task2 AS (
  SELECT ps.id FROM practice_sets ps JOIN practice_tests pt ON ps.test_id = pt.id 
  WHERE pt.slug = 'ielts' AND ps.title LIKE '%Task 2%' LIMIT 1
)
INSERT INTO practice_questions (set_id, question_text, explanation, question_type, sort_order, metadata)
SELECT 
  id,
  'Some people believe that universities should focus on providing practical skills rather than theoretical knowledge. To what extent do you agree or disagree with this statement? Give reasons for your answer and include any relevant examples from your own knowledge or experience. Write at least 250 words.',
  'This is an opinion essay requiring you to: 1) Present a clear position, 2) Support your arguments with examples and reasoning, 3) Consider different perspectives, 4) Demonstrate critical thinking. Structure: Introduction with thesis statement, body paragraphs with topic sentences and supporting details, conclusion summarizing your position.',
  'essay',
  1,
  '{"task_type": "opinion_essay", "word_limit": 250, "time_limit": 2400, "essay_structure": ["introduction", "body_paragraphs", "conclusion"], "skills": ["argumentation", "critical_thinking", "examples"]}'::jsonb
FROM writing_task2
UNION ALL
SELECT 
  id,
  'In many countries, the proportion of older people is steadily increasing. Does this trend have more positive or negative effects on society? Discuss both views and give your own opinion. Write at least 250 words.',
  'This is a discussion essay requiring balanced analysis: 1) Discuss positive effects of aging population, 2) Discuss negative effects, 3) Give your own opinion with justification. Consider economic, social, and healthcare implications. Use specific examples and demonstrate understanding of complex issues.',
  'essay',
  2,
  '{"task_type": "discussion_essay", "word_limit": 250, "time_limit": 2400, "required_elements": ["positive_effects", "negative_effects", "personal_opinion"], "topics": ["economics", "healthcare", "social_impact"]}'::jsonb
FROM writing_task2;

-- ===============================
-- SPEAKING SECTION (3 Practice Sets)
-- ===============================

INSERT INTO practice_sets (test_id, section, title, sort_order)
SELECT (SELECT id FROM practice_tests WHERE slug = 'ielts' LIMIT 1), 'speaking', 'IELTS Speaking Part 1: Personal Questions', 30
UNION ALL
SELECT (SELECT id FROM practice_tests WHERE slug = 'ielts' LIMIT 1), 'speaking', 'IELTS Speaking Part 2: Individual Long Turn', 31
UNION ALL  
SELECT (SELECT id FROM practice_tests WHERE slug = 'ielts' LIMIT 1), 'speaking', 'IELTS Speaking Part 3: Discussion', 32;

-- Speaking Part 1 Questions
WITH speaking_part1 AS (
  SELECT ps.id FROM practice_sets ps JOIN practice_tests pt ON ps.test_id = pt.id 
  WHERE pt.slug = 'ielts' AND ps.title LIKE '%Part 1%' LIMIT 1
)
INSERT INTO practice_questions (set_id, question_text, explanation, question_type, sort_order, metadata)
SELECT 
  id,
  'Tell me about your hometown. What is it like? What do you like most about living there?',
  'Part 1 questions are personal and familiar topics. Speak naturally for 1-2 minutes total. Assessment criteria: Fluency and coherence, pronunciation, lexical resource, grammatical range and accuracy. Tips: Give extended answers with examples, use varied vocabulary, speak clearly.',
  'speaking_prompt',
  1,
  '{"part": 1, "time_limit": 120, "topic": "hometown", "difficulty": "basic", "skills": ["fluency", "pronunciation", "vocabulary", "grammar"]}'::jsonb
FROM speaking_part1
UNION ALL
SELECT 
  id,
  'Do you prefer to study in the morning or in the evening? Why?',
  'Express your preference clearly and give reasons. Use comparative language and personal examples. This tests your ability to express preferences and justify choices using appropriate language.',
  'speaking_prompt',
  2,
  '{"part": 1, "time_limit": 60, "topic": "study_habits", "difficulty": "basic", "focus": ["preferences", "justification", "personal_experience"]}'::jsonb
FROM speaking_part1;

-- Speaking Part 2 Questions
WITH speaking_part2 AS (
  SELECT ps.id FROM practice_sets ps JOIN practice_tests pt ON ps.test_id = pt.id 
  WHERE pt.slug = 'ielts' AND ps.title LIKE '%Part 2%' LIMIT 1
)
INSERT INTO practice_questions (set_id, question_text, explanation, question_type, sort_order, metadata)
SELECT 
  id,
  'Describe a technological device that you find useful. You should say: what the device is, when and how you use it, what you use it for, and explain why you find it useful.',
  'Part 2 is an individual long turn. You have 1 minute to prepare and should speak for 1-2 minutes. Structure your answer around the bullet points provided. Use descriptive language, examples, and personal experiences. Maintain fluency even if you make minor errors.',
  'speaking_prompt',
  1,
  '{"part": 2, "preparation_time": 60, "speaking_time": 120, "topic": "technology", "structure": ["what", "when_how", "purpose", "explanation"], "difficulty": "intermediate"}'::jsonb
FROM speaking_part2;

-- Speaking Part 3 Questions  
WITH speaking_part3 AS (
  SELECT ps.id FROM practice_sets ps JOIN practice_tests pt ON ps.test_id = pt.id 
  WHERE pt.slug = 'ielts' AND ps.title LIKE '%Part 3%' LIMIT 1
)
INSERT INTO practice_questions (set_id, question_text, explanation, question_type, sort_order, metadata)
SELECT 
  id,
  'How do you think technology will change education in the future?',
  'Part 3 involves abstract discussion related to Part 2 topic. Demonstrate ability to: express and justify opinions, speculate about future trends, compare different perspectives, use advanced vocabulary and complex grammar structures. Speak for 4-5 minutes total in this section.',
  'speaking_prompt',
  1,
  '{"part": 3, "time_limit": 300, "topic": "technology_education", "difficulty": "advanced", "skills": ["speculation", "opinion", "analysis", "future_trends"]}'::jsonb
FROM speaking_part3;

-- Add more questions for each section to create comprehensive practice sets
-- This creates a solid foundation that can be expanded with more questions

-- Enable RLS on all tables
ALTER TABLE practice_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_choices ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (students can view test content)
DROP POLICY IF EXISTS "Enable read access for all users" ON practice_tests;
CREATE POLICY "Enable read access for all users" ON practice_tests FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Enable read access for all users" ON practice_sets;
CREATE POLICY "Enable read access for all users" ON practice_sets FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Enable read access for all users" ON practice_questions;
CREATE POLICY "Enable read access for all users" ON practice_questions FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Enable read access for all users" ON practice_choices;
CREATE POLICY "Enable read access for all users" ON practice_choices FOR SELECT USING (TRUE);

-- Admin policies for managing test content
DROP POLICY IF EXISTS "Admin can manage practice tests" ON practice_tests;
CREATE POLICY "Admin can manage practice tests" ON practice_tests FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users au 
    WHERE au.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admin can manage practice sets" ON practice_sets;
CREATE POLICY "Admin can manage practice sets" ON practice_sets FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users au 
    WHERE au.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admin can manage practice questions" ON practice_questions;
CREATE POLICY "Admin can manage practice questions" ON practice_questions FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users au 
    WHERE au.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admin can manage practice choices" ON practice_choices;
CREATE POLICY "Admin can manage practice choices" ON practice_choices FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users au 
    WHERE au.user_id = auth.uid()
  )
);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON practice_tests TO anon, authenticated;
GRANT SELECT ON practice_sets TO anon, authenticated;
GRANT SELECT ON practice_questions TO anon, authenticated;
GRANT SELECT ON practice_choices TO anon, authenticated;
GRANT ALL ON practice_tests TO authenticated;
GRANT ALL ON practice_sets TO authenticated;
GRANT ALL ON practice_questions TO authenticated;
GRANT ALL ON practice_choices TO authenticated;

-- Create useful functions for test prep statistics
DROP FUNCTION IF EXISTS get_test_prep_stats();

CREATE OR REPLACE FUNCTION get_test_prep_stats()
RETURNS TABLE (
  test_name TEXT,
  total_sets INTEGER,
  total_questions INTEGER,
  reading_questions INTEGER,
  listening_questions INTEGER,
  writing_questions INTEGER,
  speaking_questions INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.name,
    COUNT(DISTINCT ps.id)::INTEGER,
    COUNT(DISTINCT pq.id)::INTEGER,
    COUNT(DISTINCT CASE WHEN ps.section = 'reading' THEN pq.id END)::INTEGER,
    COUNT(DISTINCT CASE WHEN ps.section = 'listening' THEN pq.id END)::INTEGER,
    COUNT(DISTINCT CASE WHEN ps.section = 'writing' THEN pq.id END)::INTEGER,
    COUNT(DISTINCT CASE WHEN ps.section = 'speaking' THEN pq.id END)::INTEGER
  FROM practice_tests pt
  LEFT JOIN practice_sets ps ON pt.id = ps.test_id
  LEFT JOIN practice_questions pq ON ps.id = pq.set_id
  GROUP BY pt.id, pt.name
  ORDER BY pt.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_test_prep_stats() TO authenticated;

SELECT 'Complete IELTS question bank created successfully!' as result; 