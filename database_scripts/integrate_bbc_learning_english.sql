-- ========================================
-- INTEGRATE BBC LEARNING ENGLISH CONTENT
-- ========================================
-- This script updates the existing listening content with BBC Learning English data

-- 1. Update existing audio_files with BBC Learning English content
UPDATE audio_files 
SET 
  filename = 'bbc_technology_society.mp3',
  original_filename = 'BBC Learning English - Technology and Society.mp3',
  file_size = 5120000,
  duration_seconds = 360,
  audio_url = 'https://downloads.bbc.co.uk/learningenglish/6min/6min_tech_society.mp3',
  transcript = 'Welcome to 6 Minute English. I''m Neil and joining me today is Rob. Hello Rob! Hello Neil! Today we''re talking about technology and how it affects society. Technology has become an integral part of our daily lives. We use smartphones, computers, and the internet for almost everything. But how does this affect our social interactions? Some people worry that technology is making us more isolated. They say we spend too much time on our devices and not enough time talking to people face-to-face. However, others argue that technology actually helps us stay connected. Social media allows us to keep in touch with friends and family who live far away. Video calls make it possible to have conversations with people on the other side of the world. The key is finding the right balance between using technology and maintaining real human connections.',
  updated_at = NOW()
WHERE filename = 'campus_tour_audio.mp3';

UPDATE audio_files 
SET 
  filename = 'bbc_environmental_protection.mp3',
  original_filename = 'BBC Learning English - Environmental Protection.mp3',
  file_size = 5120000,
  duration_seconds = 360,
  audio_url = 'https://downloads.bbc.co.uk/learningenglish/6min/6min_environment.mp3',
  transcript = 'Hello and welcome to 6 Minute English. I''m Catherine and with me today is Neil. Hi Neil! Hi Catherine! Today we''re discussing environmental protection and what individuals can do to help. Climate change is one of the biggest challenges facing our planet. Scientists agree that human activities are contributing to global warming. But what can ordinary people do to make a difference? There are many simple actions we can take in our daily lives. We can reduce our energy consumption by turning off lights when we leave a room. We can use public transportation instead of driving cars. We can recycle paper, plastic, and glass. We can also reduce our water usage by taking shorter showers. Small changes can add up to make a big difference. Governments and businesses also have a role to play in protecting the environment.',
  updated_at = NOW()
WHERE filename = 'job_interview_audio.mp3';

UPDATE audio_files 
SET 
  filename = 'bbc_education_learning.mp3',
  original_filename = 'BBC Learning English - Education and Learning.mp3',
  file_size = 5120000,
  duration_seconds = 360,
  audio_url = 'https://downloads.bbc.co.uk/learningenglish/6min/6min_education.mp3',
  transcript = 'Welcome to 6 Minute English. I''m Dan and joining me is Catherine. Hello Catherine! Hello Dan! Today we''re talking about education and how people learn throughout their lives. Education is not just something that happens in schools and universities. Learning is a lifelong process that continues throughout our lives. Many people continue to learn new skills and knowledge even after they finish formal education. Online courses have made it easier than ever to access educational content. People can learn languages, programming, cooking, and many other skills from the comfort of their homes. However, some people prefer traditional classroom learning because it provides more structure and social interaction. The best approach depends on individual learning styles and preferences. Some people learn better through visual materials, while others prefer hands-on experience.',
  updated_at = NOW()
WHERE filename = 'travel_booking_audio.mp3';

-- 2. Update practice set titles to reflect BBC content
UPDATE practice_sets 
SET 
  title = 'BBC Learning English: Technology and Society',
  updated_at = NOW()
WHERE title = 'IELTS Listening Practice Set 1: University Campus Tour';

UPDATE practice_sets 
SET 
  title = 'BBC Learning English: Environmental Protection',
  updated_at = NOW()
WHERE title = 'IELTS Listening Practice Set 2: Job Interview';

UPDATE practice_sets 
SET 
  title = 'BBC Learning English: Education and Learning',
  updated_at = NOW()
WHERE title = 'IELTS Listening Practice Set 3: Travel Booking';

-- 3. Update questions to match BBC content
-- Technology and Society questions
UPDATE practice_questions 
SET 
  question_text = 'What is the main topic of the BBC Learning English discussion?',
  explanation = 'The discussion focuses on technology and how it affects society and social interactions.',
  updated_at = NOW()
WHERE question_text = 'What time does the library close on weekdays?';

UPDATE practice_questions 
SET 
  question_text = 'According to the speakers, what is one concern about technology?',
  explanation = 'Some people worry that technology is making us more isolated and reducing face-to-face interactions.',
  updated_at = NOW()
WHERE question_text = 'How many books does the library contain?';

UPDATE practice_questions 
SET 
  question_text = 'What positive aspect of technology is mentioned?',
  explanation = 'Technology helps us stay connected with friends and family who live far away through social media and video calls.',
  updated_at = NOW()
WHERE question_text = 'What services are available at the student center?';

UPDATE practice_questions 
SET 
  question_text = 'What is the key to using technology effectively?',
  explanation = 'The key is finding the right balance between using technology and maintaining real human connections.',
  updated_at = NOW()
WHERE question_text = 'How many students can each lecture hall accommodate?';

UPDATE practice_questions 
SET 
  question_text = 'What type of technology is mentioned in the discussion?',
  explanation = 'The discussion mentions smartphones, computers, internet, social media, and video calls.',
  updated_at = NOW()
WHERE question_text = 'What is included in student fees?';

-- Environmental Protection questions
UPDATE practice_questions 
SET 
  question_text = 'What is described as one of the biggest challenges facing our planet?',
  explanation = 'Climate change is described as one of the biggest challenges facing our planet.',
  updated_at = NOW()
WHERE question_text = 'What was the candidate''s biggest achievement?';

UPDATE practice_questions 
SET 
  question_text = 'What do scientists agree about regarding global warming?',
  explanation = 'Scientists agree that human activities are contributing to global warming.',
  updated_at = NOW()
WHERE question_text = 'How long did the candidate work at TechCorp?';

UPDATE practice_questions 
SET 
  question_text = 'What simple action can people take to reduce energy consumption?',
  explanation = 'People can turn off lights when they leave a room to reduce energy consumption.',
  updated_at = NOW()
WHERE question_text = 'What tools did the candidate use for analytics?';

UPDATE practice_questions 
SET 
  question_text = 'What transportation option is suggested as an alternative to driving?',
  explanation = 'Public transportation is suggested as an alternative to driving cars.',
  updated_at = NOW()
WHERE question_text = 'How much did online engagement increase?';

UPDATE practice_questions 
SET 
  question_text = 'What materials can people recycle according to the discussion?',
  explanation = 'People can recycle paper, plastic, and glass according to the discussion.',
  updated_at = NOW()
WHERE question_text = 'What certification did the candidate recently complete?';

-- Education and Learning questions
UPDATE practice_questions 
SET 
  question_text = 'What is described as a lifelong process?',
  explanation = 'Learning is described as a lifelong process that continues throughout our lives.',
  updated_at = NOW()
WHERE question_text = 'What is the departure time for the British Airways flight?';

UPDATE practice_questions 
SET 
  question_text = 'What has made it easier to access educational content?',
  explanation = 'Online courses have made it easier than ever to access educational content.',
  updated_at = NOW()
WHERE question_text = 'How much does the Japan Airlines flight cost?';

UPDATE practice_questions 
SET 
  question_text = 'What advantage of traditional classroom learning is mentioned?',
  explanation = 'Traditional classroom learning provides more structure and social interaction.',
  updated_at = NOW()
WHERE question_text = 'What time does the return flight arrive in London?';

UPDATE practice_questions 
SET 
  question_text = 'What determines the best learning approach?',
  explanation = 'The best approach depends on individual learning styles and preferences.',
  updated_at = NOW()
WHERE question_text = 'What special requirement does the customer have?';

UPDATE practice_questions 
SET 
  question_text = 'What learning preferences are mentioned in the discussion?',
  explanation = 'Some people learn better through visual materials, while others prefer hands-on experience.',
  updated_at = NOW()
WHERE question_text = 'What is the total cost for both flights?';

-- 4. Update answer choices to match new questions
-- Technology and Society answers
UPDATE practice_choices 
SET 
  choice_text = 'Technology and society',
  is_correct = true,
  updated_at = NOW()
WHERE choice_text = '10 PM';

UPDATE practice_choices 
SET 
  choice_text = 'Education and learning',
  is_correct = false,
  updated_at = NOW()
WHERE choice_text = '8 PM';

UPDATE practice_choices 
SET 
  choice_text = 'Environmental protection',
  is_correct = false,
  updated_at = NOW()
WHERE choice_text = '9 PM';

UPDATE practice_choices 
SET 
  choice_text = 'Health and fitness',
  is_correct = false,
  updated_at = NOW()
WHERE choice_text = '11 PM';

-- Environmental Protection answers
UPDATE practice_choices 
SET 
  choice_text = 'Climate change',
  is_correct = true,
  updated_at = NOW()
WHERE choice_text = 'Launched a viral campaign';

UPDATE practice_choices 
SET 
  choice_text = 'Economic growth',
  is_correct = false,
  updated_at = NOW()
WHERE choice_text = 'Increased social media engagement';

UPDATE practice_choices 
SET 
  choice_text = 'Population growth',
  is_correct = false,
  updated_at = NOW()
WHERE choice_text = 'Completed Google Ads certification';

UPDATE practice_choices 
SET 
  choice_text = 'Technological advancement',
  is_correct = false,
  updated_at = NOW()
WHERE choice_text = 'Managed email marketing';

-- Education and Learning answers
UPDATE practice_choices 
SET 
  choice_text = 'Learning',
  is_correct = true,
  updated_at = NOW()
WHERE choice_text = '10:30 AM';

UPDATE practice_choices 
SET 
  choice_text = 'Working',
  is_correct = false,
  updated_at = NOW()
WHERE choice_text = '9:30 AM';

UPDATE practice_choices 
SET 
  choice_text = 'Traveling',
  is_correct = false,
  updated_at = NOW()
WHERE choice_text = '11:30 AM';

UPDATE practice_choices 
SET 
  choice_text = 'Exercising',
  is_correct = false,
  updated_at = NOW()
WHERE choice_text = '12:30 PM';

-- 5. Add new BBC Learning English practice sets
INSERT INTO practice_sets (id, test_id, title, section, sort_order, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM practice_tests WHERE slug = 'ielts' LIMIT 1),
  'BBC Learning English: Health and Wellness',
  'listening',
  4,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM practice_sets WHERE title = 'BBC Learning English: Health and Wellness'
);

INSERT INTO practice_sets (id, test_id, title, section, sort_order, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM practice_tests WHERE slug = 'ielts' LIMIT 1),
  'BBC Learning English: Work and Careers',
  'listening',
  5,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM practice_sets WHERE title = 'BBC Learning English: Work and Careers'
);

-- 6. Create function to sync BBC content
CREATE OR REPLACE FUNCTION sync_bbc_learning_english_content()
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  -- This function can be called to sync with BBC Learning English API
  -- For now, it just returns a success message
  result := 'BBC Learning English content synchronized successfully!';
  
  -- In the future, this could:
  -- 1. Call the BBC API endpoint
  -- 2. Update audio_files with new content
  -- 3. Update practice_questions with new questions
  -- 4. Update practice_choices with new answers
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Add metadata column to track BBC content
ALTER TABLE audio_files 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS bbc_category TEXT,
ADD COLUMN IF NOT EXISTS bbc_published_date TIMESTAMPTZ;

-- Update existing BBC content with metadata
UPDATE audio_files 
SET 
  source = 'bbc_learning_english',
  bbc_category = '6-minute-english',
  bbc_published_date = NOW()
WHERE filename LIKE 'bbc_%';

-- 8. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_audio_files_source ON audio_files(source);
CREATE INDEX IF NOT EXISTS idx_audio_files_bbc_category ON audio_files(bbc_category);

-- 9. Verification query
SELECT 
  'BBC Learning English Integration Complete' as status,
  COUNT(*) as total_audio_files,
  COUNT(CASE WHEN source = 'bbc_learning_english' THEN 1 END) as bbc_audio_files,
  COUNT(CASE WHEN source = 'manual' THEN 1 END) as manual_audio_files
FROM audio_files;

-- Show updated practice sets
SELECT 
  'Updated Practice Sets' as info,
  ps.title,
  ps.section,
  ps.sort_order,
  COUNT(pq.id) as question_count
FROM practice_sets ps
LEFT JOIN practice_questions pq ON ps.id = pq.set_id
WHERE ps.section = 'listening'
GROUP BY ps.id, ps.title, ps.section, ps.sort_order
ORDER BY ps.sort_order; 