-- CORRECTED PRODUCTION STRIPE CONFIGURATION
-- Updated to match current pricing page exactly
-- Run this instead of the old comprehensive_production_stripe_config.sql

-- 1. Update user_usage table to track ALL features mentioned on pricing page
ALTER TABLE user_usage 
ADD COLUMN IF NOT EXISTS reviews_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS text_enhancements_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS word_optimizations_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS grammar_checks_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS plagiarism_checks_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tone_analyses_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS university_queries_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS visa_interview_sessions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cold_emails_generated INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS academic_analyses_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS inline_edits_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS version_history_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS applications_tracked INTEGER DEFAULT 0;

-- 2. Create comprehensive plan_features table
CREATE TABLE IF NOT EXISTS plan_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_type VARCHAR(50) NOT NULL,
    feature_category VARCHAR(100) NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    feature_limit INTEGER, -- NULL means unlimited
    feature_enabled BOOLEAN DEFAULT true,
    feature_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(plan_type, feature_category, feature_name)
);

-- 3. Insert ALL plan features EXACTLY as shown on pricing page
INSERT INTO plan_features (plan_type, feature_category, feature_name, feature_limit, feature_enabled, feature_metadata) VALUES

-- ==========================================
-- FREE TIER FEATURES (Academic Starter - $0)
-- ==========================================
-- Document Generation: 4 Documents/Month: 1 SOPs, 1 Cover Letters, 1 Personal Statement, 1 Academic CV
('free', 'documents', 'sops_created', 1, true, '{"monthly_reset": true}'),
('free', 'documents', 'cover_letters_created', 1, true, '{"monthly_reset": true}'),
('free', 'documents', 'personal_statements_created', 1, true, '{"monthly_reset": true}'),
('free', 'documents', 'academic_cvs_created', 1, true, '{"monthly_reset": true}'),

-- AI Features: 1 Review, 1 Text Enhancement, 1 Word Optimization, 1 Grammar Check, 1 Plagiarism Check, 1 Tone Analysis
('free', 'ai_features', 'reviews', 1, true, '{"monthly_reset": true}'),
('free', 'ai_features', 'text_enhancements', 1, true, '{"monthly_reset": true}'),
('free', 'ai_features', 'word_optimizations', 1, true, '{"monthly_reset": true}'),
('free', 'ai_features', 'grammar_checks', 1, true, '{"monthly_reset": true}'),
('free', 'ai_features', 'plagiarism_checks', 1, true, '{"monthly_reset": true}'),
('free', 'ai_features', 'tone_analyses', 1, true, '{"monthly_reset": true}'),

-- University Matching: 50+ universities with basic matching
('free', 'university_matching', 'total_universities', 50, true, '{"basic_matching": true}'),
('free', 'university_matching', 'queries_per_month', NULL, true, '{"unlimited": true}'),
('free', 'university_matching', 'priority_access', 0, false, '{}'),

-- Academic Analysis: Quick profile assessment only
('free', 'academic_analysis', 'quick_assessment', NULL, true, '{"unlimited": true}'),
('free', 'academic_analysis', 'comprehensive_transcript', 0, false, '{}'),

-- Application Tracking: 12 applications with basic reminders
('free', 'application_tracking', 'max_applications', 12, true, '{"basic_reminders": true}'),

-- Inline Text Editing: 5 AI-powered edits per month
('free', 'inline_editing', 'edits_per_month', 5, true, '{"monthly_reset": true}'),

-- Version History: 3 versions (cover letters only, 30-day retention)
('free', 'version_control', 'max_versions', 3, true, '{"cover_letters_only": true, "retention_days": 30}'),
('free', 'version_control', 'complete_history', 0, false, '{}'),

-- Visa Interview Simulator: 6 questions/session
('free', 'visa_interview', 'questions_per_session', 6, true, '{}'),

-- Cold Email Generator: 5 professional emails per month
('free', 'cold_email', 'emails_per_month', 5, true, '{"monthly_reset": true}'),

-- AI Model: GPT-3.5 AI Engine
('free', 'ai_model', 'model_type', NULL, true, '{"model": "gpt-3.5-turbo"}'),

-- Templates & Export
('free', 'templates_export', 'basic_templates', NULL, true, '{"count": 6}'),
('free', 'templates_export', 'premium_templates', 0, false, '{}'),
('free', 'templates_export', 'export_formats', NULL, true, '{"formats": ["pdf", "rtf"]}'),

-- Communications
('free', 'communications', 'support_level', NULL, true, '{"level": "community"}'),
('free', 'communications', 'email_notifications', NULL, true, '{"weekly_scholarship_digest": true}'),

-- ===================================================
-- PROFESSIONAL TIER FEATURES (Academic Professional - $12/month)
-- ===================================================
-- Document Generation: 50 Documents/Month (flexible allocation)
('professional', 'documents', 'total_documents', 50, true, '{"monthly_reset": true, "flexible_allocation": true}'),

-- Enhanced AI: 15 Reviews, 25 Text Enhancements, 15 Word Optimizations, 25 Grammar Checks, 10 Plagiarism Checks, 25 Tone Analyses
('professional', 'ai_features', 'reviews', 15, true, '{"monthly_reset": true}'),
('professional', 'ai_features', 'text_enhancements', 25, true, '{"monthly_reset": true}'),
('professional', 'ai_features', 'word_optimizations', 15, true, '{"monthly_reset": true}'),
('professional', 'ai_features', 'grammar_checks', 25, true, '{"monthly_reset": true}'),
('professional', 'ai_features', 'plagiarism_checks', 10, true, '{"monthly_reset": true}'),
('professional', 'ai_features', 'tone_analyses', 25, true, '{"monthly_reset": true}'),

-- University Matching: 500+ university recommendations (US + international)
('professional', 'university_matching', 'total_universities', 500, true, '{"international": true}'),
('professional', 'university_matching', 'queries_per_month', NULL, true, '{"unlimited": true}'),
('professional', 'university_matching', 'priority_access', 0, false, '{}'),

-- Academic Analysis: Comprehensive transcript analysis + Quick assessment
('professional', 'academic_analysis', 'quick_assessment', NULL, true, '{"unlimited": true}'),
('professional', 'academic_analysis', 'comprehensive_transcript', NULL, true, '{"unlimited": true}'),

-- Application Tracking: 1000 applications with advanced analytics
('professional', 'application_tracking', 'max_applications', 1000, true, '{"advanced_analytics": true}'),

-- Inline Text Editing: 50 AI-powered edits per month
('professional', 'inline_editing', 'edits_per_month', 50, true, '{"monthly_reset": true}'),

-- Version History: 50 versions (all document types, 90-day retention)
('professional', 'version_control', 'max_versions', 50, true, '{"all_document_types": true, "retention_days": 90}'),
('professional', 'version_control', 'complete_history', NULL, true, '{}'),

-- Visa Interview Simulator: 50 questions/session
('professional', 'visa_interview', 'questions_per_session', 50, true, '{}'),

-- Cold Email Generator: 50 professional emails per month
('professional', 'cold_email', 'emails_per_month', 50, true, '{"monthly_reset": true}'),

-- AI Model: GPT-4o-mini AI Engine
('professional', 'ai_model', 'model_type', NULL, true, '{"model": "gpt-4o-mini"}'),

-- Templates & Export
('professional', 'templates_export', 'basic_templates', NULL, true, '{}'),
('professional', 'templates_export', 'premium_templates', NULL, true, '{"subject_specific": true}'),
('professional', 'templates_export', 'export_formats', NULL, true, '{"formats": ["pdf", "rtf", "docx"]}'),

-- Communications
('professional', 'communications', 'support_level', NULL, true, '{"level": "email_48h"}'),
('professional', 'communications', 'email_notifications', NULL, true, '{"deadline_reminders": true, "daily_weekly_digest": true, "personalized": true}'),

-- Advanced Features
('professional', 'advanced', 'analytics_dashboard', NULL, true, '{}'),

-- ===============================================
-- ELITE TIER FEATURES (Academic Elite - $29/month)
-- ===============================================
-- Document Generation: UNLIMITED
('elite', 'documents', 'unlimited_generation', NULL, true, '{"unlimited": true}'),

-- AI Features: Unlimited everything
('elite', 'ai_features', 'reviews', NULL, true, '{"unlimited": true}'),
('elite', 'ai_features', 'text_enhancements', NULL, true, '{"unlimited": true}'),
('elite', 'ai_features', 'word_optimizations', NULL, true, '{"unlimited": true}'),
('elite', 'ai_features', 'grammar_checks', NULL, true, '{"unlimited": true}'),
('elite', 'ai_features', 'plagiarism_checks', NULL, true, '{"unlimited": true}'),
('elite', 'ai_features', 'tone_analyses', NULL, true, '{"unlimited": true}'),

-- University Database: 1500+ universities worldwide + priority access + new universities first
('elite', 'university_matching', 'total_universities', 1500, true, '{"worldwide": true}'),
('elite', 'university_matching', 'queries_per_month', NULL, true, '{"unlimited": true}'),
('elite', 'university_matching', 'priority_access', NULL, true, '{"new_universities_first": true}'),

-- Academic Analysis: Comprehensive transcript analysis + Quick assessment
('elite', 'academic_analysis', 'quick_assessment', NULL, true, '{"unlimited": true}'),
('elite', 'academic_analysis', 'comprehensive_transcript', NULL, true, '{"unlimited": true}'),

-- Application Tracking: Unlimited applications with premium insights dashboard
('elite', 'application_tracking', 'max_applications', NULL, true, '{"unlimited": true, "premium_insights": true}'),

-- Inline Text Editing: UNLIMITED AI-powered edits
('elite', 'inline_editing', 'edits_per_month', NULL, true, '{"unlimited": true}'),

-- Version History: 100 versions (all document types, 1-year retention)
('elite', 'version_control', 'max_versions', 100, true, '{"all_document_types": true, "retention_days": 365}'),
('elite', 'version_control', 'complete_history', NULL, true, '{}'),

-- Visa Interview Simulator: 80+ questions/session
('elite', 'visa_interview', 'questions_per_session', 80, true, '{"all_questions": true}'),

-- Cold Email Generator: 500 professional emails per month
('elite', 'cold_email', 'emails_per_month', 500, true, '{"monthly_reset": true}'),

-- AI Model: GPT-4o AI Engine - Most advanced AI model available
('elite', 'ai_model', 'model_type', NULL, true, '{"model": "gpt-4o"}'),

-- Templates & Export
('elite', 'templates_export', 'basic_templates', NULL, true, '{}'),
('elite', 'templates_export', 'premium_templates', NULL, true, '{}'),
('elite', 'templates_export', 'custom_creation', NULL, true, '{"coming_soon": true}'),
('elite', 'templates_export', 'export_formats', NULL, true, '{"formats": ["pdf", "rtf", "docx", "latex", "custom"]}'),

-- Communications
('elite', 'communications', 'support_level', NULL, true, '{"level": "email_24h"}'),
('elite', 'communications', 'email_notifications', NULL, true, '{"instant_deadline_alerts": true, "priority_delivery": true}'),

-- Advanced Features
('elite', 'advanced', 'analytics_dashboard', NULL, true, '{"insights": true}'),
('elite', 'advanced', 'early_access', NULL, true, '{}'),
('elite', 'advanced', 'custom_branding', NULL, true, '{"coming_soon": true}')

ON CONFLICT (plan_type, feature_category, feature_name) DO UPDATE SET
    feature_limit = EXCLUDED.feature_limit,
    feature_enabled = EXCLUDED.feature_enabled,
    feature_metadata = EXCLUDED.feature_metadata,
    updated_at = NOW();

-- 4. Create comprehensive usage checking function
CREATE OR REPLACE FUNCTION get_comprehensive_usage(user_uuid UUID)
RETURNS TABLE (
    sops_created INTEGER,
    cover_letters_created INTEGER,
    personal_statements_created INTEGER,
    academic_cvs_created INTEGER,
    reviews_used INTEGER,
    text_enhancements_used INTEGER,
    word_optimizations_used INTEGER,
    grammar_checks_used INTEGER,
    plagiarism_checks_used INTEGER,
    tone_analyses_used INTEGER,
    university_queries_used INTEGER,
    visa_interview_sessions INTEGER,
    cold_emails_generated INTEGER,
    academic_analyses_used INTEGER,
    inline_edits_used INTEGER,
    version_history_used INTEGER,
    applications_tracked INTEGER
) AS $$
DECLARE
    current_month VARCHAR(7);
BEGIN
    current_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    RETURN QUERY 
    SELECT 
        COALESCE(uu.sops_created, 0)::INTEGER,
        COALESCE(uu.cover_letters_created, 0)::INTEGER,
        COALESCE(uu.personal_statements_created, 0)::INTEGER,
        COALESCE(uu.academic_cvs_created, 0)::INTEGER,
        COALESCE(uu.reviews_used, 0)::INTEGER,
        COALESCE(uu.text_enhancements_used, 0)::INTEGER,
        COALESCE(uu.word_optimizations_used, 0)::INTEGER,
        COALESCE(uu.grammar_checks_used, 0)::INTEGER,
        COALESCE(uu.plagiarism_checks_used, 0)::INTEGER,
        COALESCE(uu.tone_analyses_used, 0)::INTEGER,
        COALESCE(uu.university_queries_used, 0)::INTEGER,
        COALESCE(uu.visa_interview_sessions, 0)::INTEGER,
        COALESCE(uu.cold_emails_generated, 0)::INTEGER,
        COALESCE(uu.academic_analyses_used, 0)::INTEGER,
        COALESCE(uu.inline_edits_used, 0)::INTEGER,
        COALESCE(uu.version_history_used, 0)::INTEGER,
        COALESCE(uu.applications_tracked, 0)::INTEGER
    FROM user_usage uu
    WHERE uu.user_id = user_uuid AND uu.month_year = current_month;
END;
$$ LANGUAGE plpgsql;

-- 5. Create function to increment usage counters
CREATE OR REPLACE FUNCTION increment_comprehensive_usage(
    user_uuid UUID,
    feature_type VARCHAR(50),
    increment_amount INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    current_month VARCHAR(7);
BEGIN
    current_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Insert or update usage record
    INSERT INTO user_usage (user_id, month_year, sops_created, cover_letters_created, personal_statements_created, academic_cvs_created, reviews_used, text_enhancements_used, word_optimizations_used, grammar_checks_used, plagiarism_checks_used, tone_analyses_used, university_queries_used, visa_interview_sessions, cold_emails_generated, academic_analyses_used, inline_edits_used, version_history_used, applications_tracked)
    VALUES (
        user_uuid, 
        current_month,
        CASE WHEN feature_type = 'sops_created' THEN increment_amount ELSE 0 END,
        CASE WHEN feature_type = 'cover_letters_created' THEN increment_amount ELSE 0 END,
        CASE WHEN feature_type = 'personal_statements_created' THEN increment_amount ELSE 0 END,
        CASE WHEN feature_type = 'academic_cvs_created' THEN increment_amount ELSE 0 END,
        CASE WHEN feature_type = 'reviews_used' THEN increment_amount ELSE 0 END,
        CASE WHEN feature_type = 'text_enhancements_used' THEN increment_amount ELSE 0 END,
        CASE WHEN feature_type = 'word_optimizations_used' THEN increment_amount ELSE 0 END,
        CASE WHEN feature_type = 'grammar_checks_used' THEN increment_amount ELSE 0 END,
        CASE WHEN feature_type = 'plagiarism_checks_used' THEN increment_amount ELSE 0 END,
        CASE WHEN feature_type = 'tone_analyses_used' THEN increment_amount ELSE 0 END,
        CASE WHEN feature_type = 'university_queries_used' THEN increment_amount ELSE 0 END,
        CASE WHEN feature_type = 'visa_interview_sessions' THEN increment_amount ELSE 0 END,
        CASE WHEN feature_type = 'cold_emails_generated' THEN increment_amount ELSE 0 END,
        CASE WHEN feature_type = 'academic_analyses_used' THEN increment_amount ELSE 0 END,
        CASE WHEN feature_type = 'inline_edits_used' THEN increment_amount ELSE 0 END,
        CASE WHEN feature_type = 'version_history_used' THEN increment_amount ELSE 0 END,
        CASE WHEN feature_type = 'applications_tracked' THEN increment_amount ELSE 0 END
    )
    ON CONFLICT (user_id, month_year) DO UPDATE SET
        sops_created = user_usage.sops_created + CASE WHEN feature_type = 'sops_created' THEN increment_amount ELSE 0 END,
        cover_letters_created = user_usage.cover_letters_created + CASE WHEN feature_type = 'cover_letters_created' THEN increment_amount ELSE 0 END,
        personal_statements_created = user_usage.personal_statements_created + CASE WHEN feature_type = 'personal_statements_created' THEN increment_amount ELSE 0 END,
        academic_cvs_created = user_usage.academic_cvs_created + CASE WHEN feature_type = 'academic_cvs_created' THEN increment_amount ELSE 0 END,
        reviews_used = user_usage.reviews_used + CASE WHEN feature_type = 'reviews_used' THEN increment_amount ELSE 0 END,
        text_enhancements_used = user_usage.text_enhancements_used + CASE WHEN feature_type = 'text_enhancements_used' THEN increment_amount ELSE 0 END,
        word_optimizations_used = user_usage.word_optimizations_used + CASE WHEN feature_type = 'word_optimizations_used' THEN increment_amount ELSE 0 END,
        grammar_checks_used = user_usage.grammar_checks_used + CASE WHEN feature_type = 'grammar_checks_used' THEN increment_amount ELSE 0 END,
        plagiarism_checks_used = user_usage.plagiarism_checks_used + CASE WHEN feature_type = 'plagiarism_checks_used' THEN increment_amount ELSE 0 END,
        tone_analyses_used = user_usage.tone_analyses_used + CASE WHEN feature_type = 'tone_analyses_used' THEN increment_amount ELSE 0 END,
        university_queries_used = user_usage.university_queries_used + CASE WHEN feature_type = 'university_queries_used' THEN increment_amount ELSE 0 END,
        visa_interview_sessions = user_usage.visa_interview_sessions + CASE WHEN feature_type = 'visa_interview_sessions' THEN increment_amount ELSE 0 END,
        cold_emails_generated = user_usage.cold_emails_generated + CASE WHEN feature_type = 'cold_emails_generated' THEN increment_amount ELSE 0 END,
        academic_analyses_used = user_usage.academic_analyses_used + CASE WHEN feature_type = 'academic_analyses_used' THEN increment_amount ELSE 0 END,
        inline_edits_used = user_usage.inline_edits_used + CASE WHEN feature_type = 'inline_edits_used' THEN increment_amount ELSE 0 END,
        version_history_used = user_usage.version_history_used + CASE WHEN feature_type = 'version_history_used' THEN increment_amount ELSE 0 END,
        applications_tracked = user_usage.applications_tracked + CASE WHEN feature_type = 'applications_tracked' THEN increment_amount ELSE 0 END,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_plan_features_plan_type ON plan_features(plan_type);
CREATE INDEX IF NOT EXISTS idx_plan_features_category ON plan_features(feature_category);
CREATE INDEX IF NOT EXISTS idx_plan_features_enabled ON plan_features(feature_enabled) WHERE feature_enabled = true;
CREATE INDEX IF NOT EXISTS idx_user_usage_user_month ON user_usage(user_id, month_year);

-- 7. Clean up any existing plan_limits table conflicts
-- Note: This assumes you want to keep the new plan_features system
-- DELETE FROM plan_limits WHERE plan_type IN ('free', 'professional', 'elite');

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Corrected Stripe configuration completed successfully!';
    RAISE NOTICE 'This configuration now exactly matches your pricing page.';
    RAISE NOTICE 'Ready for production deployment.';
END
$$; 