-- Missing Tables Migration
-- Adding personal_statements, cover_letters, and related tables

-- Cover Letters table (if not already exists)
CREATE TABLE IF NOT EXISTS public.cover_letters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    position_type TEXT NOT NULL CHECK (position_type IN ('academic', 'industry', 'government', 'hybrid')),
    job_title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    application_deadline DATE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'submitted', 'archived')),
    form_data JSONB NOT NULL,
    generated_content TEXT NOT NULL,
    word_count INTEGER DEFAULT 0,
    version INTEGER DEFAULT 1,
    auto_save_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT cover_letters_user_position_unique UNIQUE (user_id, job_title, company_name)
);

-- Cover Letter Analytics table
CREATE TABLE IF NOT EXISTS public.cover_letter_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cover_letter_id UUID REFERENCES public.cover_letters(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('created', 'updated', 'exported', 'generated', 'edited')),
    session_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cover Letter Edits table
CREATE TABLE IF NOT EXISTS public.cover_letter_edits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cover_letter_id UUID REFERENCES public.cover_letters(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    original_text TEXT NOT NULL,
    edited_text TEXT NOT NULL,
    edit_type TEXT NOT NULL CHECK (edit_type IN ('professional', 'direct', 'detailed', 'formal')),
    position_start INTEGER NOT NULL,
    position_end INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Personal Statements table
CREATE TABLE IF NOT EXISTS personal_statements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    application_type TEXT NOT NULL CHECK (application_type IN ('undergraduate', 'scholarship', 'law_school', 'medical_school', 'study_abroad', 'professional_program')),
    program_name TEXT NOT NULL,
    university_name TEXT NOT NULL,
    program_type TEXT, -- maps to application_type for backward compatibility
    application_deadline DATE,
    form_data JSONB NOT NULL, -- Store original form responses
    generated_content TEXT NOT NULL,
    word_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'submitted')),
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Personal Statement Analytics table
CREATE TABLE IF NOT EXISTS personal_statement_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    personal_statement_id UUID REFERENCES personal_statements(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('created', 'updated', 'exported', 'edited')),
    session_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Personal Statement Edits table (for inline editing)
CREATE TABLE IF NOT EXISTS personal_statement_edits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    personal_statement_id UUID REFERENCES personal_statements(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    original_text TEXT NOT NULL,
    edited_text TEXT NOT NULL,
    edit_type TEXT NOT NULL CHECK (edit_type IN ('make_personal', 'more_reflective', 'add_detail', 'concise')),
    position_start INTEGER NOT NULL,
    position_end INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cover_letters_user_id ON public.cover_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_position_type ON public.cover_letters(position_type);
CREATE INDEX IF NOT EXISTS idx_cover_letters_status ON public.cover_letters(status);
CREATE INDEX IF NOT EXISTS idx_cover_letters_created_at ON public.cover_letters(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cover_letters_deadline ON public.cover_letters(application_deadline);

CREATE INDEX IF NOT EXISTS idx_personal_statements_user_id ON personal_statements(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_statements_created_at ON personal_statements(created_at);
CREATE INDEX IF NOT EXISTS idx_personal_statements_application_deadline ON personal_statements(application_deadline);
CREATE INDEX IF NOT EXISTS idx_personal_statements_status ON personal_statements(status);

CREATE INDEX IF NOT EXISTS idx_cover_letter_analytics_user_id ON public.cover_letter_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_cover_letter_analytics_cover_letter_id ON public.cover_letter_analytics(cover_letter_id);
CREATE INDEX IF NOT EXISTS idx_cover_letter_analytics_created_at ON public.cover_letter_analytics(created_at);

CREATE INDEX IF NOT EXISTS idx_personal_statement_analytics_user_id ON personal_statement_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_statement_analytics_personal_statement_id ON personal_statement_analytics(personal_statement_id);
CREATE INDEX IF NOT EXISTS idx_personal_statement_analytics_created_at ON personal_statement_analytics(created_at);

CREATE INDEX IF NOT EXISTS idx_cover_letter_edits_cover_letter_id ON public.cover_letter_edits(cover_letter_id);
CREATE INDEX IF NOT EXISTS idx_cover_letter_edits_created_at ON public.cover_letter_edits(created_at);

CREATE INDEX IF NOT EXISTS idx_personal_statement_edits_personal_statement_id ON personal_statement_edits(personal_statement_id);
CREATE INDEX IF NOT EXISTS idx_personal_statement_edits_created_at ON personal_statement_edits(created_at);

-- Row Level Security
ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cover_letter_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cover_letter_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_statement_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_statement_edits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can manage their own cover letters" ON public.cover_letters;
CREATE POLICY "Users can manage their own cover letters" ON public.cover_letters
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own cover letter analytics" ON public.cover_letter_analytics;
CREATE POLICY "Users can manage their own cover letter analytics" ON public.cover_letter_analytics
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own cover letter edits" ON public.cover_letter_edits;
CREATE POLICY "Users can manage their own cover letter edits" ON public.cover_letter_edits
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own personal statements" ON personal_statements
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own personal statement analytics" ON personal_statement_analytics
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own personal statement edits" ON personal_statement_edits
    FOR ALL USING (auth.uid() = user_id);

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_cover_letters_updated_at ON public.cover_letters;
CREATE TRIGGER update_cover_letters_updated_at
    BEFORE UPDATE ON public.cover_letters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personal_statements_updated_at BEFORE UPDATE ON personal_statements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.cover_letters TO authenticated;
GRANT ALL ON public.cover_letter_analytics TO authenticated;
GRANT ALL ON public.cover_letter_edits TO authenticated;
GRANT ALL ON personal_statements TO authenticated;
GRANT ALL ON personal_statement_analytics TO authenticated;
GRANT ALL ON personal_statement_edits TO authenticated; 