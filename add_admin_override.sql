-- Add admin override functionality to user_subscriptions table
-- This allows manual subscription changes that won't be overridden by Stripe webhooks

-- Add admin override columns
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS admin_override BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Create index for faster queries on admin overrides
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_admin_override 
ON user_subscriptions(admin_override) 
WHERE admin_override = TRUE;

-- Function to set admin override (for testing/customer service)
CREATE OR REPLACE FUNCTION set_admin_subscription_override(
    target_user_id UUID,
    target_plan_type VARCHAR,
    override_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_subscriptions 
    SET 
        plan_type = target_plan_type,
        admin_override = TRUE,
        admin_notes = COALESCE(override_notes, 'Admin override set on ' || NOW()::DATE),
        updated_at = NOW()
    WHERE user_id = target_user_id;
    
    IF FOUND THEN
        RETURN TRUE;
    ELSE
        -- Create subscription if it doesn't exist
        INSERT INTO user_subscriptions (user_id, plan_type, status, admin_override, admin_notes)
        VALUES (target_user_id, target_plan_type, 'active', TRUE, COALESCE(override_notes, 'Admin override created on ' || NOW()::DATE));
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to remove admin override (allows Stripe to control again)
CREATE OR REPLACE FUNCTION remove_admin_subscription_override(
    target_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_subscriptions 
    SET 
        admin_override = FALSE,
        admin_notes = NULL,
        updated_at = NOW()
    WHERE user_id = target_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql; 