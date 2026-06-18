-- Add user_name field to early_user_feedback table
ALTER TABLE early_user_feedback ADD COLUMN IF NOT EXISTS user_name TEXT;
