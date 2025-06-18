-- Email Security and Verification Migration
-- This migration adds tables for email verification, rate limiting, and security tracking

-- Email verification tokens table
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Indexes for performance
    INDEX (user_id),
    INDEX (email),
    INDEX (token),
    INDEX (expires_at)
);

-- Registration events for rate limiting
CREATE TABLE IF NOT EXISTS public.registration_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email_domain TEXT NOT NULL,
    ip_address INET,
    device_fingerprint TEXT,
    user_agent TEXT,
    registration_method TEXT DEFAULT 'email',
    success BOOLEAN DEFAULT FALSE,
    blocked_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Indexes for rate limiting queries
    INDEX (email_domain, created_at),
    INDEX (ip_address, created_at),
    INDEX (device_fingerprint, created_at)
);

-- Academic email domains for verification
CREATE TABLE IF NOT EXISTS public.academic_email_domains (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    domain TEXT NOT NULL UNIQUE,
    institution_name TEXT NOT NULL,
    country TEXT,
    bonus_tier TEXT DEFAULT 'basic' CHECK (bonus_tier IN ('basic', 'premium', 'elite')),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Index for domain lookups
    INDEX (domain)
);

-- Blocked email domains
CREATE TABLE IF NOT EXISTS public.blocked_email_domains (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    domain TEXT NOT NULL UNIQUE,
    reason TEXT,
    block_type TEXT DEFAULT 'temporary' CHECK (block_type IN ('temporary', 'permanent')),
    blocked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Index for domain lookups
    INDEX (domain)
);

-- Device fingerprints for fraud prevention
CREATE TABLE IF NOT EXISTS public.device_fingerprints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    fingerprint_hash TEXT NOT NULL,
    browser_info JSONB,
    first_seen TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_seen TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    registration_count INTEGER DEFAULT 1,
    is_blocked BOOLEAN DEFAULT FALSE,
    
    -- Unique constraint
    UNIQUE (user_id, fingerprint_hash),
    
    -- Indexes
    INDEX (fingerprint_hash),
    INDEX (user_id),
    INDEX (last_seen)
);

-- Enable RLS
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_email_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_email_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Email verification tokens
CREATE POLICY "Users can manage their own verification tokens" ON public.email_verification_tokens
    FOR ALL USING (auth.uid() = user_id);

-- Registration events (admin only)
CREATE POLICY "Admin can view registration events" ON public.registration_events
    FOR SELECT USING (auth.jwt() ->> 'email' = 'admin@abroaducate.com');

-- Academic domains (public read)
CREATE POLICY "Public can read academic domains" ON public.academic_email_domains
    FOR SELECT USING (TRUE);

-- Blocked domains (public read for validation)
CREATE POLICY "Public can read blocked domains" ON public.blocked_email_domains
    FOR SELECT USING (TRUE);

-- Device fingerprints
CREATE POLICY "Users can manage their own device fingerprints" ON public.device_fingerprints
    FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.email_verification_tokens TO authenticated;
GRANT SELECT ON public.registration_events TO authenticated;
GRANT SELECT ON public.academic_email_domains TO authenticated;
GRANT SELECT ON public.blocked_email_domains TO authenticated;
GRANT ALL ON public.device_fingerprints TO authenticated;

-- Function to log registration events
CREATE OR REPLACE FUNCTION log_registration_event(
    p_email_domain TEXT,
    p_ip_address TEXT DEFAULT '0.0.0.0',
    p_device_fingerprint TEXT DEFAULT '',
    p_user_agent TEXT DEFAULT '',
    p_registration_method TEXT DEFAULT 'email'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.registration_events (
        email_domain,
        ip_address,
        device_fingerprint,
        user_agent,
        registration_method,
        success
    ) VALUES (
        p_email_domain,
        p_ip_address::INET,
        p_device_fingerprint,
        p_user_agent,
        p_registration_method,
        TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check registration rate limit
CREATE OR REPLACE FUNCTION check_registration_rate_limit(
    p_email_domain TEXT,
    p_time_window_hours INTEGER DEFAULT 1,
    p_max_registrations INTEGER DEFAULT 5
) RETURNS BOOLEAN AS $$
DECLARE
    registration_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO registration_count
    FROM public.registration_events
    WHERE email_domain = p_email_domain
      AND created_at > NOW() - (p_time_window_hours || ' hours')::INTERVAL
      AND success = TRUE;
    
    RETURN registration_count >= p_max_registrations;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert common academic domains
INSERT INTO public.academic_email_domains (domain, institution_name, country, bonus_tier) VALUES
-- Elite US Universities
('harvard.edu', 'Harvard University', 'US', 'elite'),
('mit.edu', 'Massachusetts Institute of Technology', 'US', 'elite'),
('stanford.edu', 'Stanford University', 'US', 'elite'),
('yale.edu', 'Yale University', 'US', 'elite'),
('princeton.edu', 'Princeton University', 'US', 'elite'),
('caltech.edu', 'California Institute of Technology', 'US', 'elite'),
('columbia.edu', 'Columbia University', 'US', 'elite'),
('chicago.edu', 'University of Chicago', 'US', 'elite'),

-- Elite UK Universities
('oxford.ac.uk', 'University of Oxford', 'UK', 'elite'),
('cambridge.ac.uk', 'University of Cambridge', 'UK', 'elite'),
('imperial.ac.uk', 'Imperial College London', 'UK', 'elite'),
('lse.ac.uk', 'London School of Economics', 'UK', 'elite'),

-- Premium Universities
('berkeley.edu', 'University of California Berkeley', 'US', 'premium'),
('ucla.edu', 'University of California Los Angeles', 'US', 'premium'),
('cornell.edu', 'Cornell University', 'US', 'premium'),
('upenn.edu', 'University of Pennsylvania', 'US', 'premium'),
('brown.edu', 'Brown University', 'US', 'premium'),
('dartmouth.edu', 'Dartmouth College', 'US', 'premium'),
('duke.edu', 'Duke University', 'US', 'premium'),
('northwestern.edu', 'Northwestern University', 'US', 'premium'),

-- Insert common temporary email domains to block
INSERT INTO public.blocked_email_domains (domain, reason, block_type) VALUES
('10minutemail.com', 'Temporary email service', 'permanent'),
('guerrillamail.com', 'Temporary email service', 'permanent'),
('tempmail.com', 'Temporary email service', 'permanent'),
('mailinator.com', 'Temporary email service', 'permanent'),
('yopmail.com', 'Temporary email service', 'permanent'),
('throwaway.email', 'Temporary email service', 'permanent'),
('temp-mail.org', 'Temporary email service', 'permanent'),
('maildrop.cc', 'Temporary email service', 'permanent'),
('sharklasers.com', 'Temporary email service', 'permanent'),
('emailondeck.com', 'Temporary email service', 'permanent');

-- Comments
COMMENT ON TABLE public.email_verification_tokens IS 'Email verification tokens for account activation';
COMMENT ON TABLE public.registration_events IS 'Track registration events for rate limiting and fraud detection';
COMMENT ON TABLE public.academic_email_domains IS 'Academic email domains with bonus tier information';
COMMENT ON TABLE public.blocked_email_domains IS 'Blocked email domains for security';
COMMENT ON TABLE public.device_fingerprints IS 'Device fingerprints for fraud prevention'; 