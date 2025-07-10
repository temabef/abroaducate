-- COMPREHENSIVE PRODUCTION STRIPE CONFIGURATION
-- Handles ALL feature limitations from pricing page
-- Run this for complete production setup

-- 1. Update user_usage table to track ALL features
ALTER TABLE user_usage 
ADD COLUMN IF NOT EXISTS reviews_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS text_enhancements_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS word_optimizations_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS plagiarism_checks_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS university_queries_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS visa_interview_sessions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cold_emails_generated INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS academic_analyses_used INTEGER DEFAULT 0;

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

-- 3. Insert ALL plan features from pricing page
INSERT INTO plan_features (plan_type, feature_category, feature_name, feature_limit, feature_enabled, feature_metadata) VALUES

-- FREE TIER FEATURES
-- Document Generation
('free', 'documents', 'sops_created', 1, true, '{"monthly_reset": true}'),
('free', 'documents', 'cover_letters_created', 1, true, '{"monthly_reset": true}'),
('free', 'documents', 'personal_statements_created', 1, true, '{"monthly_reset": true}'),
('free', 'documents', 'academic_cvs_created', 1, true, '{"monthly_reset": true}'),

-- AI Features
('free', 'ai_features', 'reviews', 2, true, '{"monthly_reset": true}'),
('free', 'ai_features', 'text_enhancements', 4, true, '{"monthly_reset": true}'),
('free', 'ai_features', 'word_optimizations', 2, true, '{"monthly_reset": true}'),
('free', 'ai_features', 'plagiarism_checks', 1, true, '{"monthly_reset": true}'),

-- University Matching
('free', 'university_matching', 'total_universities', 50, true, '{"basic_matching": true}'),
('free', 'university_matching', 'queries_per_month', 5, true, '{"monthly_reset": true}'),
('free', 'university_matching', 'priority_access', 0, false, '{}'),

-- Academic Analysis
('free', 'academic_analysis', 'quick_assessment', NULL, true, '{"unlimited": true}'),
('free', 'academic_analysis', 'comprehensive_transcript', 0, false, '{}'),

-- Templates & Export
('free', 'templates_export', 'basic_templates', NULL, true, '{"count": 6}'),
('free', 'templates_export', 'premium_templates', 0, false, '{}'),
('free', 'templates_export', 'custom_creation', 0, false, '{}'),
('free', 'templates_export', 'export_formats', NULL, true, '{"formats": ["pdf", "rtf"]}'),

-- Version Control
('free', 'version_control', 'cover_letters_only', NULL, true, '{}'),
('free', 'version_control', 'complete_history', 0, false, '{}'),

-- Communications
('free', 'communications', 'email_reminders', 0, false, '{}'),
('free', 'communications', 'notifications', 0, false, '{}'),
('free', 'communications', 'support_level', NULL, true, '{"level": "community"}'),

-- Cold Email
('free', 'cold_email', 'generator', 0, false, '{}'),

-- Visa Interview
('free', 'visa_interview', 'questions_per_session', 5, true, '{}'),

-- AI Model
('free', 'ai_model', 'model_type', NULL, true, '{"model": "gpt-3.5-turbo"}'),

-- PROFESSIONAL TIER FEATURES
-- Document Generation
('professional', 'documents', 'total_documents', 50, true, '{"monthly_reset": true, "flexible_allocation": true}'),

-- AI Features  
('professional', 'ai_features', 'reviews', 15, true, '{"monthly_reset": true}'),
('professional', 'ai_features', 'text_enhancements', 25, true, '{"monthly_reset": true}'),
('professional', 'ai_features', 'word_optimizations', 15, true, '{"monthly_reset": true}'),
('professional', 'ai_features', 'plagiarism_checks', 10, true, '{"monthly_reset": true}'),

-- University Matching
('professional', 'university_matching', 'total_universities', 500, true, '{"international": true}'),
('professional', 'university_matching', 'queries_per_month', 25, true, '{"monthly_reset": true}'),
('professional', 'university_matching', 'priority_access', 0, false, '{}'),

-- Academic Analysis
('professional', 'academic_analysis', 'quick_assessment', NULL, true, '{"unlimited": true}'),
('professional', 'academic_analysis', 'comprehensive_transcript', NULL, true, '{"unlimited": true}'),

-- Templates & Export
('professional', 'templates_export', 'basic_templates', NULL, true, '{}'),
('professional', 'templates_export', 'premium_templates', NULL, true, '{"subject_specific": true}'),
('professional', 'templates_export', 'custom_creation', 0, false, '{}'),
('professional', 'templates_export', 'export_formats', NULL, true, '{"formats": ["pdf", "rtf", "docx"]}'),

-- Version Control
('professional', 'version_control', 'complete_history', NULL, true, '{}'),
('professional', 'version_control', 'document_tracking', NULL, true, '{}'),

-- Communications
('professional', 'communications', 'email_reminders', NULL, true, '{}'),
('professional', 'communications', 'notifications', NULL, true, '{}'),
('professional', 'communications', 'support_level', NULL, true, '{"level": "email_48h"}'),

-- Cold Email
('professional', 'cold_email', 'generator', NULL, true, '{"template_level": "basic"}'),

-- Visa Interview
('professional', 'visa_interview', 'questions_per_session', 20, true, '{}'),

-- Advanced Features
('professional', 'advanced', 'analytics_dashboard', NULL, true, '{}'),

-- AI Model
('professional', 'ai_model', 'model_type', NULL, true, '{"model": "gpt-4o-mini"}'),

-- ELITE TIER FEATURES
-- Document Generation
('elite', 'documents', 'unlimited_generation', NULL, true, '{"unlimited": true}'),

-- AI Features
('elite', 'ai_features', 'reviews', NULL, true, '{"unlimited": true}'),
('elite', 'ai_features', 'text_enhancements', NULL, true, '{"unlimited": true}'),
('elite', 'ai_features', 'word_optimizations', NULL, true, '{"unlimited": true}'),
('elite', 'ai_features', 'plagiarism_checks', NULL, true, '{"unlimited": true}'),

-- University Matching
('elite', 'university_matching', 'total_universities', 1500, true, '{"worldwide": true}'),
('elite', 'university_matching', 'queries_per_month', NULL, true, '{"unlimited": true}'),
('elite', 'university_matching', 'priority_access', NULL, true, '{}'),

-- Academic Analysis
('elite', 'academic_analysis', 'quick_assessment', NULL, true, '{"unlimited": true}'),
('elite', 'academic_analysis', 'comprehensive_transcript', NULL, true, '{"unlimited": true}'),

-- Templates & Export
('elite', 'templates_export', 'basic_templates', NULL, true, '{}'),
('elite', 'templates_export', 'premium_templates', NULL, true, '{}'),
('elite', 'templates_export', 'custom_creation', NULL, true, '{"coming_soon": true}'),
('elite', 'templates_export', 'export_formats', NULL, true, '{"formats": ["pdf", "rtf", "docx", "latex", "custom"]}'),

-- Version Control
('elite', 'version_control', 'complete_history', NULL, true, '{}'),
('elite', 'version_control', 'document_tracking', NULL, true, '{}'),

-- Communications
('elite', 'communications', 'email_reminders', NULL, true, '{}'),
('elite', 'communications', 'notifications', NULL, true, '{}'),
('elite', 'communications', 'support_level', NULL, true, '{"level": "email_24h"}'),

-- Cold Email
('elite', 'cold_email', 'generator', NULL, true, '{"template_level": "advanced"}'),

-- Visa Interview
('elite', 'visa_interview', 'questions_per_session', 30, true, '{"all_questions": true}'),

-- Advanced Features
('elite', 'advanced', 'analytics_dashboard', NULL, true, '{"insights": true}'),
('elite', 'advanced', 'early_access', NULL, true, '{}'),
('elite', 'advanced', 'custom_branding', NULL, true, '{"coming_soon": true}'),

-- AI Model
('elite', 'ai_model', 'model_type', NULL, true, '{"model": "gpt-4o"}')

ON CONFLICT (plan_type, feature_category, feature_name) DO UPDATE SET
    feature_limit = EXCLUDED.feature_limit,
    feature_enabled = EXCLUDED.feature_enabled,
    feature_metadata = EXCLUDED.feature_metadata,
    updated_at = NOW();

-- 4. Create comprehensive usage checking function
CREATE OR REPLACE FUNCTION get_comprehensive_usage(user_uuid UUID)
RETURNS TABLE (
    -- Document usage
    sops_created INTEGER,
    cover_letters_created INTEGER,
    personal_statements_created INTEGER,
    academic_cvs_created INTEGER,
    total_documents INTEGER,
    
    -- AI feature usage
    reviews_used INTEGER,
    text_enhancements_used INTEGER,
    word_optimizations_used INTEGER,
    plagiarism_checks_used INTEGER,
    
    -- Other feature usage
    university_queries_used INTEGER,
    visa_interview_sessions INTEGER,
    cold_emails_generated INTEGER,
    academic_analyses_used INTEGER
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
        COALESCE(
            uu.sops_created + 
            uu.cover_letters_created + 
            uu.personal_statements_created + 
            uu.academic_cvs_created, 
            0
        )::INTEGER,
        COALESCE(uu.reviews_used, 0)::INTEGER,
        COALESCE(uu.text_enhancements_used, 0)::INTEGER,
        COALESCE(uu.word_optimizations_used, 0)::INTEGER,
        COALESCE(uu.plagiarism_checks_used, 0)::INTEGER,
        COALESCE(uu.university_queries_used, 0)::INTEGER,
        COALESCE(uu.visa_interview_sessions, 0)::INTEGER,
        COALESCE(uu.cold_emails_generated, 0)::INTEGER,
        COALESCE(uu.academic_analyses_used, 0)::INTEGER
    FROM user_usage uu
    WHERE uu.user_id = user_uuid 
    AND uu.month_year = current_month;
    
    -- If no usage record exists for this month, return zeros
    IF NOT FOUND THEN
        RETURN QUERY SELECT 0,0,0,0,0,0,0,0,0,0,0,0,0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. Create comprehensive usage increment function
CREATE OR REPLACE FUNCTION increment_comprehensive_usage(
    user_uuid UUID,
    usage_type VARCHAR(100),
    increment_by INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    current_month VARCHAR(7);
    feature_limit INTEGER;
    current_usage INTEGER;
    plan_type TEXT;
BEGIN
    current_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Get user's plan
    SELECT us.plan_type INTO plan_type
    FROM user_subscriptions us
    WHERE us.user_id = user_uuid AND us.status = 'active';
    
    -- Get feature limit from plan_features
    SELECT pf.feature_limit INTO feature_limit
    FROM plan_features pf
    WHERE pf.plan_type = plan_type
    AND pf.feature_name = usage_type
    AND pf.feature_enabled = true;
    
    -- If unlimited (NULL limit), allow the operation
    IF feature_limit IS NULL THEN
        -- Update usage tracking (even for unlimited plans for analytics)
        INSERT INTO user_usage (user_id, month_year, 
            sops_created, cover_letters_created, personal_statements_created, academic_cvs_created,
            reviews_used, text_enhancements_used, word_optimizations_used, plagiarism_checks_used,
            university_queries_used, visa_interview_sessions, cold_emails_generated, academic_analyses_used)
        VALUES (
            user_uuid, 
            current_month,
            CASE WHEN usage_type = 'sops_created' THEN increment_by ELSE 0 END,
            CASE WHEN usage_type = 'cover_letters_created' THEN increment_by ELSE 0 END,
            CASE WHEN usage_type = 'personal_statements_created' THEN increment_by ELSE 0 END,
            CASE WHEN usage_type = 'academic_cvs_created' THEN increment_by ELSE 0 END,
            CASE WHEN usage_type = 'reviews' THEN increment_by ELSE 0 END,
            CASE WHEN usage_type = 'text_enhancements' THEN increment_by ELSE 0 END,
            CASE WHEN usage_type = 'word_optimizations' THEN increment_by ELSE 0 END,
            CASE WHEN usage_type = 'plagiarism_checks' THEN increment_by ELSE 0 END,
            CASE WHEN usage_type = 'university_queries' THEN increment_by ELSE 0 END,
            CASE WHEN usage_type = 'visa_interview_sessions' THEN increment_by ELSE 0 END,
            CASE WHEN usage_type = 'cold_emails_generated' THEN increment_by ELSE 0 END,
            CASE WHEN usage_type = 'academic_analyses_used' THEN increment_by ELSE 0 END
        )
        ON CONFLICT (user_id, month_year) DO UPDATE SET
            sops_created = user_usage.sops_created + CASE WHEN usage_type = 'sops_created' THEN increment_by ELSE 0 END,
            cover_letters_created = user_usage.cover_letters_created + CASE WHEN usage_type = 'cover_letters_created' THEN increment_by ELSE 0 END,
            personal_statements_created = user_usage.personal_statements_created + CASE WHEN usage_type = 'personal_statements_created' THEN increment_by ELSE 0 END,
            academic_cvs_created = user_usage.academic_cvs_created + CASE WHEN usage_type = 'academic_cvs_created' THEN increment_by ELSE 0 END,
            reviews_used = user_usage.reviews_used + CASE WHEN usage_type = 'reviews' THEN increment_by ELSE 0 END,
            text_enhancements_used = user_usage.text_enhancements_used + CASE WHEN usage_type = 'text_enhancements' THEN increment_by ELSE 0 END,
            word_optimizations_used = user_usage.word_optimizations_used + CASE WHEN usage_type = 'word_optimizations' THEN increment_by ELSE 0 END,
            plagiarism_checks_used = user_usage.plagiarism_checks_used + CASE WHEN usage_type = 'plagiarism_checks' THEN increment_by ELSE 0 END,
            university_queries_used = user_usage.university_queries_used + CASE WHEN usage_type = 'university_queries' THEN increment_by ELSE 0 END,
            visa_interview_sessions = user_usage.visa_interview_sessions + CASE WHEN usage_type = 'visa_interview_sessions' THEN increment_by ELSE 0 END,
            cold_emails_generated = user_usage.cold_emails_generated + CASE WHEN usage_type = 'cold_emails_generated' THEN increment_by ELSE 0 END,
            academic_analyses_used = user_usage.academic_analyses_used + CASE WHEN usage_type = 'academic_analyses_used' THEN increment_by ELSE 0 END,
            updated_at = NOW();
        RETURN TRUE;
    END IF;
    
    -- For professional tier total document limit
    IF plan_type = 'professional' AND usage_type IN ('sops_created', 'cover_letters_created', 'personal_statements_created', 'academic_cvs_created') THEN
        SELECT feature_limit INTO feature_limit
        FROM plan_features pf
        WHERE pf.plan_type = plan_type
        AND pf.feature_name = 'total_documents';
        
        -- Get total current document usage
        SELECT COALESCE(
            uu.sops_created + uu.cover_letters_created + 
            uu.personal_statements_created + uu.academic_cvs_created, 0
        ) INTO current_usage
        FROM user_usage uu
        WHERE uu.user_id = user_uuid AND uu.month_year = current_month;
        
        current_usage := COALESCE(current_usage, 0);
    ELSE
        -- Get current usage for specific feature
        EXECUTE format('SELECT COALESCE(%I, 0) FROM user_usage WHERE user_id = $1 AND month_year = $2', 
                      CASE 
                          WHEN usage_type = 'reviews' THEN 'reviews_used'
                          WHEN usage_type = 'text_enhancements' THEN 'text_enhancements_used'
                          WHEN usage_type = 'word_optimizations' THEN 'word_optimizations_used'
                          WHEN usage_type = 'plagiarism_checks' THEN 'plagiarism_checks_used'
                          WHEN usage_type = 'university_queries' THEN 'university_queries_used'
                          ELSE usage_type
                      END)
        INTO current_usage
        USING user_uuid, current_month;
        
        current_usage := COALESCE(current_usage, 0);
    END IF;
    
    -- Check if increment would exceed limit
    IF current_usage + increment_by > feature_limit THEN
        RETURN FALSE;
    END IF;
    
    -- Update usage (same logic as unlimited case)
    INSERT INTO user_usage (user_id, month_year, 
        sops_created, cover_letters_created, personal_statements_created, academic_cvs_created,
        reviews_used, text_enhancements_used, word_optimizations_used, plagiarism_checks_used,
        university_queries_used, visa_interview_sessions, cold_emails_generated, academic_analyses_used)
    VALUES (
        user_uuid, 
        current_month,
        CASE WHEN usage_type = 'sops_created' THEN increment_by ELSE 0 END,
        CASE WHEN usage_type = 'cover_letters_created' THEN increment_by ELSE 0 END,
        CASE WHEN usage_type = 'personal_statements_created' THEN increment_by ELSE 0 END,
        CASE WHEN usage_type = 'academic_cvs_created' THEN increment_by ELSE 0 END,
        CASE WHEN usage_type = 'reviews' THEN increment_by ELSE 0 END,
        CASE WHEN usage_type = 'text_enhancements' THEN increment_by ELSE 0 END,
        CASE WHEN usage_type = 'word_optimizations' THEN increment_by ELSE 0 END,
        CASE WHEN usage_type = 'plagiarism_checks' THEN increment_by ELSE 0 END,
        CASE WHEN usage_type = 'university_queries' THEN increment_by ELSE 0 END,
        CASE WHEN usage_type = 'visa_interview_sessions' THEN increment_by ELSE 0 END,
        CASE WHEN usage_type = 'cold_emails_generated' THEN increment_by ELSE 0 END,
        CASE WHEN usage_type = 'academic_analyses_used' THEN increment_by ELSE 0 END
    )
    ON CONFLICT (user_id, month_year) DO UPDATE SET
        sops_created = user_usage.sops_created + CASE WHEN usage_type = 'sops_created' THEN increment_by ELSE 0 END,
        cover_letters_created = user_usage.cover_letters_created + CASE WHEN usage_type = 'cover_letters_created' THEN increment_by ELSE 0 END,
        personal_statements_created = user_usage.personal_statements_created + CASE WHEN usage_type = 'personal_statements_created' THEN increment_by ELSE 0 END,
        academic_cvs_created = user_usage.academic_cvs_created + CASE WHEN usage_type = 'academic_cvs_created' THEN increment_by ELSE 0 END,
        reviews_used = user_usage.reviews_used + CASE WHEN usage_type = 'reviews' THEN increment_by ELSE 0 END,
        text_enhancements_used = user_usage.text_enhancements_used + CASE WHEN usage_type = 'text_enhancements' THEN increment_by ELSE 0 END,
        word_optimizations_used = user_usage.word_optimizations_used + CASE WHEN usage_type = 'word_optimizations' THEN increment_by ELSE 0 END,
        plagiarism_checks_used = user_usage.plagiarism_checks_used + CASE WHEN usage_type = 'plagiarism_checks' THEN increment_by ELSE 0 END,
        university_queries_used = user_usage.university_queries_used + CASE WHEN usage_type = 'university_queries' THEN increment_by ELSE 0 END,
        visa_interview_sessions = user_usage.visa_interview_sessions + CASE WHEN usage_type = 'visa_interview_sessions' THEN increment_by ELSE 0 END,
        cold_emails_generated = user_usage.cold_emails_generated + CASE WHEN usage_type = 'cold_emails_generated' THEN increment_by ELSE 0 END,
        academic_analyses_used = user_usage.academic_analyses_used + CASE WHEN usage_type = 'academic_analyses_used' THEN increment_by ELSE 0 END,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_plan_features_plan_type ON plan_features(plan_type);
CREATE INDEX IF NOT EXISTS idx_plan_features_category ON plan_features(feature_category);
CREATE INDEX IF NOT EXISTS idx_plan_features_enabled ON plan_features(feature_enabled) WHERE feature_enabled = true;

-- 7. Verify the comprehensive setup
SELECT 'Comprehensive plan features setup complete!' as status;
SELECT plan_type, COUNT(*) as features_count 
FROM plan_features 
GROUP BY plan_type 
ORDER BY plan_type; 