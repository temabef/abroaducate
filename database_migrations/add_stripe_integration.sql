-- Add Stripe integration fields to user_subscriptions table
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Create index for faster Stripe lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription_id 
ON user_subscriptions(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer_id 
ON user_subscriptions(stripe_customer_id);

-- Update plan limits for new subscription tiers
UPDATE plan_limits SET 
    sops_limit = 10,
    ai_improvements_limit = 50,
    analytics_limit = 10,
    plagiarism_checks_limit = 10
WHERE plan_type = 'basic';

UPDATE plan_limits SET 
    sops_limit = NULL,  -- NULL means unlimited
    ai_improvements_limit = NULL,
    analytics_limit = NULL,
    plagiarism_checks_limit = NULL
WHERE plan_type = 'pro';

-- Insert pro plan if it doesn't exist (it should already exist from the original migration)
INSERT INTO plan_limits (plan_type, sops_limit, ai_improvements_limit, analytics_limit, plagiarism_checks_limit, features)
VALUES ('pro', NULL, NULL, NULL, NULL, '["unlimited_generation", "advanced_ai", "full_analytics", "priority_support", "export_options"]')
ON CONFLICT (plan_type) DO UPDATE SET
    sops_limit = EXCLUDED.sops_limit,
    ai_improvements_limit = EXCLUDED.ai_improvements_limit,
    analytics_limit = EXCLUDED.analytics_limit,
    plagiarism_checks_limit = EXCLUDED.plagiarism_checks_limit; 