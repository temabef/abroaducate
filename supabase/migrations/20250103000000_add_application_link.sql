-- Add application_link and notes columns to applications table
-- Migration to support storing application portal URLs and personal notes

ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS application_link TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comments to document the purpose
COMMENT ON COLUMN applications.application_link IS 'Optional URL link to the actual application submission or university portal';
COMMENT ON COLUMN applications.notes IS 'Personal notes, requirements, contacts, or any relevant information for the application';

-- Add comprehensive visa interview questions to expand from ~18 to 80+ questions
-- This brings the question bank to industry-leading levels

-- Background Category Questions (Additional 12 questions to reach 15 total)
INSERT INTO visa_interview_questions (question, category, difficulty, visa_type) VALUES
('Where are you from? Tell me about your city.', 'background', 'basic', 'F1'),
('Do you have any relatives living in the United States?', 'background', 'basic', 'F1'),
('What does your father do for work?', 'background', 'basic', 'F1'),
('How many brothers and sisters do you have?', 'background', 'basic', 'F1'),
('Are you married? Do you have any children?', 'background', 'basic', 'F1'),
('What languages can you speak fluently?', 'background', 'basic', 'F1'),
('Have you traveled to other countries before?', 'background', 'intermediate', 'F1'),
('What is your current employment status?', 'background', 'intermediate', 'F1'),
('How long have you been working in your current field?', 'background', 'intermediate', 'F1'),
('Tell me about your family background and education.', 'background', 'intermediate', 'F1'),
('What are your main hobbies and interests?', 'background', 'basic', 'F1'),
('Have you ever lived in other cities in your country?', 'background', 'basic', 'F1');

-- Academic Category Questions (Additional 12 questions to reach 15 total)
INSERT INTO visa_interview_questions (question, category, difficulty, visa_type) VALUES
('How many universities did you apply to in total?', 'academic', 'basic', 'F1'),
('Which universities accepted you and which ones rejected you?', 'academic', 'intermediate', 'F1'),
('What was your GPA or percentage in your previous studies?', 'academic', 'basic', 'F1'),
('Can you show me your academic transcripts?', 'academic', 'basic', 'F1'),
('What are your TOEFL, IELTS, or other English test scores?', 'academic', 'basic', 'F1'),
('How does this program relate to your previous education?', 'academic', 'intermediate', 'F1'),
('Who are some of the professors in your department?', 'academic', 'advanced', 'F1'),
('What specific research interests you most in this field?', 'academic', 'advanced', 'F1'),
('How long is your degree program expected to take?', 'academic', 'basic', 'F1'),
('When does your academic program officially start?', 'academic', 'basic', 'F1'),
('What courses will you be taking in your first semester?', 'academic', 'intermediate', 'F1'),
('Have you contacted any professors at your university yet?', 'academic', 'intermediate', 'F1');

-- Financial Category Questions (Additional 9 questions to reach 12 total)
INSERT INTO visa_interview_questions (question, category, difficulty, visa_type) VALUES
('What is the total cost of your education per year?', 'financial', 'basic', 'F1'),
('How much money do you have available for your studies?', 'financial', 'basic', 'F1'),
('Can you show me your bank statements?', 'financial', 'basic', 'F1'),
('Did you receive any scholarships from your university?', 'financial', 'intermediate', 'F1'),
('What is your sponsor''s annual income and occupation?', 'financial', 'intermediate', 'F1'),
('How many people are financially dependent on your sponsor?', 'financial', 'intermediate', 'F1'),
('Do you have any education loans approved for your studies?', 'financial', 'intermediate', 'F1'),
('How will you manage your living expenses in the United States?', 'financial', 'intermediate', 'F1'),
('What proof do you have of your financial capability?', 'financial', 'advanced', 'F1');

-- Home Country Ties Questions (Additional 9 questions to reach 12 total)
INSERT INTO visa_interview_questions (question, category, difficulty, visa_type) VALUES
('What property or assets do you own in your home country?', 'ties', 'intermediate', 'F1'),
('Do you have a job offer waiting for you back home?', 'ties', 'intermediate', 'F1'),
('What family members will you be leaving behind?', 'ties', 'basic', 'F1'),
('How will you maintain your connections to your home country?', 'ties', 'intermediate', 'F1'),
('What business or family obligations require your return?', 'ties', 'advanced', 'F1'),
('How often do you plan to visit home during your studies?', 'ties', 'basic', 'F1'),
('What cultural or community activities are you involved in at home?', 'ties', 'intermediate', 'F1'),
('Why is it important for you to return to your home country?', 'ties', 'advanced', 'F1'),
('What role do you plan to play in your family business or community?', 'ties', 'advanced', 'F1');

-- Future Plans Category Questions (Additional 12 questions to reach 15 total)
INSERT INTO visa_interview_questions (question, category, difficulty, visa_type) VALUES
('What do you plan to do immediately after graduation?', 'plans', 'basic', 'F1'),
('How will your US education benefit your career in your home country?', 'plans', 'intermediate', 'F1'),
('Do you plan to work in the US for any period after graduation?', 'plans', 'intermediate', 'F1'),
('What kind of salary do you expect to earn after your studies?', 'plans', 'intermediate', 'F1'),
('How will you contribute to your home country''s development?', 'plans', 'advanced', 'F1'),
('Do you have any entrepreneurial plans for the future?', 'plans', 'advanced', 'F1'),
('What industry do you plan to work in after graduation?', 'plans', 'basic', 'F1'),
('How will you use your degree to solve problems in your country?', 'plans', 'advanced', 'F1'),
('What are your long-term career goals (5-10 years)?', 'plans', 'intermediate', 'F1'),
('Do you plan to pursue further education after this degree?', 'plans', 'intermediate', 'F1'),
('How will you stay connected with your university after graduation?', 'plans', 'basic', 'F1'),
('What changes do you hope to bring to your field back home?', 'plans', 'advanced', 'F1');

-- Motivation Category Questions (Additional 9 questions to reach 12 total)
INSERT INTO visa_interview_questions (question, category, difficulty, visa_type) VALUES
('Why is studying in the US important for your goals?', 'motivation', 'intermediate', 'F1'),
('What specific opportunities does the US offer that your country doesn''t?', 'motivation', 'intermediate', 'F1'),
('How did you first become interested in studying abroad?', 'motivation', 'basic', 'F1'),
('What research did you do about US education before applying?', 'motivation', 'intermediate', 'F1'),
('Why didn''t you consider other countries like Canada, UK, or Australia?', 'motivation', 'advanced', 'F1'),
('What motivates you most about your chosen field of study?', 'motivation', 'intermediate', 'F1'),
('How will studying in the US change your perspective?', 'motivation', 'advanced', 'F1'),
('What are you most excited about regarding your US education?', 'motivation', 'basic', 'F1'),
('How do you plan to make the most of your time in the United States?', 'motivation', 'intermediate', 'F1');

-- Create indexes for better performance on large question database
CREATE INDEX IF NOT EXISTS idx_visa_questions_category_difficulty ON visa_interview_questions(category, difficulty);
CREATE INDEX IF NOT EXISTS idx_visa_questions_visa_type ON visa_interview_questions(visa_type); 