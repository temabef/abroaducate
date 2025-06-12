-- 🔧 Fix Extension and Auth Configuration Issues

-- ========================================
-- FIX 1: Move pg_trgm extension from public schema
-- ========================================

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pg_trgm extension to extensions schema
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- Grant usage on extensions schema to roles that need it
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO anon;

-- ========================================
-- INSTRUCTIONS FOR AUTH SETTINGS (Manual Configuration Required)
-- ========================================

-- The following settings need to be configured in your Supabase Dashboard:
-- 
-- 1. REDUCE OTP EXPIRY TIME:
--    - Go to Authentication → Settings → Email Provider
--    - Set OTP expiry to 30 minutes (currently over 1 hour)
--    
-- 2. ENABLE LEAKED PASSWORD PROTECTION:
--    - Go to Authentication → Settings → Password Security
--    - Enable "Password leak protection" (HaveIBeenPwned integration)
--
-- These cannot be set via SQL and must be configured through the dashboard. 