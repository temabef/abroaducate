-- Add conversion-focused feedback columns
ALTER TABLE early_user_feedback 
ADD COLUMN IF NOT EXISTS pricing_friction TEXT,
ADD COLUMN IF NOT EXISTS confusing_part TEXT,
ADD COLUMN IF NOT EXISTS convincing_factor TEXT;

-- Update comments
COMMENT ON COLUMN early_user_feedback.pricing_friction IS 'Reason why the user has not purchased more credits (e.g. price too high, no value, done applying)';
COMMENT ON COLUMN early_user_feedback.confusing_part IS 'What the user found most confusing about the platform';
COMMENT ON COLUMN early_user_feedback.convincing_factor IS 'What would convince the user to buy a credit pack today';
