-- IELTS Practice RLS Security Migration (PostgreSQL Fixed v4)
-- This adds proper access controls for IELTS practice features

-- Ensure practice tables exist with basic structure
CREATE TABLE IF NOT EXISTS public.practice_tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.practice_sets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.practice_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.practice_choices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    choice_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to existing tables dynamically
DO $$ 
BEGIN
    -- practice_tests columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'practice_tests' AND column_name = 'test_type') THEN
        ALTER TABLE public.practice_tests ADD COLUMN test_type TEXT DEFAULT 'reading' CHECK (test_type IN ('reading', 'listening', 'writing', 'speaking'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'practice_tests' AND column_name = 'description') THEN
        ALTER TABLE public.practice_tests ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'practice_tests' AND column_name = 'difficulty_level') THEN
        ALTER TABLE public.practice_tests ADD COLUMN difficulty_level TEXT DEFAULT 'intermediate' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'practice_tests' AND column_name = 'time_limit') THEN
        ALTER TABLE public.practice_tests ADD COLUMN time_limit INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'practice_tests' AND column_name = 'instructions') THEN
        ALTER TABLE public.practice_tests ADD COLUMN instructions TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'practice_tests' AND column_name = 'is_active') THEN
        ALTER TABLE public.practice_tests ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'practice_tests' AND column_name = 'updated_at') THEN
        ALTER TABLE public.practice_tests ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- practice_sets columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'practice_sets' AND column_name = 'test_id') THEN
        ALTER TABLE public.practice_sets ADD COLUMN test_id UUID REFERENCES public.practice_tests(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'practice_sets' AND column_name = 'set_number') THEN
        ALTER TABLE public.practice_sets ADD COLUMN set_number INTEGER DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'practice_sets' AND column_name = 'passage_text') THEN
        ALTER TABLE public.practice_sets ADD COLUMN passage_text TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'practice_sets' AND column_name = 'audio_url') THEN
        ALTER TABLE public.practice_sets ADD COLUMN audio_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'practice_sets' AND column_name = 'instructions') THEN
        ALTER TABLE public.practice_sets ADD COLUMN instructions TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'practice_sets' AND column_name = 'time_limit') THEN
        ALTER TABLE public.practice_sets ADD COLUMN time_limit INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'practice_sets' AND column_name = 'is_active') THEN
        ALTER TABLE public.practice_sets ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;

    -- practice_questions columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'practice_questions' AND column_name = 'set_id') THEN
        ALTER TABLE public.practice_questions ADD COLUMN set_id UUID REFERENCES public.practice_sets(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'practice_questions' AND column_name = 'question_number') THEN
        ALTER TABLE public.practice_questions ADD COLUMN question_number INTEGER DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'practice_questions' AND column_name = 'question_type') THEN
        ALTER TABLE public.practice_questions ADD COLUMN question_type TEXT CHECK (question_type IN ('multiple_choice', 'true_false', 'fill_blank', 'short_answer', 'essay'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'practice_questions' AND column_name = 'correct_answer') THEN
        ALTER TABLE public.practice_questions ADD COLUMN correct_answer TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'practice_questions' AND column_name = 'explanation') THEN
        ALTER TABLE public.practice_questions ADD COLUMN explanation TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'practice_questions' AND column_name = 'points') THEN
        ALTER TABLE public.practice_questions ADD COLUMN points INTEGER DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'practice_questions' AND column_name = 'is_active') THEN
        ALTER TABLE public.practice_questions ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;

    -- practice_choices columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'practice_choices' AND column_name = 'question_id') THEN
        ALTER TABLE public.practice_choices ADD COLUMN question_id UUID REFERENCES public.practice_questions(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'practice_choices' AND column_name = 'choice_letter') THEN
        ALTER TABLE public.practice_choices ADD COLUMN choice_letter TEXT CHECK (choice_letter IN ('A', 'B', 'C', 'D', 'E'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'practice_choices' AND column_name = 'is_correct') THEN
        ALTER TABLE public.practice_choices ADD COLUMN is_correct BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Update existing records to have safe defaults
    UPDATE public.practice_tests SET is_active = TRUE WHERE is_active IS NULL;
    UPDATE public.practice_tests SET test_type = 'reading' WHERE test_type IS NULL OR test_type = '';
    UPDATE public.practice_sets SET is_active = TRUE WHERE is_active IS NULL;
    UPDATE public.practice_questions SET is_active = TRUE WHERE is_active IS NULL;
    UPDATE public.practice_choices SET is_correct = FALSE WHERE is_correct IS NULL;
END $$;

-- Enable RLS on all practice tables
ALTER TABLE public.practice_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_choices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public read access" ON public.practice_tests;
DROP POLICY IF EXISTS "Public read access" ON public.practice_sets;
DROP POLICY IF EXISTS "Public read access" ON public.practice_questions;
DROP POLICY IF EXISTS "Public read access" ON public.practice_choices;
DROP POLICY IF EXISTS "Admin write access" ON public.practice_tests;
DROP POLICY IF EXISTS "Admin write access" ON public.practice_sets;
DROP POLICY IF EXISTS "Admin write access" ON public.practice_questions;
DROP POLICY IF EXISTS "Admin write access" ON public.practice_choices;

-- Create simple public read access policies (no column dependencies)
CREATE POLICY "Public read access" ON public.practice_tests FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.practice_sets FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.practice_questions FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.practice_choices FOR SELECT USING (true);

-- Create admin write policies
CREATE POLICY "Admin write access" ON public.practice_tests 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super-admin')
    ) OR 
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('admin@abroaducate.com', 'solakolawole62@gmail.com')
);

CREATE POLICY "Admin write access" ON public.practice_sets 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super-admin')
    ) OR 
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('admin@abroaducate.com', 'solakolawole62@gmail.com')
);

CREATE POLICY "Admin write access" ON public.practice_questions 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super-admin')
    ) OR 
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('admin@abroaducate.com', 'solakolawole62@gmail.com')
);

CREATE POLICY "Admin write access" ON public.practice_choices 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super-admin')
    ) OR 
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('admin@abroaducate.com', 'solakolawole62@gmail.com')
);

-- Grant necessary permissions
GRANT SELECT ON public.practice_tests TO anon, authenticated;
GRANT SELECT ON public.practice_sets TO anon, authenticated;
GRANT SELECT ON public.practice_questions TO anon, authenticated;
GRANT SELECT ON public.practice_choices TO anon, authenticated;

-- Grant admin permissions
GRANT ALL ON public.practice_tests TO authenticated;
GRANT ALL ON public.practice_sets TO authenticated;
GRANT ALL ON public.practice_questions TO authenticated;
GRANT ALL ON public.practice_choices TO authenticated;

-- Create indexes for performance (only on guaranteed columns)
CREATE INDEX IF NOT EXISTS idx_practice_tests_id ON public.practice_tests(id);
CREATE INDEX IF NOT EXISTS idx_practice_sets_id ON public.practice_sets(id);
CREATE INDEX IF NOT EXISTS idx_practice_questions_id ON public.practice_questions(id);
CREATE INDEX IF NOT EXISTS idx_practice_choices_id ON public.practice_choices(id); 