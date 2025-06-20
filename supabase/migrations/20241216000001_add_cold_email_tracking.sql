-- Add cold email usage tracking column
-- Created: December 16, 2024

-- Add cold_emails_used column to user_usage table for tracking monthly cold email usage
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS cold_emails_used INTEGER DEFAULT 0;

-- Update any existing records to have 0 cold emails used
UPDATE user_usage SET cold_emails_used = 0 WHERE cold_emails_used IS NULL; 