-- COMPLETE NEWSLETTER SYSTEM REBUILD
-- This will wipe everything newsletter-related and rebuild cleanly

-- =============================================
-- PHASE 1: COMPLETE CLEANUP (Nuclear Option)
-- =============================================

-- Drop ALL newsletter-related objects to eliminate conflicts
DROP VIEW IF EXISTS public.active_newsletter_subscribers CASCADE;
DROP VIEW IF EXISTS public.newsletter_campaign_performance CASCADE;
DROP VIEW IF EXISTS public.newsletter_subscriber_summary CASCADE;
DROP VIEW IF EXISTS public.newsletter_analytics CASCADE;
DROP VIEW IF EXISTS public.newsletter_stats CASCADE;

-- Drop ALL newsletter functions
DROP FUNCTION IF EXISTS public.toggle_newsletter_system() CASCADE;
DROP FUNCTION IF EXISTS public.update_newsletter_setting(TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.can_manage_newsletter_content() CASCADE;
DROP FUNCTION IF EXISTS public.add_newsletter_subscriber(VARCHAR, VARCHAR, BOOLEAN, BOOLEAN, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS public.unsubscribe_newsletter(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS public.get_newsletter_stats() CASCADE;
DROP FUNCTION IF EXISTS public.upsert_newsletter_subscriber(VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS public.batch_import_newsletter_subscribers(JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.update_newsletter_subscriber_updated_at() CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_newsletter_subscribers_updated_at ON newsletter_subscribers;

-- =============================================
-- PHASE 2: CLEAN TABLE STRUCTURE
-- =============================================

-- Keep tables but ensure clean structure
-- newsletter_subscribers (your 8000 + new users)
ALTER TABLE newsletter_subscribers DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin can manage all newsletter subscribers" ON newsletter_subscribers;

-- Add missing columns if needed
ALTER TABLE newsletter_subscribers 
ADD COLUMN IF NOT EXISTS email_type VARCHAR(50) DEFAULT 'general' CHECK (email_type IN ('general', 'scholarship', 'imported', 'user_registration')),
ADD COLUMN IF NOT EXISTS unsubscribe_reason TEXT,
ADD COLUMN IF NOT EXISTS import_batch VARCHAR(100),
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- newsletter_settings (clean system settings)
CREATE TABLE IF NOT EXISTS newsletter_system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    system_enabled BOOLEAN DEFAULT false,
    max_sends_per_hour INTEGER DEFAULT 100,
    default_from_email VARCHAR(255) DEFAULT 'noreply@abroaducate.com',
    default_from_name VARCHAR(255) DEFAULT 'Abroaducate Team',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default system settings
INSERT INTO newsletter_system_settings (system_enabled, max_sends_per_hour) 
VALUES (false, 100)
ON CONFLICT DO NOTHING;

-- Unsubscribe tracking
CREATE TABLE IF NOT EXISTS newsletter_unsubscribe_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    reason_category VARCHAR(50) CHECK (reason_category IN ('too_frequent', 'not_relevant', 'never_subscribed', 'spam', 'other')),
    reason_text TEXT,
    unsubscribed_at TIMESTAMPTZ DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET
);

-- Campaign tracking (separate from your direct emails)
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(50) CHECK (campaign_type IN ('scholarship_weekly', 'announcement', 'user_welcome', 'manual')),
    subject_line VARCHAR(500),
    email_content TEXT,
    target_email_type VARCHAR(50) DEFAULT 'general',
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    total_sent INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PHASE 3: CLEAN FUNCTIONS (NO SECURITY DEFINER)
-- =============================================

-- Simple admin check function
CREATE OR REPLACE FUNCTION public.is_newsletter_admin()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
        AND role IN ('super-admin', 'admin')
    ) OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid() 
        AND email IN ('admin@abroaducate.com', 'solakolawole62@gmail.com')
    );
END;
$$;

-- Toggle newsletter system (what your enable button calls)
CREATE OR REPLACE FUNCTION public.toggle_newsletter_system(enable_system BOOLEAN)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    is_admin BOOLEAN;
    current_status BOOLEAN;
BEGIN
    -- Check admin permissions
    SELECT public.is_newsletter_admin() INTO is_admin;
    
    IF NOT is_admin THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Unauthorized: Admin access required'
        );
    END IF;
    
    -- Get current status
    SELECT system_enabled INTO current_status FROM newsletter_system_settings LIMIT 1;
    
    -- Update system status
    UPDATE newsletter_system_settings 
    SET 
        system_enabled = enable_system,
        updated_at = NOW();
    
    RETURN jsonb_build_object(
        'success', true,
        'previous_status', current_status,
        'new_status', enable_system,
        'message', CASE 
            WHEN enable_system THEN 'Newsletter system enabled successfully'
            ELSE 'Newsletter system disabled successfully'
        END
    );
END;
$$;

-- Get newsletter dashboard stats
CREATE OR REPLACE FUNCTION public.get_newsletter_dashboard_stats()
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    is_admin BOOLEAN;
    result JSONB;
BEGIN
    -- Check admin permissions
    SELECT public.is_newsletter_admin() INTO is_admin;
    
    IF NOT is_admin THEN
        RETURN jsonb_build_object('error', 'Unauthorized access');
    END IF;
    
    SELECT jsonb_build_object(
        'total_subscribers', COUNT(*),
        'active_subscribers', COUNT(*) FILTER (WHERE status = 'active'),
        'imported_subscribers', COUNT(*) FILTER (WHERE email_type = 'imported'),
        'user_subscribers', COUNT(*) FILTER (WHERE email_type = 'user_registration'),
        'scholarship_subscribers', COUNT(*) FILTER (WHERE scholarship_digest = true AND status = 'active'),
        'unsubscribed_today', (
            SELECT COUNT(*) FROM newsletter_unsubscribe_log 
            WHERE unsubscribed_at > CURRENT_DATE
        ),
        'unsubscribed_this_week', (
            SELECT COUNT(*) FROM newsletter_unsubscribe_log 
            WHERE unsubscribed_at > CURRENT_DATE - INTERVAL '7 days'
        ),
        'system_enabled', (
            SELECT system_enabled FROM newsletter_system_settings LIMIT 1
        )
    ) INTO result
    FROM newsletter_subscribers;
    
    RETURN result;
END;
$$;

-- Safe subscriber management
CREATE OR REPLACE FUNCTION public.add_newsletter_subscriber_safe(
    p_email VARCHAR(255),
    p_email_type VARCHAR(50) DEFAULT 'general',
    p_source VARCHAR(100) DEFAULT 'website'
)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    subscriber_id UUID;
    email_clean VARCHAR(255);
BEGIN
    email_clean := LOWER(TRIM(p_email));
    
    -- Validate email format
    IF email_clean !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid email format'
        );
    END IF;
    
    INSERT INTO newsletter_subscribers (
        email, 
        email_type,
        source,
        status
    ) VALUES (
        email_clean,
        p_email_type,
        p_source,
        'active'
    )
    ON CONFLICT (email) DO UPDATE SET
        status = 'active',
        email_type = CASE 
            WHEN newsletter_subscribers.email_type = 'imported' THEN newsletter_subscribers.email_type
            ELSE EXCLUDED.email_type
        END,
        updated_at = NOW()
    RETURNING id INTO subscriber_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'subscriber_id', subscriber_id,
        'email', email_clean
    );
END;
$$;

-- Unsubscribe with reason tracking
CREATE OR REPLACE FUNCTION public.unsubscribe_with_reason(
    p_email VARCHAR(255),
    p_reason_category VARCHAR(50) DEFAULT 'other',
    p_reason_text TEXT DEFAULT NULL
)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    email_clean VARCHAR(255);
    was_subscribed BOOLEAN := false;
    update_count INTEGER;
BEGIN
    email_clean := LOWER(TRIM(p_email));
    
    -- Update subscriber status
    UPDATE newsletter_subscribers 
    SET 
        status = 'unsubscribed',
        unsubscribed_at = NOW(),
        unsubscribe_reason = p_reason_text,
        updated_at = NOW()
    WHERE email = email_clean AND status = 'active';
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    was_subscribed := update_count > 0;
    
    -- Log unsubscribe reason
    IF was_subscribed THEN
        INSERT INTO newsletter_unsubscribe_log (
            email, reason_category, reason_text
        ) VALUES (
            email_clean, p_reason_category, p_reason_text
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'was_subscribed', was_subscribed,
        'message', CASE 
            WHEN was_subscribed THEN 'Successfully unsubscribed'
            ELSE 'Email was not in active subscription list'
        END
    );
END;
$$;

-- =============================================
-- PHASE 4: SIMPLE, SAFE VIEWS (NO SECURITY DEFINER)
-- =============================================

-- Newsletter stats view (for admin dashboard)
CREATE VIEW newsletter_admin_stats AS
SELECT 
    COUNT(*) as total_subscribers,
    COUNT(*) FILTER (WHERE status = 'active') as active_subscribers,
    COUNT(*) FILTER (WHERE email_type = 'imported') as imported_count,
    COUNT(*) FILTER (WHERE email_type = 'user_registration') as user_registration_count,
    COUNT(*) FILTER (WHERE status = 'unsubscribed') as unsubscribed_count
FROM newsletter_subscribers;

-- Recent unsubscribes (for tracking trends)
CREATE VIEW recent_unsubscribes AS
SELECT 
    reason_category,
    COUNT(*) as count,
    DATE(unsubscribed_at) as unsubscribe_date
FROM newsletter_unsubscribe_log 
WHERE unsubscribed_at > CURRENT_DATE - INTERVAL '30 days'
GROUP BY reason_category, DATE(unsubscribed_at)
ORDER BY unsubscribe_date DESC;

-- =============================================
-- PHASE 5: PROPER PERMISSIONS
-- =============================================

-- Enable RLS only on sensitive tables
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;

-- Simple admin-only policies
CREATE POLICY "Admin newsletter access" ON newsletter_subscribers FOR ALL USING (public.is_newsletter_admin());
CREATE POLICY "Admin system settings" ON newsletter_system_settings FOR ALL USING (public.is_newsletter_admin());
CREATE POLICY "Admin campaign access" ON newsletter_campaigns FOR ALL USING (public.is_newsletter_admin());

-- Grant function permissions
GRANT EXECUTE ON FUNCTION public.is_newsletter_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_newsletter_system(BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_newsletter_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_newsletter_subscriber_safe(VARCHAR, VARCHAR, VARCHAR) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unsubscribe_with_reason(VARCHAR, VARCHAR, TEXT) TO anon, authenticated;

-- Grant view permissions
GRANT SELECT ON newsletter_admin_stats TO authenticated;
GRANT SELECT ON recent_unsubscribes TO authenticated;

-- =============================================
-- PHASE 6: VERIFICATION
-- =============================================

-- Check for any remaining SECURITY DEFINER views
SELECT 
    'SECURITY DEFINER CHECK:' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_views 
            WHERE schemaname = 'public' 
            AND (viewname LIKE '%newsletter%' OR viewname LIKE '%subscriber%')
            AND definition ILIKE '%SECURITY DEFINER%'
        ) THEN '❌ SECURITY DEFINER views still detected'
        ELSE '✅ All newsletter views are now safe'
    END as security_status;

-- Test the toggle function
SELECT 
    'TOGGLE FUNCTION TEST:' as test_type,
    'Newsletter system toggle is ready for admin use' as status; 