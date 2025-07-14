-- FINAL CORRECTED PRODUCTION STRIPE CONFIGURATION
-- Updated to match stripe.ts configuration EXACTLY
-- This version reflects the actual pricing page and stripe.ts limits

-- 1. Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS get_comprehensive_usage(uuid);
DROP FUNCTION IF EXISTS increment_comprehensive_usage(uuid, varchar, integer);

-- 2. Update user_usage table to track ALL features
ALTER TABLE user_usage 
ADD COLUMN IF NOT EXISTS reviews_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS text_enhancements_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS word_optimizations_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS grammar_checks_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS plagiarism_checks_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tone_analyses_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS university_queries_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS visa_interview_sessions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cold_emails_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS documents_generated INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS inline_edits_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reset_date DATE DEFAULT CURRENT_DATE;

-- 3. Create subscription plans table with EXACT stripe.ts limits
CREATE TABLE IF NOT EXISTS subscription_plan_limits (
    plan_type VARCHAR(20) PRIMARY KEY,
    
    -- Document Limits (matching stripe.ts exactly)
    sops_limit INTEGER,
    cover_letters_limit INTEGER,
    personal_statements_limit INTEGER,
    academic_cvs_limit INTEGER,
    documents_limit INTEGER, -- For professional (50), elite (unlimited/9999)
    
    -- AI Feature Limits (matching stripe.ts exactly)
    reviews_limit INTEGER,
    text_enhancements_limit INTEGER,
    word_optimizations_limit INTEGER,
    plagiarism_checks_limit INTEGER,
    grammar_checks_limit INTEGER DEFAULT 0,
    tone_analyses_limit INTEGER DEFAULT 0,
    
    -- University Matching (matching stripe.ts exactly)
    university_queries_limit INTEGER,
    
    -- Visa Interview (matching stripe.ts exactly)
    visa_interview_limit INTEGER,
    
    -- Cold Email (matching stripe.ts exactly)
    cold_emails_limit INTEGER,
    
    -- Other features
    inline_edits_limit INTEGER DEFAULT 0,
    version_history BOOLEAN DEFAULT false,
    export_formats TEXT[] DEFAULT ARRAY['pdf', 'rtf'],
    ai_model VARCHAR(50) DEFAULT 'gpt-3.5-turbo',
    support_level VARCHAR(20) DEFAULT 'community'
);

-- 4. Insert plan configurations - MATCHING stripe.ts EXACTLY
INSERT INTO subscription_plan_limits (
    plan_type, 
    sops_limit, cover_letters_limit, personal_statements_limit, academic_cvs_limit,
    documents_limit, reviews_limit, text_enhancements_limit, word_optimizations_limit,
    plagiarism_checks_limit, university_queries_limit, visa_interview_limit,
    cold_emails_limit, ai_model, support_level
) VALUES 
-- FREE PLAN - Matching stripe.ts FREE_PLAN exactly
(
    'free', 
    2, 2, 1, 1,  -- Documents: exactly as defined in stripe.ts
    NULL, 3, 5, 3,  -- AI: 3 reviews, 5 text enhancements, 3 word optimizations
    1, 5, 5,  -- 1 plagiarism check, 5 university queries, 5 visa questions
    0, 'gpt-3.5-turbo', 'community'  -- Cold email DISABLED (0)
),
-- PROFESSIONAL PLAN - Matching stripe.ts SUBSCRIPTION_PLANS.professional exactly
(
    'professional', 
    NULL, NULL, NULL, NULL,  -- Individual limits NULL for professional
    50, 15, 25, 15,  -- 50 total documents, 15 reviews, 25 text enhancements, 15 word optimizations
    10, 25, 50,  -- 10 plagiarism checks, 25 university queries, 50 visa questions
    50, 'gpt-4o-mini', 'email_48h'  -- 50 cold emails as per pricing page
),
-- ELITE PLAN - Matching stripe.ts SUBSCRIPTION_PLANS.elite exactly
(
    'elite', 
    NULL, NULL, NULL, NULL,  -- Individual limits NULL for elite
    9999, 9999, 9999, 9999,  -- Unlimited documents and AI features (9999 = unlimited)
    9999, 9999, 80,  -- Unlimited plagiarism/queries, 80 visa questions (as per pricing page)
    500, 'gpt-4o', 'email_24h'  -- 500 cold emails per month (as per pricing page)
)
ON CONFLICT (plan_type) 
DO UPDATE SET 
    sops_limit = EXCLUDED.sops_limit,
    cover_letters_limit = EXCLUDED.cover_letters_limit,
    personal_statements_limit = EXCLUDED.personal_statements_limit,
    academic_cvs_limit = EXCLUDED.academic_cvs_limit,
    documents_limit = EXCLUDED.documents_limit,
    reviews_limit = EXCLUDED.reviews_limit,
    text_enhancements_limit = EXCLUDED.text_enhancements_limit,
    word_optimizations_limit = EXCLUDED.word_optimizations_limit,
    plagiarism_checks_limit = EXCLUDED.plagiarism_checks_limit,
    university_queries_limit = EXCLUDED.university_queries_limit,
    visa_interview_limit = EXCLUDED.visa_interview_limit,
    cold_emails_limit = EXCLUDED.cold_emails_limit,
    ai_model = EXCLUDED.ai_model,
    support_level = EXCLUDED.support_level;

-- 5. Create function to get user limits (matches stripe.ts exactly)
CREATE OR REPLACE FUNCTION get_comprehensive_usage(user_uuid uuid)
RETURNS TABLE (
    -- Usage tracking
    reviews_used INTEGER,
    text_enhancements_used INTEGER,
    word_optimizations_used INTEGER,
    plagiarism_checks_used INTEGER,
    university_queries_used INTEGER,
    visa_interview_sessions INTEGER,
    cold_emails_used INTEGER,
    sops_used INTEGER,
    cover_letters_used INTEGER,
    personal_statements_used INTEGER,
    academic_cvs_used INTEGER,
    documents_generated INTEGER,
    
    -- Limits from plan
    reviews_limit INTEGER,
    text_enhancements_limit INTEGER,
    word_optimizations_limit INTEGER,
    plagiarism_checks_limit INTEGER,
    university_queries_limit INTEGER,
    visa_interview_limit INTEGER,
    cold_emails_limit INTEGER,
    sops_limit INTEGER,
    cover_letters_limit INTEGER,
    personal_statements_limit INTEGER,
    academic_cvs_limit INTEGER,
    documents_limit INTEGER,
    
    -- Plan details
    plan_type VARCHAR,
    ai_model VARCHAR,
    support_level VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Current usage
        COALESCE(uu.reviews_used, 0) as reviews_used,
        COALESCE(uu.text_enhancements_used, 0) as text_enhancements_used,
        COALESCE(uu.word_optimizations_used, 0) as word_optimizations_used,
        COALESCE(uu.plagiarism_checks_used, 0) as plagiarism_checks_used,
        COALESCE(uu.university_queries_used, 0) as university_queries_used,
        COALESCE(uu.visa_interview_sessions, 0) as visa_interview_sessions,
        COALESCE(uu.cold_emails_used, 0) as cold_emails_used,
        COALESCE(uu.sops_used, 0) as sops_used,
        COALESCE(uu.cover_letters_used, 0) as cover_letters_used,
        COALESCE(uu.personal_statements_used, 0) as personal_statements_used,
        COALESCE(uu.academic_cvs_used, 0) as academic_cvs_used,
        COALESCE(uu.documents_generated, 0) as documents_generated,
        
        -- Plan limits
        spl.reviews_limit,
        spl.text_enhancements_limit,
        spl.word_optimizations_limit,
        spl.plagiarism_checks_limit,
        spl.university_queries_limit,
        spl.visa_interview_limit,
        spl.cold_emails_limit,
        spl.sops_limit,
        spl.cover_letters_limit,
        spl.personal_statements_limit,
        spl.academic_cvs_limit,
        spl.documents_limit,
        
        -- Plan info
        COALESCE(us.plan_type, 'free')::VARCHAR as plan_type,
        spl.ai_model::VARCHAR,
        spl.support_level::VARCHAR
        
    FROM user_usage uu
    RIGHT JOIN (
        SELECT user_uuid as id
    ) u ON uu.user_id = u.id
    LEFT JOIN user_subscriptions us ON us.user_id = u.id AND us.status = 'active'
    LEFT JOIN subscription_plan_limits spl ON spl.plan_type = COALESCE(us.plan_type, 'free')
    WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to increment usage
CREATE OR REPLACE FUNCTION increment_comprehensive_usage(
    user_uuid uuid, 
    usage_type varchar, 
    increment_by integer DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    reset_needed BOOLEAN := FALSE;
BEGIN
    -- Check if monthly reset is needed
    SELECT CASE 
        WHEN uu.last_reset_date < DATE_TRUNC('month', CURRENT_DATE) THEN TRUE 
        ELSE FALSE 
    END INTO reset_needed
    FROM user_usage uu 
    WHERE uu.user_id = user_uuid;
    
    -- Reset usage if needed
    IF reset_needed THEN
        UPDATE user_usage 
        SET reviews_used = 0,
            text_enhancements_used = 0,
            word_optimizations_used = 0,
            plagiarism_checks_used = 0,
            university_queries_used = 0,
            visa_interview_sessions = 0,
            cold_emails_used = 0,
            documents_generated = 0,
            sops_used = 0,
            cover_letters_used = 0,
            personal_statements_used = 0,
            academic_cvs_used = 0,
            last_reset_date = CURRENT_DATE
        WHERE user_id = user_uuid;
    END IF;
    
    -- Insert or update usage
    INSERT INTO user_usage (user_id, last_reset_date)
    VALUES (user_uuid, CURRENT_DATE)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Increment specific usage type
    CASE usage_type
        WHEN 'reviews' THEN
            UPDATE user_usage SET reviews_used = reviews_used + increment_by WHERE user_id = user_uuid;
        WHEN 'text_enhancements' THEN
            UPDATE user_usage SET text_enhancements_used = text_enhancements_used + increment_by WHERE user_id = user_uuid;
        WHEN 'word_optimizations' THEN
            UPDATE user_usage SET word_optimizations_used = word_optimizations_used + increment_by WHERE user_id = user_uuid;
        WHEN 'plagiarism_checks' THEN
            UPDATE user_usage SET plagiarism_checks_used = plagiarism_checks_used + increment_by WHERE user_id = user_uuid;
        WHEN 'university_queries' THEN
            UPDATE user_usage SET university_queries_used = university_queries_used + increment_by WHERE user_id = user_uuid;
        WHEN 'visa_interview' THEN
            UPDATE user_usage SET visa_interview_sessions = visa_interview_sessions + increment_by WHERE user_id = user_uuid;
        WHEN 'cold_emails' THEN
            UPDATE user_usage SET cold_emails_used = cold_emails_used + increment_by WHERE user_id = user_uuid;
        WHEN 'documents' THEN
            UPDATE user_usage SET documents_generated = documents_generated + increment_by WHERE user_id = user_uuid;
        WHEN 'sops' THEN
            UPDATE user_usage SET sops_used = sops_used + increment_by, documents_generated = documents_generated + increment_by WHERE user_id = user_uuid;
        WHEN 'cover_letters' THEN
            UPDATE user_usage SET cover_letters_used = cover_letters_used + increment_by, documents_generated = documents_generated + increment_by WHERE user_id = user_uuid;
        WHEN 'personal_statements' THEN
            UPDATE user_usage SET personal_statements_used = personal_statements_used + increment_by, documents_generated = documents_generated + increment_by WHERE user_id = user_uuid;
        WHEN 'academic_cvs' THEN
            UPDATE user_usage SET academic_cvs_used = academic_cvs_used + increment_by, documents_generated = documents_generated + increment_by WHERE user_id = user_uuid;
    END CASE;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 7. Enable RLS and create policies
ALTER TABLE subscription_plan_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read plan limits" ON subscription_plan_limits
    FOR SELECT USING (true);

-- 8. Grant necessary permissions
GRANT SELECT ON subscription_plan_limits TO authenticated;
GRANT EXECUTE ON FUNCTION get_comprehensive_usage(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_comprehensive_usage(uuid, varchar, integer) TO authenticated;

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage (user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_reset_date ON user_usage (last_reset_date);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions (status);

-- Success message
SELECT 'SUCCESS: Production Stripe configuration updated to match stripe.ts exactly!' as result; 