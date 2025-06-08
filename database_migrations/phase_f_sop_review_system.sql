-- Phase F: SOP Review & Enhancement System Database Schema
-- This migration creates the comprehensive database structure for the SOP review system

-- Create the SOP analyses table for storing review results
CREATE TABLE IF NOT EXISTS public.sop_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sop_text TEXT NOT NULL,
    analysis_results JSONB NOT NULL,
    university_name TEXT,
    program_name TEXT,
    word_count INTEGER NOT NULL DEFAULT 0,
    overall_score INTEGER NOT NULL DEFAULT 0,
    review_mode TEXT NOT NULL DEFAULT 'detailed' CHECK (review_mode IN ('quick', 'detailed', 'university_specific')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sop_analyses_user_id ON public.sop_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_sop_analyses_created_at ON public.sop_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sop_analyses_overall_score ON public.sop_analyses(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_sop_analyses_university ON public.sop_analyses(university_name);

-- Create the analysis feedback table for storing improvement suggestions
CREATE TABLE IF NOT EXISTS public.analysis_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    analysis_id UUID NOT NULL REFERENCES public.sop_analyses(id) ON DELETE CASCADE,
    paragraph_number INTEGER NOT NULL,
    paragraph_text TEXT NOT NULL,
    paragraph_score INTEGER NOT NULL DEFAULT 0,
    category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('introduction', 'academic_background', 'experience', 'goals', 'conclusion', 'other')),
    strengths JSONB DEFAULT '[]'::jsonb,
    weaknesses JSONB DEFAULT '[]'::jsonb,
    suggestions JSONB DEFAULT '[]'::jsonb,
    improved_text TEXT,
    importance TEXT NOT NULL DEFAULT 'medium' CHECK (importance IN ('high', 'medium', 'low')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for feedback table
CREATE INDEX IF NOT EXISTS idx_analysis_feedback_analysis_id ON public.analysis_feedback(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_feedback_category ON public.analysis_feedback(category);
CREATE INDEX IF NOT EXISTS idx_analysis_feedback_score ON public.analysis_feedback(paragraph_score DESC);

-- Create the improvement tracking table
CREATE TABLE IF NOT EXISTS public.sop_improvements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_analysis_id UUID NOT NULL REFERENCES public.sop_analyses(id) ON DELETE CASCADE,
    improved_analysis_id UUID REFERENCES public.sop_analyses(id) ON DELETE CASCADE,
    improvement_type TEXT NOT NULL DEFAULT 'manual' CHECK (improvement_type IN ('manual', 'ai_suggested', 'hybrid')),
    score_improvement INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for improvements table
CREATE INDEX IF NOT EXISTS idx_sop_improvements_user_id ON public.sop_improvements(user_id);
CREATE INDEX IF NOT EXISTS idx_sop_improvements_original_analysis ON public.sop_improvements(original_analysis_id);

-- Create the review templates table for reusable analysis patterns
CREATE TABLE IF NOT EXISTS public.review_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_name TEXT NOT NULL UNIQUE,
    template_description TEXT,
    criteria JSONB NOT NULL,
    scoring_weights JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for templates table
CREATE INDEX IF NOT EXISTS idx_review_templates_active ON public.review_templates(is_active) WHERE is_active = true;

-- Insert default review templates
INSERT INTO public.review_templates (template_name, template_description, criteria, scoring_weights) VALUES
('Standard Graduate School', 'Standard template for graduate school applications', 
 '{"categories": ["introduction", "academic_background", "experience", "goals", "conclusion"], "min_word_count": 500, "max_word_count": 1000, "required_elements": ["clear_goals", "relevant_experience", "university_connection"]}',
 '{"readability": 0.2, "coherence": 0.25, "relevance": 0.3, "strength": 0.25}'),
 
('PhD Program', 'Specialized template for PhD applications with research focus',
 '{"categories": ["introduction", "academic_background", "research_experience", "research_goals", "conclusion"], "min_word_count": 800, "max_word_count": 1200, "required_elements": ["research_experience", "specific_research_interests", "faculty_connection", "methodology_understanding"]}',
 '{"readability": 0.15, "coherence": 0.2, "relevance": 0.35, "strength": 0.3}'),
 
('MBA Program', 'Template optimized for MBA applications',
 '{"categories": ["introduction", "professional_experience", "leadership", "career_goals", "conclusion"], "min_word_count": 600, "max_word_count": 900, "required_elements": ["leadership_examples", "career_progression", "business_acumen", "post_mba_goals"]}',
 '{"readability": 0.25, "coherence": 0.2, "relevance": 0.25, "strength": 0.3}'),
 
('Medical School', 'Template for medical school applications',
 '{"categories": ["introduction", "academic_preparation", "clinical_experience", "service", "goals"], "min_word_count": 700, "max_word_count": 1000, "required_elements": ["clinical_exposure", "service_commitment", "academic_excellence", "empathy_demonstration"]}',
 '{"readability": 0.2, "coherence": 0.25, "relevance": 0.3, "strength": 0.25}'),
 
('Engineering Graduate', 'Template for engineering graduate programs',
 '{"categories": ["introduction", "technical_background", "projects", "research_interests", "conclusion"], "min_word_count": 600, "max_word_count": 1000, "required_elements": ["technical_projects", "problem_solving", "innovation", "research_potential"]}',
 '{"readability": 0.15, "coherence": 0.2, "relevance": 0.35, "strength": 0.3}');

-- Create function to get user's analysis history
CREATE OR REPLACE FUNCTION get_user_analysis_history(user_uuid UUID)
RETURNS TABLE (
    analysis_id UUID,
    university_name TEXT,
    program_name TEXT,
    overall_score INTEGER,
    word_count INTEGER,
    review_mode TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    improvement_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sa.id as analysis_id,
        sa.university_name,
        sa.program_name,
        sa.overall_score,
        sa.word_count,
        sa.review_mode,
        sa.created_at,
        COUNT(si.id) as improvement_count
    FROM public.sop_analyses sa
    LEFT JOIN public.sop_improvements si ON sa.id = si.original_analysis_id
    WHERE sa.user_id = user_uuid
    GROUP BY sa.id, sa.university_name, sa.program_name, sa.overall_score, sa.word_count, sa.review_mode, sa.created_at
    ORDER BY sa.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get analysis statistics
CREATE OR REPLACE FUNCTION get_analysis_statistics(user_uuid UUID)
RETURNS TABLE (
    total_analyses BIGINT,
    avg_score NUMERIC,
    highest_score INTEGER,
    lowest_score INTEGER,
    total_improvements BIGINT,
    most_common_weakness TEXT,
    avg_word_count NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_analyses,
        ROUND(AVG(sa.overall_score), 1) as avg_score,
        MAX(sa.overall_score) as highest_score,
        MIN(sa.overall_score) as lowest_score,
        COUNT(DISTINCT si.id)::BIGINT as total_improvements,
        '' as most_common_weakness, -- Will be implemented with more complex analysis
        ROUND(AVG(sa.word_count), 0) as avg_word_count
    FROM public.sop_analyses sa
    LEFT JOIN public.sop_improvements si ON sa.id = si.original_analysis_id
    WHERE sa.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get trending improvement areas
CREATE OR REPLACE FUNCTION get_improvement_trends()
RETURNS TABLE (
    category TEXT,
    avg_score NUMERIC,
    improvement_frequency BIGINT,
    common_suggestions JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        af.category,
        ROUND(AVG(af.paragraph_score), 1) as avg_score,
        COUNT(*)::BIGINT as improvement_frequency,
        jsonb_agg(DISTINCT af.suggestions) as common_suggestions
    FROM public.analysis_feedback af
    JOIN public.sop_analyses sa ON af.analysis_id = sa.id
    WHERE sa.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY af.category
    ORDER BY improvement_frequency DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_sop_analyses_updated_at 
    BEFORE UPDATE ON public.sop_analyses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_templates_updated_at 
    BEFORE UPDATE ON public.review_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Set up Row Level Security (RLS)
ALTER TABLE public.sop_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_improvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own analyses" ON public.sop_analyses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses" ON public.sop_analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses" ON public.sop_analyses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses" ON public.sop_analyses
    FOR DELETE USING (auth.uid() = user_id);

-- Analysis feedback policies
CREATE POLICY "Users can view feedback for their analyses" ON public.analysis_feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sop_analyses 
            WHERE id = analysis_feedback.analysis_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert feedback for their analyses" ON public.analysis_feedback
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sop_analyses 
            WHERE id = analysis_feedback.analysis_id 
            AND user_id = auth.uid()
        )
    );

-- Improvements policies
CREATE POLICY "Users can view their own improvements" ON public.sop_improvements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own improvements" ON public.sop_improvements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Templates policies (read-only for users, admin-managed)
CREATE POLICY "Anyone can view active templates" ON public.review_templates
    FOR SELECT USING (is_active = true);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sop_analyses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analysis_feedback TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sop_improvements TO authenticated;
GRANT SELECT ON public.review_templates TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create notification function for analysis completion
CREATE OR REPLACE FUNCTION notify_analysis_complete()
RETURNS TRIGGER AS $$
BEGIN
    -- This could be extended to send notifications or update user activity
    INSERT INTO public.user_activity (
        user_id, 
        activity_type, 
        activity_data,
        created_at
    ) VALUES (
        NEW.user_id,
        'sop_analysis_completed',
        jsonb_build_object(
            'analysis_id', NEW.id,
            'overall_score', NEW.overall_score,
            'university_name', NEW.university_name,
            'program_name', NEW.program_name
        ),
        NOW()
    ) ON CONFLICT DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for analysis completion notification
CREATE TRIGGER notify_analysis_complete_trigger
    AFTER INSERT ON public.sop_analyses
    FOR EACH ROW EXECUTE FUNCTION notify_analysis_complete();

-- Create materialized view for analysis insights (optional performance optimization)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.analysis_insights AS
SELECT 
    DATE_TRUNC('week', created_at) as week,
    COUNT(*) as total_analyses,
    AVG(overall_score) as avg_score,
    COUNT(DISTINCT user_id) as unique_users,
    review_mode,
    university_name,
    program_name
FROM public.sop_analyses
WHERE created_at >= NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('week', created_at), review_mode, university_name, program_name
ORDER BY week DESC;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_analysis_insights_week ON public.analysis_insights(week);

-- Refresh materialized view function
CREATE OR REPLACE FUNCTION refresh_analysis_insights()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW public.analysis_insights;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE public.sop_analyses IS 'Stores comprehensive SOP analysis results with AI-powered feedback';
COMMENT ON TABLE public.analysis_feedback IS 'Detailed paragraph-by-paragraph feedback and suggestions';
COMMENT ON TABLE public.sop_improvements IS 'Tracks improvement iterations and score changes';
COMMENT ON TABLE public.review_templates IS 'Reusable templates for different types of programs';

COMMENT ON FUNCTION get_user_analysis_history(UUID) IS 'Retrieves complete analysis history for a user';
COMMENT ON FUNCTION get_analysis_statistics(UUID) IS 'Provides statistical overview of user analysis performance';
COMMENT ON FUNCTION get_improvement_trends() IS 'Returns trending improvement areas across all users';

-- Sample data for testing (remove in production)
-- This provides realistic test data for development
INSERT INTO public.sop_analyses (
    user_id, 
    sop_text, 
    analysis_results, 
    university_name, 
    program_name, 
    word_count, 
    overall_score, 
    review_mode
) VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    'Sample SOP text for testing purposes. This is a comprehensive statement of purpose that demonstrates the user''s academic background, professional experience, and future goals.',
    '{"paragraphAnalyses": [{"id": 0, "score": 85, "category": "introduction", "strengths": ["Clear opening statement", "Engaging narrative"], "weaknesses": ["Could be more specific"], "suggestions": ["Add quantifiable achievements"]}], "overallAnalysis": {"totalScore": 85, "readabilityScore": 80, "coherenceScore": 85, "relevanceScore": 90, "strengthScore": 85}}',
    'Stanford University',
    'MS Computer Science',
    250,
    85,
    'detailed'
) ON CONFLICT DO NOTHING;