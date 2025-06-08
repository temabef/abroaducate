-- Subscription System Migration
-- Run this in your Supabase SQL editor

-- User subscription management
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('free', 'basic', 'pro')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create partial unique index to ensure one active subscription per user
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_subscription_per_user 
ON user_subscriptions (user_id) 
WHERE status = 'active';

-- Usage tracking for plan limits
CREATE TABLE IF NOT EXISTS user_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    month_year VARCHAR(7) NOT NULL, -- Format: '2025-01'
    sops_created INTEGER DEFAULT 0,
    ai_improvements_used INTEGER DEFAULT 0,
    analytics_generated INTEGER DEFAULT 0,
    plagiarism_checks INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One usage record per user per month
    UNIQUE(user_id, month_year)
);

-- Plan limits configuration
CREATE TABLE IF NOT EXISTS plan_limits (
    plan_type VARCHAR(50) PRIMARY KEY,
    sops_limit INTEGER, -- NULL means unlimited
    ai_improvements_limit INTEGER,
    analytics_limit INTEGER,
    plagiarism_checks_limit INTEGER,
    features JSONB, -- JSON array of available features
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plan configurations
INSERT INTO plan_limits (plan_type, sops_limit, ai_improvements_limit, analytics_limit, plagiarism_checks_limit, features) VALUES
('free', 1, 3, 0, 1, '["basic_generation", "limited_editing"]'),
('basic', 10, 50, 10, 10, '["basic_generation", "ai_improvements", "tone_analysis", "basic_analytics", "plagiarism_check"]'),
('pro', NULL, NULL, NULL, NULL, '["unlimited_generation", "advanced_ai", "full_analytics", "priority_support", "export_options"]')
ON CONFLICT (plan_type) DO UPDATE SET
    sops_limit = EXCLUDED.sops_limit,
    ai_improvements_limit = EXCLUDED.ai_improvements_limit,
    analytics_limit = EXCLUDED.analytics_limit,
    plagiarism_checks_limit = EXCLUDED.plagiarism_checks_limit,
    features = EXCLUDED.features;

-- Function to create default free subscription for new users
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
    -- Use INSERT with try/catch approach
    BEGIN
        INSERT INTO user_subscriptions (user_id, plan_type, status)
        VALUES (NEW.id, 'free', 'active');
    EXCEPTION WHEN unique_violation THEN
        -- User already has an active subscription, do nothing
        NULL;
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default subscription on user creation
DROP TRIGGER IF EXISTS create_user_subscription ON auth.users;
CREATE TRIGGER create_user_subscription
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_subscription();

-- Function to get current usage for a user
CREATE OR REPLACE FUNCTION get_current_usage(user_uuid UUID)
RETURNS TABLE (
    sops_created INTEGER,
    ai_improvements_used INTEGER,
    analytics_generated INTEGER,
    plagiarism_checks INTEGER
) AS $$
DECLARE
    current_month VARCHAR(7);
BEGIN
    current_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    RETURN QUERY
    SELECT 
        COALESCE(u.sops_created, 0),
        COALESCE(u.ai_improvements_used, 0),
        COALESCE(u.analytics_generated, 0),
        COALESCE(u.plagiarism_checks, 0)
    FROM user_usage u
    WHERE u.user_id = user_uuid AND u.month_year = current_month
    UNION ALL
    SELECT 0, 0, 0, 0
    WHERE NOT EXISTS (
        SELECT 1 FROM user_usage u2 
        WHERE u2.user_id = user_uuid AND u2.month_year = current_month
    )
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to increment usage counter
CREATE OR REPLACE FUNCTION increment_usage(
    user_uuid UUID,
    usage_type VARCHAR(50),
    increment_by INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    current_month VARCHAR(7);
    current_plan VARCHAR(50);
    plan_limit INTEGER;
    current_usage INTEGER;
BEGIN
    current_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Get user's current plan
    SELECT plan_type INTO current_plan
    FROM user_subscriptions
    WHERE user_id = user_uuid AND status = 'active'
    LIMIT 1;
    
    IF current_plan IS NULL THEN
        current_plan := 'free';
    END IF;
    
    -- Get plan limit for this usage type
    CASE usage_type
        WHEN 'sops_created' THEN
            SELECT sops_limit INTO plan_limit FROM plan_limits WHERE plan_type = current_plan;
        WHEN 'ai_improvements_used' THEN
            SELECT ai_improvements_limit INTO plan_limit FROM plan_limits WHERE plan_type = current_plan;
        WHEN 'analytics_generated' THEN
            SELECT analytics_limit INTO plan_limit FROM plan_limits WHERE plan_type = current_plan;
        WHEN 'plagiarism_checks' THEN
            SELECT plagiarism_checks_limit INTO plan_limit FROM plan_limits WHERE plan_type = current_plan;
    END CASE;
    
    -- If limit is NULL (unlimited), allow increment
    IF plan_limit IS NULL THEN
        -- Insert or update usage
        INSERT INTO user_usage (user_id, month_year, sops_created, ai_improvements_used, analytics_generated, plagiarism_checks)
        VALUES (
            user_uuid, 
            current_month,
            CASE WHEN usage_type = 'sops_created' THEN increment_by ELSE 0 END,
            CASE WHEN usage_type = 'ai_improvements_used' THEN increment_by ELSE 0 END,
            CASE WHEN usage_type = 'analytics_generated' THEN increment_by ELSE 0 END,
            CASE WHEN usage_type = 'plagiarism_checks' THEN increment_by ELSE 0 END
        )
        ON CONFLICT (user_id, month_year) DO UPDATE SET
            sops_created = user_usage.sops_created + CASE WHEN usage_type = 'sops_created' THEN increment_by ELSE 0 END,
            ai_improvements_used = user_usage.ai_improvements_used + CASE WHEN usage_type = 'ai_improvements_used' THEN increment_by ELSE 0 END,
            analytics_generated = user_usage.analytics_generated + CASE WHEN usage_type = 'analytics_generated' THEN increment_by ELSE 0 END,
            plagiarism_checks = user_usage.plagiarism_checks + CASE WHEN usage_type = 'plagiarism_checks' THEN increment_by ELSE 0 END,
            updated_at = NOW();
        RETURN TRUE;
    END IF;
    
    -- Get current usage
    CASE usage_type
        WHEN 'sops_created' THEN
            SELECT COALESCE(sops_created, 0) INTO current_usage FROM user_usage WHERE user_id = user_uuid AND month_year = current_month;
        WHEN 'ai_improvements_used' THEN
            SELECT COALESCE(ai_improvements_used, 0) INTO current_usage FROM user_usage WHERE user_id = user_uuid AND month_year = current_month;
        WHEN 'analytics_generated' THEN
            SELECT COALESCE(analytics_generated, 0) INTO current_usage FROM user_usage WHERE user_id = user_uuid AND month_year = current_month;
        WHEN 'plagiarism_checks' THEN
            SELECT COALESCE(plagiarism_checks, 0) INTO current_usage FROM user_usage WHERE user_id = user_uuid AND month_year = current_month;
    END CASE;
    
    current_usage := COALESCE(current_usage, 0);
    
    -- Check if increment would exceed limit
    IF current_usage + increment_by > plan_limit THEN
        RETURN FALSE;
    END IF;
    
    -- Increment usage
    INSERT INTO user_usage (user_id, month_year, sops_created, ai_improvements_used, analytics_generated, plagiarism_checks)
    VALUES (
        user_uuid, 
        current_month,
        CASE WHEN usage_type = 'sops_created' THEN increment_by ELSE 0 END,
        CASE WHEN usage_type = 'ai_improvements_used' THEN increment_by ELSE 0 END,
        CASE WHEN usage_type = 'analytics_generated' THEN increment_by ELSE 0 END,
        CASE WHEN usage_type = 'plagiarism_checks' THEN increment_by ELSE 0 END
    )
    ON CONFLICT (user_id, month_year) DO UPDATE SET
        sops_created = user_usage.sops_created + CASE WHEN usage_type = 'sops_created' THEN increment_by ELSE 0 END,
        ai_improvements_used = user_usage.ai_improvements_used + CASE WHEN usage_type = 'ai_improvements_used' THEN increment_by ELSE 0 END,
        analytics_generated = user_usage.analytics_generated + CASE WHEN usage_type = 'analytics_generated' THEN increment_by ELSE 0 END,
        plagiarism_checks = user_usage.plagiarism_checks + CASE WHEN usage_type = 'plagiarism_checks' THEN increment_by ELSE 0 END,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;

-- Users can only see their own subscription data
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own usage" ON user_usage
    FOR SELECT USING (auth.uid() = user_id);

-- Plan limits are readable by all authenticated users
CREATE POLICY "Plan limits are public" ON plan_limits
    FOR SELECT USING (auth.role() = 'authenticated');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_month ON user_usage(user_id, month_year);

-- Create default subscriptions for existing users
INSERT INTO user_subscriptions (user_id, plan_type, status)
SELECT id, 'free', 'active'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_subscriptions WHERE status = 'active');

-- Add missing table for analysis results
CREATE TABLE IF NOT EXISTS sop_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL,
    result JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for sop_analyses
ALTER TABLE sop_analyses ENABLE ROW LEVEL SECURITY;

-- Policy for sop_analyses
CREATE POLICY "Users can view own analyses" ON sop_analyses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses" ON sop_analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id); 