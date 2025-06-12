-- Visa Interview Practice System Migration
-- Created: December 15, 2024
-- Description: Zero-cost visa interview practice feature

-- Create visa_interview_questions table
CREATE TABLE IF NOT EXISTS public.visa_interview_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('background', 'academic', 'financial', 'ties', 'plans', 'motivation')),
    difficulty TEXT DEFAULT 'basic' CHECK (difficulty IN ('basic', 'intermediate', 'advanced')),
    visa_type TEXT DEFAULT 'F1' CHECK (visa_type IN ('F1', 'J1', 'B1/B2', 'H1B')),
    country TEXT DEFAULT 'US' CHECK (country IN ('US', 'UK', 'Canada', 'Australia')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create visa_practice_sessions table  
CREATE TABLE IF NOT EXISTS public.visa_practice_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.visa_interview_questions(id),
    user_answer TEXT NOT NULL,
    ai_feedback JSONB, -- Store structured feedback
    score INTEGER CHECK (score >= 1 AND score <= 10),
    session_type TEXT DEFAULT 'practice' CHECK (session_type IN ('practice', 'mock_interview')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_visa_questions_category ON public.visa_interview_questions(category);
CREATE INDEX IF NOT EXISTS idx_visa_questions_visa_type ON public.visa_interview_questions(visa_type);
CREATE INDEX IF NOT EXISTS idx_visa_questions_difficulty ON public.visa_interview_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_visa_practice_user_id ON public.visa_practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_visa_practice_created_at ON public.visa_practice_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visa_practice_question_id ON public.visa_practice_sessions(question_id);

-- Enable RLS
ALTER TABLE public.visa_interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visa_practice_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can read visa questions" ON public.visa_interview_questions
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own practice sessions" ON public.visa_practice_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON public.visa_interview_questions TO authenticated;
GRANT ALL ON public.visa_practice_sessions TO authenticated;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for updated_at
CREATE TRIGGER update_visa_questions_updated_at BEFORE UPDATE ON public.visa_interview_questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert seed data (25 essential F-1 visa questions)
INSERT INTO public.visa_interview_questions (question, category, difficulty, visa_type) VALUES
-- Background Questions
('Tell me about yourself.', 'background', 'basic', 'F1'),
('What is your educational background?', 'background', 'basic', 'F1'),
('Where are you from? Tell me about your country.', 'background', 'basic', 'F1'),
('What do you do currently? Are you working or studying?', 'background', 'basic', 'F1'),
('Have you been to the US before?', 'background', 'basic', 'F1'),

-- Motivation Questions
('Why do you want to study in the United States?', 'motivation', 'basic', 'F1'),
('Why didn''t you study this course in your home country?', 'motivation', 'advanced', 'F1'),
('How did you learn about this university?', 'motivation', 'intermediate', 'F1'),
('What do you know about American culture?', 'motivation', 'intermediate', 'F1'),
('Why should we approve your visa?', 'motivation', 'advanced', 'F1'),

-- Academic Questions
('Why did you choose this particular university?', 'academic', 'intermediate', 'F1'),
('Why did you choose this field of study?', 'academic', 'intermediate', 'F1'),
('What are your academic goals?', 'academic', 'basic', 'F1'),
('Have you applied to other universities?', 'academic', 'intermediate', 'F1'),
('What will you study in your program?', 'academic', 'basic', 'F1'),

-- Financial Questions  
('How will you finance your education?', 'financial', 'basic', 'F1'),
('Who is sponsoring your education?', 'financial', 'basic', 'F1'),
('What is your sponsor''s occupation and income?', 'financial', 'intermediate', 'F1'),
('Do you have any scholarships or financial aid?', 'financial', 'intermediate', 'F1'),
('Can you show me your financial documents?', 'financial', 'basic', 'F1'),

-- Future Plans
('What are your career goals?', 'plans', 'basic', 'F1'),
('What will you do after completing your studies?', 'plans', 'basic', 'F1'),
('Do you plan to work in the US after graduation?', 'plans', 'intermediate', 'F1'),
('What are your future plans after 5 years?', 'plans', 'intermediate', 'F1'),
('How long do you plan to stay in the US?', 'plans', 'basic', 'F1'),

-- Ties to Home Country
('What ties do you have to your home country?', 'ties', 'basic', 'F1'),
('Why will you return to your home country?', 'ties', 'intermediate', 'F1'),
('What job opportunities await you in your home country?', 'ties', 'intermediate', 'F1'),
('Do you have family in the United States?', 'ties', 'basic', 'F1'),
('What will convince you to return home after your studies?', 'ties', 'advanced', 'F1');

-- Create usage tracking for visa interview practice (integrate with existing usage system)
-- This will be handled by the existing usage-limits.ts system 