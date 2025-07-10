-- Email Security and Verification Migration (PostgreSQL Fixed v2)
-- This migration adds tables for email verification, rate limiting, and security tracking

-- Email verification tokens table
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Registration events for rate limiting
CREATE TABLE IF NOT EXISTS public.registration_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email_domain TEXT NOT NULL,
    ip_address INET,
    device_fingerprint TEXT,
    user_agent TEXT,
    success BOOLEAN DEFAULT FALSE,
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Email validation results
CREATE TABLE IF NOT EXISTS public.email_validations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    domain TEXT NOT NULL,
    is_academic BOOLEAN DEFAULT FALSE,
    is_blocked BOOLEAN DEFAULT FALSE,
    validation_score INTEGER DEFAULT 0,
    validation_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(email)
);

-- Academic email domains (for bonus features)
CREATE TABLE IF NOT EXISTS public.academic_domains (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    domain TEXT NOT NULL UNIQUE,
    institution_name TEXT,
    country TEXT,
    domain_type TEXT CHECK (domain_type IN ('university', 'college', 'research', 'government')),
    verified BOOLEAN DEFAULT FALSE,
    bonus_tier INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Blocked email domains
CREATE TABLE IF NOT EXISTS public.blocked_domains (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    domain TEXT NOT NULL UNIQUE,
    block_reason TEXT CHECK (block_reason IN ('temporary', 'spam', 'fraud', 'disposable')),
    blocked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    notes TEXT
);

-- Security events log
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('login_attempt', 'registration_attempt', 'password_reset', 'suspicious_activity')),
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT FALSE,
    details JSONB DEFAULT '{}',
    severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own verification tokens" ON public.email_verification_tokens;
DROP POLICY IF EXISTS "Admin read access to registration events" ON public.registration_events;
DROP POLICY IF EXISTS "Public read access to email validations" ON public.email_validations;
DROP POLICY IF EXISTS "Public read access to academic domains" ON public.academic_domains;
DROP POLICY IF EXISTS "Public read access to blocked domains" ON public.blocked_domains;
DROP POLICY IF EXISTS "Admin access to security events" ON public.security_events;

-- Create RLS policies
CREATE POLICY "Users can manage their own verification tokens" ON public.email_verification_tokens
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admin read access to registration events" ON public.registration_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super-admin')
        ) OR 
        (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('admin@abroaducate.com', 'solakolawole62@gmail.com')
    );

CREATE POLICY "Public read access to email validations" ON public.email_validations
    FOR SELECT USING (true);

CREATE POLICY "Public read access to academic domains" ON public.academic_domains
    FOR SELECT USING (verified = true);

CREATE POLICY "Public read access to blocked domains" ON public.blocked_domains
    FOR SELECT USING (true);

CREATE POLICY "Admin access to security events" ON public.security_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super-admin')
        ) OR 
        (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('admin@abroaducate.com', 'solakolawole62@gmail.com')
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON public.email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON public.email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON public.email_verification_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_registration_events_email_domain ON public.registration_events(email_domain);
CREATE INDEX IF NOT EXISTS idx_registration_events_ip_address ON public.registration_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_registration_events_created_at ON public.registration_events(created_at);

CREATE INDEX IF NOT EXISTS idx_email_validations_email ON public.email_validations(email);
CREATE INDEX IF NOT EXISTS idx_email_validations_domain ON public.email_validations(domain);
CREATE INDEX IF NOT EXISTS idx_email_validations_is_academic ON public.email_validations(is_academic);

CREATE INDEX IF NOT EXISTS idx_academic_domains_domain ON public.academic_domains(domain);
CREATE INDEX IF NOT EXISTS idx_academic_domains_verified ON public.academic_domains(verified);

CREATE INDEX IF NOT EXISTS idx_blocked_domains_domain ON public.blocked_domains(domain);

CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at);

-- Grant permissions
GRANT SELECT ON public.email_validations TO anon, authenticated;
GRANT SELECT ON public.academic_domains TO anon, authenticated;
GRANT SELECT ON public.blocked_domains TO anon, authenticated;

-- Insert some common academic domains
INSERT INTO public.academic_domains (domain, institution_name, country, domain_type, verified, bonus_tier) VALUES
('.edu', 'US Educational Institutions', 'United States', 'university', true, 2),
('.ac.uk', 'UK Academic Institutions', 'United Kingdom', 'university', true, 2),
('.edu.au', 'Australian Universities', 'Australia', 'university', true, 2),
('.ac.in', 'Indian Academic Institutions', 'India', 'university', true, 1),
('.edu.ng', 'Nigerian Universities', 'Nigeria', 'university', true, 1),
('.ac.za', 'South African Universities', 'South Africa', 'university', true, 1)
ON CONFLICT (domain) DO NOTHING;

-- Insert common blocked domains
INSERT INTO public.blocked_domains (domain, block_reason, notes) VALUES
('10minutemail.com', 'temporary', 'Temporary email service'),
('guerrillamail.com', 'temporary', 'Temporary email service'),
('mailinator.com', 'temporary', 'Temporary email service'),
('tempail.com', 'temporary', 'Temporary email service'),
('throwaway.email', 'disposable', 'Disposable email service')
ON CONFLICT (domain) DO NOTHING;

-- Helper functions for email validation
CREATE OR REPLACE FUNCTION public.is_academic_email(email_address TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    domain_part TEXT;
    is_academic BOOLEAN := FALSE;
BEGIN
    IF email_address IS NULL OR email_address = '' THEN
        RETURN FALSE;
    END IF;
    
    domain_part := lower(split_part(email_address, '@', 2));
    
    SELECT EXISTS (
        SELECT 1 FROM public.academic_domains 
        WHERE verified = true 
        AND (domain = domain_part OR domain_part LIKE '%' || domain)
    ) INTO is_academic;
    
    RETURN is_academic;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_blocked_email(email_address TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    domain_part TEXT;
    is_blocked BOOLEAN := FALSE;
BEGIN
    IF email_address IS NULL OR email_address = '' THEN
        RETURN TRUE;
    END IF;
    
    domain_part := lower(split_part(email_address, '@', 2));
    
    SELECT EXISTS (
        SELECT 1 FROM public.blocked_domains 
        WHERE domain = domain_part
    ) INTO is_blocked;
    
    RETURN is_blocked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.is_academic_email(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_blocked_email(TEXT) TO anon, authenticated; 