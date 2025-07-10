-- Add Phase 1 tracking columns to user_scholarship_interactions table

ALTER TABLE user_scholarship_interactions 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'interested';

ALTER TABLE user_scholarship_interactions 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';

ALTER TABLE user_scholarship_interactions 
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE user_scholarship_interactions 
ADD COLUMN IF NOT EXISTS document_checklist JSONB DEFAULT '[]';

ALTER TABLE user_scholarship_interactions 
ADD COLUMN IF NOT EXISTS deadline_reminder BOOLEAN DEFAULT true;

ALTER TABLE user_scholarship_interactions 
ADD COLUMN IF NOT EXISTS submission_method TEXT;

ALTER TABLE user_scholarship_interactions 
ADD COLUMN IF NOT EXISTS confirmation_number TEXT;

ALTER TABLE user_scholarship_interactions 
ADD COLUMN IF NOT EXISTS submitted_documents JSONB DEFAULT '[]';

ALTER TABLE user_scholarship_interactions 
ADD COLUMN IF NOT EXISTS personal_deadline DATE;

-- Test the columns exist
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_scholarship_interactions' 
ORDER BY ordinal_position; 