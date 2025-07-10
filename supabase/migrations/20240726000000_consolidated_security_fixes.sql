
BEGIN;

-- =================================================================
-- PART 1: FIX SECURITY DEFINER VIEWS
-- Recreate views without the SECURITY DEFINER property.
-- =================================================================

-- View 1: newsletter_subscriber_summary
DROP VIEW IF EXISTS public.newsletter_subscriber_summary CASCADE;
CREATE OR REPLACE VIEW public.newsletter_subscriber_summary AS
SELECT
  COUNT(*) AS total_subscribers,
  COUNT(*) FILTER (WHERE status = 'active') AS active_subscribers,
  COUNT(*) FILTER (WHERE status = 'unsubscribed') AS unsubscribed_count,
  COUNT(*) FILTER (WHERE scholarship_digest = true) AS digest_subscribers,
  COUNT(DISTINCT source) AS total_sources,
  MAX(subscribed_at) AS latest_subscription,
  MIN(subscribed_at) AS first_subscription
FROM public.newsletter_subscribers;
GRANT SELECT ON public.newsletter_subscriber_summary TO authenticated;

-- View 2: active_newsletter_subscribers_segmented
DROP VIEW IF EXISTS public.active_newsletter_subscribers_segmented CASCADE;
CREATE OR REPLACE VIEW public.active_newsletter_subscribers_segmented AS
SELECT
  email_segment,
  import_batch_id,
  COUNT(*) AS total_subscribers,
  COUNT(*) FILTER (WHERE scholarship_digest = true) AS digest_subscribers,
  COUNT(*) FILTER (WHERE last_email_sent > NOW() - INTERVAL '30 days') AS recent_recipients,
  COUNT(*) FILTER (WHERE converted_to_user = true) AS converted_users,
  AVG(engagement_score) AS avg_engagement_score,
  AVG(total_opens) AS avg_opens,
  AVG(total_clicks) AS avg_clicks,
  COUNT(*) FILTER (WHERE engagement_score > 5) AS highly_engaged,
  MIN(subscribed_at) AS first_subscriber_date,
  MAX(subscribed_at) AS latest_subscriber_date
FROM public.newsletter_subscribers
WHERE status = 'active'
GROUP BY email_segment, import_batch_id
ORDER BY email_segment, total_subscribers DESC;
GRANT SELECT ON public.active_newsletter_subscribers_segmented TO authenticated;

-- View 3: newsletter_import_performance
DROP VIEW IF EXISTS public.newsletter_import_performance CASCADE;
CREATE OR REPLACE VIEW public.newsletter_import_performance AS
SELECT
  import_batch_id,
  source,
  COUNT(*) AS total_imported,
  COUNT(*) FILTER (WHERE status = 'active') AS still_active,
  COUNT(*) FILTER (WHERE converted_to_user = true) AS converted,
  COUNT(*) FILTER (WHERE status = 'unsubscribed') AS unsubscribed,
  COUNT(*) FILTER (WHERE engagement_score > 5) AS engaged,
  ROUND((COUNT(*) FILTER (WHERE converted_to_user = true)::DECIMAL / COUNT(*) * 100), 2) AS conversion_rate_percent,
  ROUND((COUNT(*) FILTER (WHERE status = 'unsubscribed')::DECIMAL / COUNT(*) * 100), 2) AS unsubscribe_rate_percent,
  MIN(subscribed_at) AS import_date,
  AVG(engagement_score) AS avg_engagement
FROM public.newsletter_subscribers
WHERE import_batch_id IS NOT NULL
GROUP BY import_batch_id, source
ORDER BY conversion_rate_percent DESC, total_imported DESC;
GRANT SELECT ON public.newsletter_import_performance TO authenticated;


-- =================================================================
-- PART 2: ENABLE ROW LEVEL SECURITY (RLS)
-- Enable RLS on public tables that were missing it.
-- =================================================================

-- Table 1: newsletter_engagement_events
ALTER TABLE public.newsletter_engagement_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.newsletter_engagement_events FOR SELECT USING (true);

-- Table 2: newsletter_to_user_transitions
ALTER TABLE public.newsletter_to_user_transitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.newsletter_to_user_transitions FOR SELECT USING (true);

-- Table 3: newsletter_content_categories
ALTER TABLE public.newsletter_content_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.newsletter_content_categories FOR SELECT USING (true);

-- Table 4: email_templates
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.email_templates FOR SELECT USING (true);

-- Table 5: campaign_recipients
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.campaign_recipients FOR SELECT USING (true);


-- =================================================================
-- PART 3: FIX FUNCTION SEARCH PATH
-- Recreate functions to include 'SET search_path'.
-- =================================================================

-- Function 1: update_newsletter_setting
CREATE OR REPLACE FUNCTION public.update_newsletter_setting(
  p_setting_key TEXT,
  p_setting_value JSONB,
  p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  setting_exists BOOLEAN;
BEGIN
  IF NOT can_manage_newsletter_content() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM newsletter_settings 
    WHERE setting_key = p_setting_key
  ) INTO setting_exists;

  IF setting_exists THEN
    UPDATE newsletter_settings 
    SET 
      setting_value = p_setting_value,
      description = COALESCE(p_description, description),
      updated_at = NOW()
    WHERE setting_key = p_setting_key;
  ELSE
    INSERT INTO newsletter_settings (setting_key, setting_value, description, updated_at)
    VALUES (p_setting_key, p_setting_value, p_description, NOW());
  END IF;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to update setting %: %', p_setting_key, SQLERRM;
END;
$$;

-- Function 2: toggle_newsletter_system
CREATE OR REPLACE FUNCTION public.toggle_newsletter_system(p_action TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  IF NOT can_manage_newsletter_content() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  CASE p_action
    WHEN 'enable_system' THEN
      PERFORM update_newsletter_setting('newsletter_enabled', 'true');
      PERFORM update_newsletter_setting('scholarship_digest_enabled', 'true');
      
      IF NOT EXISTS (SELECT 1 FROM newsletter_settings WHERE setting_key = 'launch_date') THEN
        PERFORM update_newsletter_setting('launch_date', to_jsonb(NOW()::TEXT), 'When newsletter was first launched');
      END IF;
      
      result = jsonb_build_object(
        'success', true,
        'message', 'Newsletter system enabled successfully',
        'status', 'enabled'
      );

    WHEN 'disable_system' THEN
      PERFORM update_newsletter_setting('newsletter_enabled', 'false');
      PERFORM update_newsletter_setting('scholarship_digest_enabled', 'false');
      
      result = jsonb_build_object(
        'success', true,
        'message', 'Newsletter system disabled successfully',
        'status', 'disabled'
      );

    ELSE
      RAISE EXCEPTION 'Invalid action. Use: enable_system or disable_system';
  END CASE;

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Function 3: get_dashboard_analytics
CREATE OR REPLACE FUNCTION public.get_dashboard_analytics()
RETURNS TABLE (
    total_users BIGINT,
    active_users_30d BIGINT,
    new_users_30d BIGINT,
    free_users BIGINT,
    professional_users BIGINT,
    elite_users BIGINT,
    total_premium_users BIGINT,
    total_sops BIGINT,
    total_cover_letters BIGINT,
    total_personal_statements BIGINT,
    total_documents BIGINT,
    total_ai_usage BIGINT,
    reviews_count BIGINT,
    grammar_checks_count BIGINT,
    tone_analysis_count BIGINT,
    plagiarism_checks_count BIGINT,
    text_enhancements_count BIGINT,
    word_optimizations_count BIGINT,
    total_scholarships BIGINT,
    total_applications BIGINT,
    admin_users_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    thirty_days_ago TIMESTAMPTZ := NOW() - INTERVAL '30 days';
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM auth.users) as total_users,
        (SELECT COUNT(DISTINCT user_id) FROM (
            SELECT user_id FROM sops WHERE created_at >= thirty_days_ago
            UNION SELECT user_id FROM cover_letters WHERE created_at >= thirty_days_ago
            UNION SELECT user_id FROM personal_statements WHERE created_at >= thirty_days_ago
        ) as t) as active_users_30d,
        (SELECT COUNT(*) FROM auth.users WHERE created_at >= thirty_days_ago) as new_users_30d,
        (SELECT COUNT(*) FROM auth.users) - (SELECT COUNT(*) FROM user_subscriptions WHERE status = 'active') as free_users,
        (SELECT COUNT(*) FROM user_subscriptions WHERE plan_type = 'professional' AND status = 'active') as professional_users,
        (SELECT COUNT(*) FROM user_subscriptions WHERE plan_type = 'elite' AND status = 'active') as elite_users,
        (SELECT COUNT(*) FROM user_subscriptions WHERE status = 'active') as total_premium_users,
        (SELECT COUNT(*) FROM sops) as total_sops,
        (SELECT COUNT(*) FROM cover_letters) as total_cover_letters,
        (SELECT COUNT(*) FROM personal_statements) as total_personal_statements,
        (SELECT COUNT(*) FROM sops) + (SELECT COUNT(*) FROM cover_letters) + (SELECT COUNT(*) FROM personal_statements) as total_documents,
        (SELECT COUNT(*) FROM ai_usage_log) as total_ai_usage,
        0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, -- Simplified analytics
        (SELECT COUNT(*) FROM scholarships) as total_scholarships,
        (SELECT COUNT(*) FROM scholarship_applications) as total_applications,
        (SELECT COUNT(*) FROM admin_users) as admin_users_count;
END;
$$;

-- Function 4: upsert_newsletter_subscriber
CREATE OR REPLACE FUNCTION public.upsert_newsletter_subscriber(
    p_email TEXT,
    p_source TEXT,
    p_scholarship_digest BOOLEAN DEFAULT true,
    p_weekly_updates BOOLEAN DEFAULT true,
    p_status TEXT DEFAULT 'active'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
    is_new BOOLEAN := false;
BEGIN
    p_email := LOWER(TRIM(p_email));
    
    IF p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid email format');
    END IF;
    
    INSERT INTO newsletter_subscribers (email, source, scholarship_digest, weekly_updates, status, subscribed_at, updated_at)
    VALUES (p_email, p_source, p_scholarship_digest, p_weekly_updates, p_status, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET
        source = CASE WHEN newsletter_subscribers.source = 'manual' THEN newsletter_subscribers.source ELSE EXCLUDED.source END,
        updated_at = NOW(),
        status = CASE WHEN newsletter_subscribers.status = 'unsubscribed' THEN newsletter_subscribers.status ELSE EXCLUDED.status END
    RETURNING (xmax = 0) INTO is_new;
    
    RETURN jsonb_build_object('success', true, 'is_new', is_new, 'email', p_email);
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'email', p_email);
END;
$$;


COMMIT; 