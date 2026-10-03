-- ============================================================================
-- Migration: AI Email Agent Logs & Settings
-- ============================================================================

-- 1. Table: ai_email_logs
-- Stores all processed incoming emails, generated replies, intent, and audit status.
CREATE TABLE IF NOT EXISTS public.ai_email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_email TEXT NOT NULL,
    sender_name TEXT,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    incoming_body TEXT NOT NULL,
    incoming_html TEXT,
    message_id TEXT,
    reply_body TEXT,
    reply_html TEXT,
    category TEXT NOT NULL DEFAULT 'general_inquiry',
    urgency TEXT NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
    status TEXT NOT NULL DEFAULT 'received', -- 'replied', 'skipped_loop', 'skipped_spam', 'escalated', 'failed'
    escalated BOOLEAN NOT NULL DEFAULT false,
    escalation_reason TEXT,
    confidence_score NUMERIC(4, 2),
    model_used TEXT,
    processing_ms INTEGER,
    student_profile_found BOOLEAN DEFAULT false,
    student_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_email_logs_sender ON public.ai_email_logs(sender_email);
CREATE INDEX IF NOT EXISTS idx_ai_email_logs_status ON public.ai_email_logs(status);
CREATE INDEX IF NOT EXISTS idx_ai_email_logs_category ON public.ai_email_logs(category);
CREATE INDEX IF NOT EXISTS idx_ai_email_logs_created_at ON public.ai_email_logs(created_at DESC);

-- 2. Table: ai_email_settings
-- System settings for the AI Email Agent
CREATE TABLE IF NOT EXISTS public.ai_email_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.ai_email_settings (key, value, description)
VALUES 
    ('agent_enabled', 'true'::jsonb, 'Global kill-switch for automated email replies'),
    ('autonomous_mode', 'true'::jsonb, 'When true, replies are automatically sent. When false, logged as drafts'),
    ('escalation_email', '"hello@abroaducate.com"'::jsonb, 'Email address to notify when an inquiry requires human intervention'),
    ('daily_reply_limit_per_user', '10'::jsonb, 'Max automatic replies sent to the same user per 24 hours to prevent abuse'),
    ('model_name', '"gpt-4o-mini"'::jsonb, 'Default LLM model for drafting email responses')
ON CONFLICT (key) DO NOTHING;

-- 3. Row Level Security (RLS)
ALTER TABLE public.ai_email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_email_settings ENABLE ROW LEVEL SECURITY;

-- Admins can view and manage all email logs
CREATE POLICY "Admins can view and manage ai_email_logs" 
ON public.ai_email_logs
FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'super-admin')
    )
);

-- Service role has full access (for backend webhook / workers)
CREATE POLICY "Service role full access on ai_email_logs"
ON public.ai_email_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Admins can view and update ai_email_settings
CREATE POLICY "Admins can manage ai_email_settings"
ON public.ai_email_settings
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'super-admin')
    )
);

CREATE POLICY "Service role full access on ai_email_settings"
ON public.ai_email_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
