-- ====================================
-- COMPREHENSIVE USER REGISTRATION FIX
-- ====================================
-- This fixes the "database error saving new user" issue
-- Addresses both profile creation and subscription creation problems

-- 1. Ensure all required tables exist with proper structure

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions table
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

-- User usage table
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

-- Plan limits table
CREATE TABLE IF NOT EXISTS plan_limits (
    plan_type VARCHAR(50) PRIMARY KEY,
    sops_limit INTEGER, -- NULL means unlimited
    ai_improvements_limit INTEGER,
    analytics_limit INTEGER,
    plagiarism_checks_limit INTEGER,
    features JSONB, -- JSON array of available features
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert default plan configurations
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

-- 3. Create comprehensive function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user_comprehensive()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile entry for new user
    INSERT INTO profiles (id, email, full_name, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.created_at
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        updated_at = NOW();
    
    -- Create default subscription for new user
    BEGIN
        INSERT INTO user_subscriptions (user_id, plan_type, status)
        VALUES (NEW.id, 'free', 'active')
        ON CONFLICT (user_id) WHERE status = 'active' DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        -- Log error but don't fail the user creation
        RAISE WARNING 'Failed to create subscription for user %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger to automatically handle new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user_comprehensive();

-- 5. Populate missing profiles for existing users
INSERT INTO profiles (id, email, full_name, created_at)
SELECT 
    u.id, 
    u.email, 
    COALESCE(u.raw_user_meta_data->>'full_name', ''),
    u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = NOW();

-- 6. Create default subscriptions for existing users
INSERT INTO user_subscriptions (user_id, plan_type, status)
SELECT id, 'free', 'active'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_subscriptions WHERE status = 'active')
ON CONFLICT (user_id) WHERE status = 'active' DO NOTHING;

-- 7. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 9. Create RLS policies for subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own usage" ON user_usage;
CREATE POLICY "Users can view own usage" ON user_usage
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Plan limits are public" ON plan_limits;
CREATE POLICY "Plan limits are public" ON plan_limits
    FOR SELECT USING (auth.role() = 'authenticated');

-- 10. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;
GRANT SELECT ON user_subscriptions TO authenticated;
GRANT SELECT ON user_usage TO authenticated;
GRANT SELECT ON plan_limits TO authenticated;
GRANT SELECT ON plan_limits TO anon;

-- 11. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_month ON user_usage(user_id, month_year);

-- 12. Verify the fix
DO $$
DECLARE
    profile_count INTEGER;
    user_count INTEGER;
    subscription_count INTEGER;
BEGIN
    -- Count profiles
    SELECT COUNT(*) INTO profile_count FROM profiles;
    
    -- Count auth users
    SELECT COUNT(*) INTO user_count FROM auth.users;
    
    -- Count active subscriptions
    SELECT COUNT(*) INTO subscription_count FROM user_subscriptions WHERE status = 'active';
    
    RAISE NOTICE 'Profiles count: %, Auth users count: %, Active subscriptions: %', 
                 profile_count, user_count, subscription_count;
    
    IF profile_count = user_count AND subscription_count = user_count THEN
        RAISE NOTICE '✅ SUCCESS: All users have profile entries and subscriptions';
    ELSIF profile_count = user_count THEN
        RAISE NOTICE '⚠️  WARNING: All users have profiles but subscription count mismatch';
    ELSE
        RAISE NOTICE '⚠️  WARNING: Profile count mismatch. Profiles: %, Users: %', profile_count, user_count;
    END IF;
END $$;

-- 13. Remove old conflicting triggers
DROP TRIGGER IF EXISTS create_user_subscription ON auth.users;

-- 14. Create updated subscription function (if needed)
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
    -- This function is now handled by handle_new_user_comprehensive()
    -- Keeping it for backward compatibility
    RETURN NEW;
END;
$$ LANGUAGE plpgsql; 