-- Update plan limits to match production pricing structure
-- Run this when ready to deploy to production

-- First, remove old plan types if they exist
DELETE FROM plan_limits WHERE plan_type IN ('basic', 'pro');

-- Update/Insert production plan limits
INSERT INTO plan_limits (
    plan_type, 
    sops_limit, 
    cover_letters_limit, 
    personal_statements_limit, 
    academic_cvs_limit,
    ai_improvements_limit, 
    analytics_limit, 
    plagiarism_checks_limit, 
    features
) VALUES
-- FREE TIER: Document-specific limits
(
    'free',
    1,  -- 2 SOPs per month
    1,  -- 2 Cover Letters per month
    1,  -- 1 Personal Statement per month
    1,  -- 1 Academic CV per month
    5,  -- 5 AI reviews per month
    5,  -- 5 analytics reports per month
    1,  -- 1 plagiarism check per month
    '["basic_templates", "pdf_export", "application_tracking", "basic_analytics", "gpt_3_5_turbo"]'::jsonb
),

-- PROFESSIONAL TIER: 50 total documents, unlimited AI
(
    'professional',
    50, -- 50 total documents per month (flexible allocation)
    50, -- (these will be enforced as total, not per-type)
    50, 
    50,
    NULL, -- Unlimited AI reviews
    NULL, -- Unlimited analytics
    NULL, -- Unlimited plagiarism checks
    '["premium_templates", "multiple_export_formats", "advanced_analytics", "priority_support", "gpt_4o_mini", "version_history"]'::jsonb
),

-- ELITE TIER: Everything unlimited
(
    'elite',
    NULL, -- Unlimited SOPs
    NULL, -- Unlimited Cover Letters
    NULL, -- Unlimited Personal Statements
    NULL, -- Unlimited Academic CVs
    NULL, -- Unlimited AI reviews
    NULL, -- Unlimited analytics
    NULL, -- Unlimited plagiarism checks
    '["unlimited_generation", "custom_templates", "all_export_formats", "live_chat_support", "gpt_4o", "team_collaboration", "white_label", "early_access"]'::jsonb
)

ON CONFLICT (plan_type) DO UPDATE SET
    sops_limit = EXCLUDED.sops_limit,
    cover_letters_limit = EXCLUDED.cover_letters_limit,
    personal_statements_limit = EXCLUDED.personal_statements_limit,
    academic_cvs_limit = EXCLUDED.academic_cvs_limit,
    ai_improvements_limit = EXCLUDED.ai_improvements_limit,
    analytics_limit = EXCLUDED.analytics_limit,
    plagiarism_checks_limit = EXCLUDED.plagiarism_checks_limit,
    features = EXCLUDED.features;

-- Add missing columns if they don't exist (for document-specific limits)
ALTER TABLE plan_limits 
ADD COLUMN IF NOT EXISTS cover_letters_limit INTEGER,
ADD COLUMN IF NOT EXISTS personal_statements_limit INTEGER,
ADD COLUMN IF NOT EXISTS academic_cvs_limit INTEGER;

-- Update constraint to only allow production plan types
ALTER TABLE user_subscriptions 
DROP CONSTRAINT IF EXISTS user_subscriptions_plan_type_check;

ALTER TABLE user_subscriptions 
ADD CONSTRAINT user_subscriptions_plan_type_check 
CHECK (plan_type IN ('free', 'professional', 'elite'));

-- Function to get production plan limits for professional tier
-- Professional tier uses total document limit, not per-type
CREATE OR REPLACE FUNCTION get_professional_document_limit(user_uuid UUID, document_type TEXT)
RETURNS INTEGER AS $$
DECLARE
    current_month VARCHAR(7);
    total_documents INTEGER;
    plan_type TEXT;
BEGIN
    current_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Get user's plan
    SELECT us.plan_type INTO plan_type
    FROM user_subscriptions us
    WHERE us.user_id = user_uuid AND us.status = 'active';
    
    -- For professional tier, check total documents across all types
    IF plan_type = 'professional' THEN
        SELECT COALESCE(
            uu.sops_created + 
            uu.cover_letters_created + 
            uu.personal_statements_created + 
            uu.academic_cvs_created, 
            0
        ) INTO total_documents
        FROM user_usage uu
        WHERE uu.user_id = user_uuid AND uu.month_year = current_month;
        
        -- Return remaining documents out of 50 total
        RETURN GREATEST(0, 50 - COALESCE(total_documents, 0));
    END IF;
    
    -- For other plans, return individual limits
    RETURN NULL; -- Will be handled by existing limit functions
END;
$$ LANGUAGE plpgsql;

-- Verify the updates
SELECT plan_type, sops_limit, ai_improvements_limit, features 
FROM plan_limits 
ORDER BY 
    CASE plan_type 
        WHEN 'free' THEN 1 
        WHEN 'professional' THEN 2 
        WHEN 'elite' THEN 3 
    END; 