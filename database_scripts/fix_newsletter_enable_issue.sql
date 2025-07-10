-- Fix Newsletter Enable Issue
-- This ensures the newsletter_settings table exists and has proper permissions

-- Create newsletter_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS newsletter_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE newsletter_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Admin can manage newsletter settings" ON newsletter_settings;
DROP POLICY IF EXISTS "Admin can view newsletter settings" ON newsletter_settings;
DROP POLICY IF EXISTS "Service role can manage newsletter settings" ON newsletter_settings;

-- Create admin access policies
CREATE POLICY "Admin can manage newsletter settings" ON newsletter_settings FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users au 
    WHERE au.user_id = auth.uid()
  )
);

-- Service role policy (for server-side operations)
CREATE POLICY "Service role can manage newsletter settings" ON newsletter_settings FOR ALL 
USING (auth.role() = 'service_role');

-- Insert default settings if they don't exist
INSERT INTO newsletter_settings (setting_key, setting_value, description) VALUES
  ('newsletter_enabled', 'false', 'Master switch for newsletter system'),
  ('scholarship_digest_enabled', 'false', 'Enable weekly scholarship digest'),
  ('send_frequency', '"weekly"', 'How often to send newsletter'),
  ('send_day', '1', 'Day of week to send (0=Sunday, 1=Monday, etc.)'),
  ('send_time', '"09:00"', 'Time to send newsletter (UTC)'),
  ('max_emails_per_batch', '100', 'Maximum emails to send per batch'),
  ('default_from_name', '"Abroaducate Team"', 'Default sender name')
ON CONFLICT (setting_key) DO NOTHING;

-- Create function to check if user can manage newsletter content
CREATE OR REPLACE FUNCTION can_manage_newsletter_content()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is admin
  RETURN EXISTS (
    SELECT 1 FROM admin_users au 
    WHERE au.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a simplified update function for newsletter settings
CREATE OR REPLACE FUNCTION update_newsletter_setting(
  p_setting_key TEXT,
  p_setting_value JSONB,
  p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  setting_exists BOOLEAN;
BEGIN
  -- Check if user has permission
  IF NOT can_manage_newsletter_content() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Check if setting exists
  SELECT EXISTS(
    SELECT 1 FROM newsletter_settings 
    WHERE setting_key = p_setting_key
  ) INTO setting_exists;

  -- Insert or update
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to enable/disable the newsletter system
CREATE OR REPLACE FUNCTION toggle_newsletter_system(p_action TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Check if user has permission
  IF NOT can_manage_newsletter_content() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  CASE p_action
    WHEN 'enable_system' THEN
      PERFORM update_newsletter_setting('newsletter_enabled', 'true');
      PERFORM update_newsletter_setting('scholarship_digest_enabled', 'true');
      
      -- Set launch date if not set
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON newsletter_settings TO authenticated;
GRANT EXECUTE ON FUNCTION can_manage_newsletter_content() TO authenticated;
GRANT EXECUTE ON FUNCTION update_newsletter_setting(TEXT, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_newsletter_system(TEXT) TO authenticated;

SELECT 'Newsletter system fix applied successfully!' as result; 