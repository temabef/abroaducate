-- Phase F.1: Smart Cover Letter Generator System
-- Database Migration Script

-- ============================================================================
-- COVER LETTERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cover_letters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Position Information
    position_type TEXT NOT NULL CHECK (position_type IN ('academic', 'industry', 'government', 'hybrid')),
    job_title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    application_deadline DATE,
    
    -- Content Data
    form_data JSONB NOT NULL, -- Complete form data for editing
    generated_content TEXT NOT NULL,
    word_count INTEGER DEFAULT 0,
    
    -- Status and Metadata
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'applied', 'archived')),
    version INTEGER DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Indexing
    CONSTRAINT cover_letters_user_position_unique UNIQUE (user_id, job_title, company_name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cover_letters_user_id ON public.cover_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_position_type ON public.cover_letters(position_type);
CREATE INDEX IF NOT EXISTS idx_cover_letters_status ON public.cover_letters(status);
CREATE INDEX IF NOT EXISTS idx_cover_letters_created_at ON public.cover_letters(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cover_letters_deadline ON public.cover_letters(application_deadline);

-- ============================================================================
-- COVER LETTER TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cover_letter_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Template Information
    name TEXT NOT NULL,
    description TEXT,
    position_type TEXT NOT NULL CHECK (position_type IN ('academic', 'industry', 'government', 'hybrid')),
    category TEXT, -- e.g., 'tech', 'research', 'consulting', 'startup'
    
    -- Template Content
    template_content TEXT NOT NULL,
    prompt_instructions TEXT,
    
    -- Template Metadata
    is_public BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id),
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cover_letter_templates_position_type ON public.cover_letter_templates(position_type);
CREATE INDEX IF NOT EXISTS idx_cover_letter_templates_public ON public.cover_letter_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_cover_letter_templates_rating ON public.cover_letter_templates(rating DESC);

-- ============================================================================
-- COVER LETTER ANALYTICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cover_letter_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    cover_letter_id UUID REFERENCES public.cover_letters(id) ON DELETE CASCADE,
    
    -- Analytics Data
    action_type TEXT NOT NULL CHECK (action_type IN ('created', 'viewed', 'edited', 'downloaded', 'copied', 'applied')),
    session_data JSONB,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cover_letter_analytics_user_id ON public.cover_letter_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_cover_letter_analytics_action_type ON public.cover_letter_analytics(action_type);
CREATE INDEX IF NOT EXISTS idx_cover_letter_analytics_created_at ON public.cover_letter_analytics(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cover_letter_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cover_letter_analytics ENABLE ROW LEVEL SECURITY;

-- Cover Letters Policies
DROP POLICY IF EXISTS "Users can manage their own cover letters" ON public.cover_letters;
CREATE POLICY "Users can manage their own cover letters" ON public.cover_letters
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Templates Policies
DROP POLICY IF EXISTS "Users can view public templates and manage their own" ON public.cover_letter_templates;
CREATE POLICY "Users can view public templates and manage their own" ON public.cover_letter_templates
    FOR SELECT USING (is_public = TRUE OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create their own templates" ON public.cover_letter_templates;
CREATE POLICY "Users can create their own templates" ON public.cover_letter_templates
    FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their own templates" ON public.cover_letter_templates;
CREATE POLICY "Users can update their own templates" ON public.cover_letter_templates
    FOR UPDATE USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Analytics Policies
DROP POLICY IF EXISTS "Users can manage their own analytics" ON public.cover_letter_analytics;
CREATE POLICY "Users can manage their own analytics" ON public.cover_letter_analytics
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_cover_letters_updated_at ON public.cover_letters;
CREATE TRIGGER update_cover_letters_updated_at 
    BEFORE UPDATE ON public.cover_letters 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cover_letter_templates_updated_at ON public.cover_letter_templates;
CREATE TRIGGER update_cover_letter_templates_updated_at 
    BEFORE UPDATE ON public.cover_letter_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get user cover letter statistics
CREATE OR REPLACE FUNCTION get_user_cover_letter_stats(user_uuid UUID)
RETURNS TABLE (
    total_cover_letters BIGINT,
    by_position_type JSONB,
    by_status JSONB,
    recent_activity JSONB,
    avg_word_count DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH cover_letter_stats AS (
        SELECT 
            COUNT(*) as total,
            json_build_object(
                'academic', COUNT(*) FILTER (WHERE position_type = 'academic'),
                'industry', COUNT(*) FILTER (WHERE position_type = 'industry'),
                'government', COUNT(*) FILTER (WHERE position_type = 'government'),
                'hybrid', COUNT(*) FILTER (WHERE position_type = 'hybrid')
            ) as by_type,
            json_build_object(
                'draft', COUNT(*) FILTER (WHERE status = 'draft'),
                'final', COUNT(*) FILTER (WHERE status = 'final'),
                'applied', COUNT(*) FILTER (WHERE status = 'applied'),
                'archived', COUNT(*) FILTER (WHERE status = 'archived')
            ) as by_status,
            json_agg(
                json_build_object(
                    'id', id,
                    'job_title', job_title,
                    'company_name', company_name,
                    'position_type', position_type,
                    'created_at', created_at
                ) ORDER BY created_at DESC
            ) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as recent,
            AVG(word_count)::DECIMAL as avg_words
        FROM public.cover_letters 
        WHERE user_id = user_uuid
    )
    SELECT 
        total,
        by_type::JSONB,
        by_status::JSONB,
        recent::JSONB,
        avg_words
    FROM cover_letter_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log cover letter analytics
CREATE OR REPLACE FUNCTION log_cover_letter_action(
    p_user_id UUID,
    p_cover_letter_id UUID,
    p_action_type TEXT,
    p_session_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    analytics_id UUID;
BEGIN
    INSERT INTO public.cover_letter_analytics (
        user_id,
        cover_letter_id,
        action_type,
        session_data,
        created_at
    ) VALUES (
        p_user_id,
        p_cover_letter_id,
        p_action_type,
        p_session_data,
        NOW()
    ) RETURNING id INTO analytics_id;
    
    RETURN analytics_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DEFAULT TEMPLATES
-- ============================================================================

-- Insert default cover letter templates
INSERT INTO public.cover_letter_templates (name, description, position_type, category, template_content, prompt_instructions, is_public) VALUES

-- Academic Templates
('Academic Research Position', 'Template for PhD and research positions', 'academic', 'research', 
'Dear Hiring Committee,

I am writing to express my strong interest in the [POSITION] position at [INSTITUTION]. With my [EXPERIENCE] and research background in [RESEARCH_AREA], I am excited about the opportunity to contribute to your department''s scholarly mission.

[RESEARCH_PARAGRAPH]

[ACHIEVEMENTS_PARAGRAPH]

[MOTIVATION_PARAGRAPH]

I would welcome the opportunity to discuss how my research interests and academic background align with your department''s goals. Thank you for your consideration.

Sincerely,
[NAME]', 
'Focus on research achievements, publications, methodology, and academic contributions. Use formal academic tone.', TRUE),

-- Industry Templates
('Tech Industry Position', 'Template for technology and software roles', 'industry', 'tech', 
'Dear Hiring Manager,

I am excited to apply for the [POSITION] role at [COMPANY]. Your company''s innovative approach to [TECHNOLOGY/FIELD] aligns perfectly with my [EXPERIENCE] and passion for [RELEVANT_AREA].

[TECHNICAL_EXPERIENCE]

[BUSINESS_IMPACT]

[COMPANY_RESEARCH]

I am eager to bring my technical expertise and collaborative approach to your team. Thank you for considering my application.

Best regards,
[NAME]', 
'Emphasize technical skills, quantifiable achievements, business impact, and company knowledge. Use professional business tone.', TRUE),

-- Government Template
('Public Service Position', 'Template for government and policy roles', 'government', 'policy', 
'Dear Hiring Manager,

I am writing to apply for the [POSITION] position with [ORGANIZATION]. My commitment to public service and [RELEVANT_EXPERIENCE] make me an ideal candidate for advancing [ORGANIZATION]''s mission.

[PUBLIC_SERVICE_EXPERIENCE]

[POLICY_ACHIEVEMENTS]

[MISSION_ALIGNMENT]

I look forward to the opportunity to contribute to meaningful public work. Thank you for your consideration.

Respectfully,
[NAME]', 
'Focus on public service motivation, policy understanding, stakeholder management, and social impact.', TRUE),

-- Hybrid Template
('Industry Research Position', 'Template for corporate research and R&D roles', 'hybrid', 'research', 
'Dear Hiring Team,

I am pleased to apply for the [POSITION] role at [COMPANY]. My unique background bridging academic research and practical application positions me well for this interdisciplinary opportunity.

[ACADEMIC_BACKGROUND]

[INDUSTRY_TRANSLATION]

[INNOVATION_FOCUS]

I am excited about the possibility of translating cutting-edge research into real-world solutions. Thank you for your time and consideration.

Sincerely,
[NAME]', 
'Balance academic rigor with practical application. Emphasize translation of research into business value.', TRUE);

-- ============================================================================
-- GRANTS AND PERMISSIONS
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.cover_letters TO authenticated;
GRANT ALL ON public.cover_letter_templates TO authenticated;
GRANT ALL ON public.cover_letter_analytics TO authenticated;

-- Grant function execution
GRANT EXECUTE ON FUNCTION get_user_cover_letter_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_cover_letter_action(UUID, UUID, TEXT, JSONB) TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add comment to track migration
COMMENT ON TABLE public.cover_letters IS 'Phase F.1: Cover Letters table - Smart Cover Letter Generator System';
COMMENT ON TABLE public.cover_letter_templates IS 'Phase F.1: Cover Letter Templates - Pre-built and user-created templates';
COMMENT ON TABLE public.cover_letter_analytics IS 'Phase F.1: Cover Letter Analytics - User interaction tracking';

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Phase F.1 Cover Letter System migration completed successfully at %', NOW();
    RAISE NOTICE 'Tables created: cover_letters, cover_letter_templates, cover_letter_analytics';
    RAISE NOTICE 'Functions created: get_user_cover_letter_stats, log_cover_letter_action';
    RAISE NOTICE 'Default templates inserted: 4 templates across all position types';
END $$;