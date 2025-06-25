-- Create email activity log table for tracking daily email statistics
CREATE TABLE IF NOT EXISTS email_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    total_emails_sent INTEGER DEFAULT 0,
    scholarship_digest_emails INTEGER DEFAULT 0,
    application_reminder_emails INTEGER DEFAULT 0,
    subscription_alert_emails INTEGER DEFAULT 0,
    instant_alert_emails INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for date queries
CREATE INDEX IF NOT EXISTS idx_email_activity_log_date ON email_activity_log(date);

-- Add columns to email_logs table if they don't exist
DO $$ 
BEGIN
    -- Add subject column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_logs' AND column_name = 'subject') THEN
        ALTER TABLE email_logs ADD COLUMN subject TEXT;
    END IF;

    -- Add content_summary column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_logs' AND column_name = 'content_summary') THEN
        ALTER TABLE email_logs ADD COLUMN content_summary TEXT;
    END IF;

    -- Modify recipient column to be TEXT instead of TEXT[] if needed
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_logs' AND column_name = 'recipients' AND data_type = 'ARRAY') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_logs' AND column_name = 'recipient') THEN
            ALTER TABLE email_logs ADD COLUMN recipient TEXT;
        END IF;
        -- Copy data if needed in a safe way
        UPDATE email_logs SET recipient = recipients[1] WHERE recipient IS NULL AND array_length(recipients, 1) > 0;
    END IF;
END $$;

-- Update email_logs table structure to match our usage (handle existing constraint)
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'email_logs_type_check' AND table_name = 'email_logs') THEN
        ALTER TABLE email_logs DROP CONSTRAINT email_logs_type_check;
    END IF;
    
    -- Add new constraint with all email types
    ALTER TABLE email_logs 
        ADD CONSTRAINT email_logs_type_check 
        CHECK (email_type IN ('deadline', 'milestone', 'document', 'subscription', 'scholarship_digest', 'application_reminder', 'subscription_alert'));
EXCEPTION
    WHEN duplicate_object THEN
        -- Constraint already exists, skip
        NULL;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE email_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Service role can manage email activity log" ON email_activity_log;
DROP POLICY IF EXISTS "Users can view own email logs" ON email_logs;
DROP POLICY IF EXISTS "Service role can manage email logs" ON email_logs;

-- Create policies
CREATE POLICY "Service role can manage email activity log" ON email_activity_log
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own email logs" ON email_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage email logs" ON email_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT ALL ON email_activity_log TO service_role;
GRANT ALL ON email_logs TO service_role;
GRANT SELECT ON email_activity_log TO authenticated;
GRANT SELECT ON email_logs TO authenticated; 