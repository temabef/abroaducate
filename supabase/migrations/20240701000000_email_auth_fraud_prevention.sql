-- ====================================
-- EMAIL AUTHENTICATION + FRAUD PREVENTION SYSTEM
-- ====================================
-- This migration adds comprehensive fraud detection for email/password authentication

-- 1. Device Fingerprinting Table
CREATE TABLE IF NOT EXISTS device_fingerprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    fingerprint_hash VARCHAR(64) NOT NULL,
    
    -- Device characteristics
    ip_address INET,
    user_agent TEXT,
    screen_resolution VARCHAR(20),
    timezone VARCHAR(50),
    language VARCHAR(10),
    platform VARCHAR(50),
    
    -- Browser features
    canvas_fingerprint VARCHAR(64),
    webgl_fingerprint VARCHAR(64),
    audio_fingerprint VARCHAR(64),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Index for fast lookups
    UNIQUE(fingerprint_hash)
);

-- 2. Registration Events Tracking
CREATE TABLE IF NOT EXISTS registration_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Registration data
    email_domain VARCHAR(255),
    ip_address INET,
    device_fingerprint VARCHAR(64),
    user_agent TEXT,
    
    -- Verification status
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMPTZ,
    phone_verified BOOLEAN DEFAULT false,
    phone_verified_at TIMESTAMPTZ,
    
    -- Account status
    account_status VARCHAR(50) DEFAULT 'pending' CHECK (account_status IN ('pending', 'verified', 'flagged', 'suspended', 'approved')),
    registration_method VARCHAR(20) DEFAULT 'email' CHECK (registration_method IN ('email', 'google', 'oauth')),
    
    -- Risk assessment
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_factors JSONB DEFAULT '[]',
    manual_review_required BOOLEAN DEFAULT false,
    
    -- Timestamps
    registration_timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Fraud Detection Scores
CREATE TABLE IF NOT EXISTS fraud_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Risk assessment
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Risk factors
    risk_factors JSONB DEFAULT '[]',
    automated_flags JSONB DEFAULT '[]',
    
    -- Review status
    manual_review_needed BOOLEAN DEFAULT false,
    manual_review_completed BOOLEAN DEFAULT false,
    reviewer_notes TEXT,
    
    -- Actions taken
    account_locked BOOLEAN DEFAULT false,
    features_restricted BOOLEAN DEFAULT false,
    subscription_blocked BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- 4. Email Verification Tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Token data
    token VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    
    -- Status
    used BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ
);

-- 5. Rate Limiting Table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identification
    identifier VARCHAR(255) NOT NULL, -- IP, email, device fingerprint
    limit_type VARCHAR(50) NOT NULL, -- 'registration', 'login', 'verification'
    
    -- Limit tracking
    attempt_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    window_duration INTERVAL DEFAULT '1 hour',
    max_attempts INTEGER DEFAULT 5,
    
    -- Status
    blocked_until TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(identifier, limit_type)
);

-- 6. Disposable Email Domains (Common ones)
CREATE TABLE IF NOT EXISTS disposable_email_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain VARCHAR(255) NOT NULL UNIQUE,
    risk_level VARCHAR(20) DEFAULT 'high' CHECK (risk_level IN ('low', 'medium', 'high')),
    blocked BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert common disposable email domains
INSERT INTO disposable_email_domains (domain, risk_level, blocked) VALUES
('10minutemail.com', 'high', true),
('10minutemail.net', 'high', true),
('guerrillamail.com', 'high', true),
('mailinator.com', 'high', true),
('tempmail.org', 'high', true),
('yopmail.com', 'high', true),
('maildrop.cc', 'high', true),
('temp-mail.org', 'high', true),
('sharklasers.com', 'high', true),
('throwaway.email', 'high', true),
('mohmal.com', 'high', true),
('duckduckgo.com', 'medium', false), -- Not disposable but sometimes flagged
('protonmail.com', 'low', false),    -- Secure email, not disposable
('tutanota.com', 'low', false)       -- Secure email, not disposable
ON CONFLICT (domain) DO NOTHING;

-- 7. Academic Email Domains (Bonus verification)
CREATE TABLE IF NOT EXISTS academic_email_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain VARCHAR(255) NOT NULL UNIQUE,
    institution_name VARCHAR(500),
    country VARCHAR(100),
    verified BOOLEAN DEFAULT true,
    bonus_tier VARCHAR(20) DEFAULT 'standard' CHECK (bonus_tier IN ('standard', 'premium', 'elite')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert some common academic domains
INSERT INTO academic_email_domains (domain, institution_name, country, bonus_tier) VALUES
('edu', 'US Educational Institutions', 'United States', 'premium'),
('ac.uk', 'UK Academic Institutions', 'United Kingdom', 'premium'),
('ac.in', 'Indian Academic Institutions', 'India', 'standard'),
('edu.au', 'Australian Educational Institutions', 'Australia', 'premium'),
('ac.za', 'South African Academic Institutions', 'South Africa', 'standard'),
('edu.sg', 'Singapore Educational Institutions', 'Singapore', 'premium'),
('uni-', 'German Universities', 'Germany', 'premium'), -- Prefix match
('harvard.edu', 'Harvard University', 'United States', 'elite'),
('mit.edu', 'MIT', 'United States', 'elite'),
('stanford.edu', 'Stanford University', 'United States', 'elite'),
('oxford.ac.uk', 'Oxford University', 'United Kingdom', 'elite'),
('cambridge.ac.uk', 'Cambridge University', 'United Kingdom', 'elite')
ON CONFLICT (domain) DO NOTHING;

-- 8. Enhanced User Subscriptions for Email Auth
-- Add email verification status and registration method
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS registration_method VARCHAR(20) DEFAULT 'google',
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_tier VARCHAR(20) DEFAULT 'basic' CHECK (verification_tier IN ('basic', 'verified', 'premium'));

-- Update existing Google users to verified status
UPDATE user_subscriptions 
SET registration_method = 'google', 
    email_verified = true, 
    verification_tier = 'verified'
WHERE registration_method IS NULL;

-- 9. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_hash ON device_fingerprints(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_user_id ON device_fingerprints(user_id);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_ip ON device_fingerprints(ip_address);

CREATE INDEX IF NOT EXISTS idx_registration_events_ip ON registration_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_registration_events_email_domain ON registration_events(email_domain);
CREATE INDEX IF NOT EXISTS idx_registration_events_fingerprint ON registration_events(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_registration_events_timestamp ON registration_events(registration_timestamp);

CREATE INDEX IF NOT EXISTS idx_fraud_scores_user_id ON fraud_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_scores_risk_level ON fraud_scores(risk_level);
CREATE INDEX IF NOT EXISTS idx_fraud_scores_manual_review ON fraud_scores(manual_review_needed);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier, limit_type);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);

-- 10. Create Fraud Detection Functions

-- Function to calculate risk score based on multiple factors
CREATE OR REPLACE FUNCTION calculate_fraud_risk_score(
    p_ip_address INET,
    p_email_domain VARCHAR,
    p_device_fingerprint VARCHAR,
    p_user_agent TEXT
) RETURNS INTEGER AS $$
DECLARE
    risk_score INTEGER := 0;
    ip_registration_count INTEGER;
    fingerprint_registration_count INTEGER;
    domain_risk_level VARCHAR;
    is_academic_domain BOOLEAN := false;
BEGIN
    -- Check IP address history (max 30 points)
    SELECT COUNT(*) INTO ip_registration_count
    FROM registration_events
    WHERE ip_address = p_ip_address
    AND registration_timestamp > NOW() - INTERVAL '30 days';
    
    IF ip_registration_count > 5 THEN
        risk_score := risk_score + 30;
    ELSIF ip_registration_count > 2 THEN
        risk_score := risk_score + 15;
    ELSIF ip_registration_count > 1 THEN
        risk_score := risk_score + 5;
    END IF;
    
    -- Check device fingerprint history (max 25 points)
    SELECT COUNT(*) INTO fingerprint_registration_count
    FROM registration_events
    WHERE device_fingerprint = p_device_fingerprint
    AND registration_timestamp > NOW() - INTERVAL '30 days';
    
    IF fingerprint_registration_count > 3 THEN
        risk_score := risk_score + 25;
    ELSIF fingerprint_registration_count > 1 THEN
        risk_score := risk_score + 10;
    END IF;
    
    -- Check email domain (max 35 points)
    SELECT risk_level INTO domain_risk_level
    FROM disposable_email_domains
    WHERE domain = p_email_domain;
    
    IF domain_risk_level = 'high' THEN
        risk_score := risk_score + 35;
    ELSIF domain_risk_level = 'medium' THEN
        risk_score := risk_score + 15;
    END IF;
    
    -- Check if academic domain (reduces risk)
    SELECT EXISTS(
        SELECT 1 FROM academic_email_domains 
        WHERE p_email_domain LIKE '%' || domain OR domain LIKE '%' || p_email_domain
    ) INTO is_academic_domain;
    
    IF is_academic_domain THEN
        risk_score := GREATEST(0, risk_score - 20);
    END IF;
    
    -- Suspicious user agent patterns (max 10 points)
    IF p_user_agent ILIKE '%bot%' OR 
       p_user_agent ILIKE '%crawler%' OR 
       p_user_agent ILIKE '%scraper%' OR
       LENGTH(p_user_agent) < 50 THEN
        risk_score := risk_score + 10;
    END IF;
    
    RETURN LEAST(100, risk_score);
END;
$$ LANGUAGE plpgsql;

-- Function to check if registration should be blocked
CREATE OR REPLACE FUNCTION should_block_registration(
    p_ip_address INET,
    p_email_domain VARCHAR,
    p_device_fingerprint VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    is_blocked BOOLEAN := false;
    hourly_ip_count INTEGER;
    daily_fingerprint_count INTEGER;
BEGIN
    -- Check rate limits
    
    -- Max 3 registrations per hour per IP
    SELECT COUNT(*) INTO hourly_ip_count
    FROM registration_events
    WHERE ip_address = p_ip_address
    AND registration_timestamp > NOW() - INTERVAL '1 hour';
    
    IF hourly_ip_count >= 3 THEN
        is_blocked := true;
    END IF;
    
    -- Max 5 registrations per day per device fingerprint
    SELECT COUNT(*) INTO daily_fingerprint_count
    FROM registration_events
    WHERE device_fingerprint = p_device_fingerprint
    AND registration_timestamp > NOW() - INTERVAL '24 hours';
    
    IF daily_fingerprint_count >= 5 THEN
        is_blocked := true;
    END IF;
    
    -- Check if domain is blocked
    IF EXISTS(
        SELECT 1 FROM disposable_email_domains 
        WHERE domain = p_email_domain AND blocked = true
    ) THEN
        is_blocked := true;
    END IF;
    
    RETURN is_blocked;
END;
$$ LANGUAGE plpgsql;

-- Function to log registration event
CREATE OR REPLACE FUNCTION log_registration_event(
    p_email_domain VARCHAR,
    p_ip_address INET,
    p_device_fingerprint VARCHAR,
    p_user_agent TEXT,
    p_registration_method VARCHAR DEFAULT 'email'
) RETURNS UUID AS $$
DECLARE
    event_id UUID;
    calculated_risk_score INTEGER;
BEGIN
    -- Calculate risk score
    calculated_risk_score := calculate_fraud_risk_score(
        p_ip_address, p_email_domain, p_device_fingerprint, p_user_agent
    );
    
    -- Insert registration event
    INSERT INTO registration_events (
        email_domain, ip_address, device_fingerprint, user_agent,
        registration_method, risk_score, 
        manual_review_required
    ) VALUES (
        p_email_domain, p_ip_address, p_device_fingerprint, p_user_agent,
        p_registration_method, calculated_risk_score,
        calculated_risk_score > 60 -- Require manual review for high risk
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- 11. RLS Policies
ALTER TABLE device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only see their own device fingerprints and fraud scores
CREATE POLICY "users_own_device_fingerprints" ON device_fingerprints
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_fraud_scores" ON fraud_scores
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_verification_tokens" ON email_verification_tokens
    FOR ALL USING (auth.uid() = user_id);

-- Admins can see all fraud detection data
CREATE POLICY "admins_see_all_fraud_data" ON registration_events
    FOR SELECT USING (
        EXISTS(SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

CREATE POLICY "admins_see_all_device_data" ON device_fingerprints
    FOR SELECT USING (
        EXISTS(SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role IN ('admin', 'super-admin'))
    );

-- Public read access to reference tables
CREATE POLICY "public_read_disposable_domains" ON disposable_email_domains
    FOR SELECT USING (true);

CREATE POLICY "public_read_academic_domains" ON academic_email_domains
    FOR SELECT USING (true);

-- 12. Grant Permissions
GRANT EXECUTE ON FUNCTION calculate_fraud_risk_score(INET, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION should_block_registration(INET, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION log_registration_event(VARCHAR, INET, VARCHAR, TEXT, VARCHAR) TO authenticated;

-- ====================================
-- EMAIL AUTH FRAUD PREVENTION COMPLETE
-- ==================================== 