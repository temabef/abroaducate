-- Add basic tracking columns to user_scholarship_interactions table

-- Add status column if it doesn't exist
ALTER TABLE user_scholarship_interactions 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'interested';

-- Add priority column if it doesn't exist  
ALTER TABLE user_scholarship_interactions 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';

-- Add notes column if it doesn't exist
ALTER TABLE user_scholarship_interactions 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add document checklist column if it doesn't exist
ALTER TABLE user_scholarship_interactions 
ADD COLUMN IF NOT EXISTS document_checklist JSONB DEFAULT '[]';

-- Add deadline reminder column if it doesn't exist
ALTER TABLE user_scholarship_interactions 
ADD COLUMN IF NOT EXISTS deadline_reminder BOOLEAN DEFAULT true;

-- Add submission tracking columns if they don't exist
ALTER TABLE user_scholarship_interactions 
ADD COLUMN IF NOT EXISTS submission_method TEXT;

ALTER TABLE user_scholarship_interactions 
ADD COLUMN IF NOT EXISTS confirmation_number TEXT;

ALTER TABLE user_scholarship_interactions 
ADD COLUMN IF NOT EXISTS submitted_documents JSONB DEFAULT '[]';

-- Add personal deadline column if it doesn't exist
ALTER TABLE user_scholarship_interactions 
ADD COLUMN IF NOT EXISTS personal_deadline DATE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_scholarship_status ON user_scholarship_interactions(status);
CREATE INDEX IF NOT EXISTS idx_user_scholarship_priority ON user_scholarship_interactions(priority);

-- Add comments
COMMENT ON COLUMN user_scholarship_interactions.status IS 'Application status: interested, researching, preparing, applying, submitted, accepted, rejected, waitlisted';
COMMENT ON COLUMN user_scholarship_interactions.priority IS 'User-defined priority: low, medium, high, urgent';
COMMENT ON COLUMN user_scholarship_interactions.document_checklist IS 'JSON array of required documents with completion status';
COMMENT ON COLUMN user_scholarship_interactions.notes IS 'User notes about this scholarship application'; 