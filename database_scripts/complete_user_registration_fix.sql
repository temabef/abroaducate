-- ====================================
-- COMPLETE USER REGISTRATION FIX
-- ====================================
-- This fixes the "database error saving new user" issue
-- Addresses ALL potential problems: profiles, subscriptions, email verification

-- 1. Ensure ALL required tables exist with proper structure

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

-- Email verification tokens table (FIXED)
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Registration events table
CREATE TABLE IF NOT EXISTS registration_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email_domain TEXT NOT NULL,
    ip_address INET,
    device_fingerprint TEXT,
    user_agent TEXT,
    registration_method TEXT DEFAULT 'email',
    success BOOLEAN DEFAULT FALSE,
    blocked_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Device fingerprints table
CREATE TABLE IF NOT EXISTS device_fingerprints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    fingerprint_hash TEXT NOT NULL,
    browser_info JSONB,
    first_seen TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_seen TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    registration_count INTEGER DEFAULT 1,
    is_blocked BOOLEAN DEFAULT FALSE,
    
    -- Unique constraint
    UNIQUE (user_id, fingerprint_hash)
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
CREATE OR REPLACE FUNCTION handle_new_user_complete()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile entry for new user
    BEGIN
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
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    END;
    
    -- Create default subscription for new user
    BEGIN
        INSERT INTO user_subscriptions (user_id, plan_type, status)
        VALUES (NEW.id, 'free', 'active')
        ON CONFLICT (user_id) WHERE status = 'active' DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
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
    EXECUTE FUNCTION handle_new_user_complete();

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
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_fingerprints ENABLE ROW LEVEL SECURITY;

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

-- 10. Create RLS policies for email verification
DROP POLICY IF EXISTS "Users can manage their own verification tokens" ON email_verification_tokens;
CREATE POLICY "Users can manage their own verification tokens" ON email_verification_tokens
    FOR ALL USING (auth.uid() = user_id);

-- 11. Create RLS policies for device fingerprints
DROP POLICY IF EXISTS "Users can manage their own device fingerprints" ON device_fingerprints;
CREATE POLICY "Users can manage their own device fingerprints" ON device_fingerprints
    FOR ALL USING (auth.uid() = user_id);

-- 12. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;
GRANT SELECT ON user_subscriptions TO authenticated;
GRANT SELECT ON user_usage TO authenticated;
GRANT SELECT ON plan_limits TO authenticated;
GRANT SELECT ON plan_limits TO anon;
GRANT ALL ON email_verification_tokens TO authenticated;
GRANT ALL ON device_fingerprints TO authenticated;

-- 13. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_month ON user_usage(user_id, month_year);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_user_id ON device_fingerprints(user_id);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_hash ON device_fingerprints(fingerprint_hash);

-- 14. Remove old conflicting triggers
DROP TRIGGER IF EXISTS create_user_subscription ON auth.users;

-- 15. Create updated subscription function (if needed)
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
    -- This function is now handled by handle_new_user_complete()
    -- Keeping it for backward compatibility
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 16. Verify the fix
DO $$
DECLARE
    profile_count INTEGER;
    user_count INTEGER;
    subscription_count INTEGER;
    verification_table_exists BOOLEAN;
BEGIN
    -- Count profiles
    SELECT COUNT(*) INTO profile_count FROM profiles;
    
    -- Count auth users
    SELECT COUNT(*) INTO user_count FROM auth.users;
    
    -- Count active subscriptions
    SELECT COUNT(*) INTO subscription_count FROM user_subscriptions WHERE status = 'active';
    
    -- Check if email verification table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'email_verification_tokens' 
        AND table_schema = 'public'
    ) INTO verification_table_exists;
    
    RAISE NOTICE 'Profiles count: %, Auth users count: %, Active subscriptions: %, Email verification table exists: %', 
                 profile_count, user_count, subscription_count, verification_table_exists;
    
    IF profile_count = user_count AND subscription_count = user_count AND verification_table_exists THEN
        RAISE NOTICE '✅ SUCCESS: All users have profile entries, subscriptions, and email verification is ready';
    ELSIF profile_count = user_count AND subscription_count = user_count THEN
        RAISE NOTICE '⚠️  WARNING: All users have profiles and subscriptions but email verification table missing';
    ELSIF profile_count = user_count THEN
        RAISE NOTICE '⚠️  WARNING: All users have profiles but subscription count mismatch';
    ELSE
        RAISE NOTICE '⚠️  WARNING: Profile count mismatch. Profiles: %, Users: %', profile_count, user_count;
    END IF;
END $$;

-- 17. Test the trigger (optional - uncomment to test)
/*
-- This will test if the trigger works (don't run in production)
INSERT INTO auth.users (id, email, created_at)
VALUES (gen_random_uuid(), 'test@example.com', NOW())
ON CONFLICT DO NOTHING;
*/ 