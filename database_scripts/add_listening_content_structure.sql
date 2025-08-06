-- ========================================
-- ADD LISTENING CONTENT STRUCTURE
-- ========================================
-- This script adds the necessary structure for IELTS listening content

-- 1. Add audio_files table for storing audio file metadata
CREATE TABLE IF NOT EXISTS audio_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  duration_seconds INTEGER,
  audio_url TEXT,
  transcript TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add audio_file_id to practice_questions for listening questions
ALTER TABLE practice_questions 
ADD COLUMN IF NOT EXISTS audio_file_id UUID REFERENCES audio_files(id);

-- 3. Add sample listening practice sets
INSERT INTO practice_sets (id, title, section, sort_order) VALUES
  (gen_random_uuid(), 'IELTS Listening Practice Set 1: University Campus Tour', 'listening', 1),
  (gen_random_uuid(), 'IELTS Listening Practice Set 2: Job Interview', 'listening', 2),
  (gen_random_uuid(), 'IELTS Listening Practice Set 3: Travel Booking', 'listening', 3)
ON CONFLICT DO NOTHING;

-- 4. Create sample audio file records (you'll need to upload actual files)
INSERT INTO audio_files (id, filename, original_filename, file_size, duration_seconds, transcript) VALUES
  (
    gen_random_uuid(),
    'campus_tour_audio.mp3',
    'IELTS_Listening_Campus_Tour.mp3',
    2048000,
    180,
    'Welcome to our university campus tour. Today we''ll be exploring the main facilities available to students. Let''s start with the library, which is located in the center of campus. The library is open from 8 AM to 10 PM during weekdays and 9 AM to 6 PM on weekends. It contains over 50,000 books and provides access to online databases. Next, we have the student center, which houses the cafeteria, student services office, and recreational facilities. The cafeteria serves breakfast, lunch, and dinner, with vegetarian options available. The student services office can help with course registration, financial aid, and career counseling. Moving on to the academic buildings, we have three main lecture halls, each seating up to 200 students. The science laboratory is equipped with modern equipment for chemistry, biology, and physics experiments. Finally, we have the sports complex, which includes a gym, swimming pool, and outdoor playing fields. Membership to the sports complex is included in your student fees.'
  ),
  (
    gen_random_uuid(),
    'job_interview_audio.mp3',
    'IELTS_Listening_Job_Interview.mp3',
    1536000,
    150,
    'Good morning, thank you for coming in today. I''m Sarah Johnson, the hiring manager for the marketing position. Let me start by asking about your previous experience in digital marketing. I see from your resume that you worked at TechCorp for three years. Could you tell me about your responsibilities there? I was responsible for managing social media campaigns, creating content strategies, and analyzing performance metrics. We increased our online engagement by 40% during my time there. That''s impressive. What tools did you use for analytics? I primarily used Google Analytics, Facebook Insights, and Hootsuite for campaign management. I also have experience with email marketing platforms like Mailchimp. How do you stay updated with the latest marketing trends? I regularly attend industry conferences, follow marketing blogs, and participate in online courses. I recently completed a certification in Google Ads. What would you say is your biggest achievement in marketing? I successfully launched a viral campaign that generated over 100,000 leads and increased sales by 25% in one quarter. That sounds excellent. Do you have any questions about the position? Yes, I''d like to know about the team structure and growth opportunities.'
  ),
  (
    gen_random_uuid(),
    'travel_booking_audio.mp3',
    'IELTS_Listening_Travel_Booking.mp3',
    1280000,
    120,
    'Good afternoon, thank you for calling Global Travel. My name is Michael, how can I help you today? Hi, I''d like to book a flight from London to Tokyo for next month. I can help you with that. What dates are you looking to travel? I need to leave on March 15th and return on March 22nd. Let me check the available flights. I have several options for you. The most economical option is with British Airways, departing at 10:30 AM and arriving at 6:45 AM the next day. The price is £650. There''s also a direct flight with Japan Airlines at 2:15 PM, arriving at 8:30 AM the next day for £750. What about the return flight? For the return on March 22nd, I have a flight departing Tokyo at 11:00 AM and arriving in London at 3:30 PM the same day. That''s perfect. Can I book both flights? Absolutely. I''ll need your passport details and contact information. Do you have any special meal requirements? Yes, I''m vegetarian. I''ll note that in your booking. The total cost for both flights is £1,400. Would you like me to proceed with the booking? Yes, please. I''ll send you a confirmation email with your booking reference number.'
  )
ON CONFLICT DO NOTHING;

-- 5. Create sample listening questions
INSERT INTO practice_questions (id, set_id, question_text, question_type, sort_order, audio_file_id) 
SELECT 
  gen_random_uuid(),
  ps.id,
  q.question_text,
  'multiple_choice',
  q.sort_order,
  af.id
FROM practice_sets ps
CROSS JOIN (
  VALUES 
    (1, 'What time does the library close on weekdays?'),
    (2, 'How many books does the library contain?'),
    (3, 'What services are available at the student center?'),
    (4, 'How many students can each lecture hall accommodate?'),
    (5, 'What is included in student fees?')
) AS q(sort_order, question_text)
CROSS JOIN audio_files af
WHERE ps.title = 'IELTS Listening Practice Set 1: University Campus Tour'
  AND af.filename = 'campus_tour_audio.mp3'
ON CONFLICT DO NOTHING;

INSERT INTO practice_questions (id, set_id, question_text, question_type, sort_order, audio_file_id) 
SELECT 
  gen_random_uuid(),
  ps.id,
  q.question_text,
  'multiple_choice',
  q.sort_order,
  af.id
FROM practice_sets ps
CROSS JOIN (
  VALUES 
    (1, 'What was the candidate''s biggest achievement?'),
    (2, 'How long did the candidate work at TechCorp?'),
    (3, 'What tools did the candidate use for analytics?'),
    (4, 'How much did online engagement increase?'),
    (5, 'What certification did the candidate recently complete?')
) AS q(sort_order, question_text)
CROSS JOIN audio_files af
WHERE ps.title = 'IELTS Listening Practice Set 2: Job Interview'
  AND af.filename = 'job_interview_audio.mp3'
ON CONFLICT DO NOTHING;

INSERT INTO practice_questions (id, set_id, question_text, question_type, sort_order, audio_file_id) 
SELECT 
  gen_random_uuid(),
  ps.id,
  q.question_text,
  'multiple_choice',
  q.sort_order,
  af.id
FROM practice_sets ps
CROSS JOIN (
  VALUES 
    (1, 'What is the departure time for the British Airways flight?'),
    (2, 'How much does the Japan Airlines flight cost?'),
    (3, 'What time does the return flight arrive in London?'),
    (4, 'What special requirement does the customer have?'),
    (5, 'What is the total cost for both flights?')
) AS q(sort_order, question_text)
CROSS JOIN audio_files af
WHERE ps.title = 'IELTS Listening Practice Set 3: Travel Booking'
  AND af.filename = 'travel_booking_audio.mp3'
ON CONFLICT DO NOTHING;

-- 6. Add sample answer choices for listening questions
INSERT INTO practice_choices (id, question_id, choice_text, is_correct, sort_order)
SELECT 
  gen_random_uuid(),
  pq.id,
  c.choice_text,
  c.is_correct,
  c.sort_order
FROM practice_questions pq
JOIN practice_sets ps ON pq.set_id = ps.id
CROSS JOIN (
  VALUES 
    -- Campus Tour Questions
    (1, '8 PM', false, 1),
    (1, '10 PM', true, 2),
    (1, '9 PM', false, 3),
    (1, '11 PM', false, 4),
    (2, '30,000', false, 1),
    (2, '40,000', false, 2),
    (2, '50,000', true, 3),
    (2, '60,000', false, 4),
    (3, 'Library and gym', false, 1),
    (3, 'Cafeteria and student services', true, 2),
    (3, 'Laboratory and sports complex', false, 3),
    (3, 'Lecture halls and library', false, 4),
    (4, '150 students', false, 1),
    (4, '200 students', true, 2),
    (4, '250 students', false, 3),
    (4, '300 students', false, 4),
    (5, 'Library access', false, 1),
    (5, 'Sports complex membership', true, 2),
    (5, 'Cafeteria meals', false, 3),
    (5, 'Laboratory equipment', false, 4),
    -- Job Interview Questions
    (6, 'Increased social media engagement', false, 1),
    (6, 'Launched a viral campaign', true, 2),
    (6, 'Completed Google Ads certification', false, 3),
    (6, 'Managed email marketing', false, 4),
    (7, '2 years', false, 1),
    (7, '3 years', true, 2),
    (7, '4 years', false, 3),
    (7, '5 years', false, 4),
    (8, 'Google Analytics and Facebook Insights', true, 1),
    (8, 'Mailchimp and Hootsuite', false, 2),
    (8, 'Twitter Analytics and LinkedIn', false, 3),
    (8, 'Instagram Insights and YouTube', false, 4),
    (9, '30%', false, 1),
    (9, '40%', true, 2),
    (9, '50%', false, 3),
    (9, '60%', false, 4),
    (10, 'Facebook Ads', false, 1),
    (10, 'Google Ads', true, 2),
    (10, 'LinkedIn Ads', false, 3),
    (10, 'Twitter Ads', false, 4),
    -- Travel Booking Questions
    (11, '9:30 AM', false, 1),
    (11, '10:30 AM', true, 2),
    (11, '11:30 AM', false, 3),
    (11, '12:30 PM', false, 4),
    (12, '£650', false, 1),
    (12, '£750', true, 2),
    (12, '£850', false, 3),
    (12, '£950', false, 4),
    (13, '2:30 PM', false, 1),
    (13, '3:30 PM', true, 2),
    (13, '4:30 PM', false, 3),
    (13, '5:30 PM', false, 4),
    (14, 'Window seat', false, 1),
    (14, 'Vegetarian meal', true, 2),
    (14, 'Extra luggage', false, 3),
    (14, 'Priority boarding', false, 4),
    (15, '£1,200', false, 1),
    (15, '£1,300', false, 2),
    (15, '£1,400', true, 3),
    (15, '£1,500', false, 4)
) AS c(question_number, choice_text, is_correct, sort_order)
WHERE pq.sort_order = c.question_number
ON CONFLICT DO NOTHING;

-- 7. Create RLS policies for audio_files table
ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to audio files" ON audio_files
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert audio files" ON audio_files
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update audio files" ON audio_files
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 8. Create function to get listening questions with audio
CREATE OR REPLACE FUNCTION get_listening_questions_with_audio(set_id_param UUID)
RETURNS TABLE (
  question_id UUID,
  question_text TEXT,
  question_type TEXT,
  sort_order INTEGER,
  audio_file_id UUID,
  audio_filename TEXT,
  audio_url TEXT,
  transcript TEXT,
  choices JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pq.id as question_id,
    pq.question_text,
    pq.question_type,
    pq.sort_order,
    pq.audio_file_id,
    af.filename as audio_filename,
    af.audio_url,
    af.transcript,
    COALESCE(
      (SELECT json_agg(
        json_build_object(
          'id', pc.id,
          'choice_text', pc.choice_text,
          'is_correct', pc.is_correct,
          'sort_order', pc.sort_order
        ) ORDER BY pc.sort_order
      ) FROM practice_choices pc WHERE pc.question_id = pq.id),
      '[]'::json
    ) as choices
  FROM practice_questions pq
  LEFT JOIN audio_files af ON pq.audio_file_id = af.id
  WHERE pq.set_id = set_id_param
  ORDER BY pq.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Listening content structure created successfully!' as status; 