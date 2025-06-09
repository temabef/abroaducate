-- Scholarship Tracking Phase 1 Enhancement
-- Add enhanced tracking fields to user_scholarship_interactions

-- Add status tracking field
ALTER TABLE user_scholarship_interactions 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'interested' 
CHECK (status IN ('interested', 'researching', 'preparing', 'applying', 'submitted', 'accepted', 'rejected', 'waitlisted'));

-- Add document tracking fields
ALTER TABLE user_scholarship_interactions 
ADD COLUMN IF NOT EXISTS document_checklist JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS deadline_reminder BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Add submission tracking
ALTER TABLE user_scholarship_interactions 
ADD COLUMN IF NOT EXISTS submission_method TEXT,
ADD COLUMN IF NOT EXISTS confirmation_number TEXT,
ADD COLUMN IF NOT EXISTS submitted_documents JSONB DEFAULT '[]';

-- Add deadline tracking helpers
ALTER TABLE user_scholarship_interactions 
ADD COLUMN IF NOT EXISTS days_until_deadline INTEGER,
ADD COLUMN IF NOT EXISTS personal_deadline DATE; -- User can set earlier personal deadline

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_scholarship_status ON user_scholarship_interactions(status);
CREATE INDEX IF NOT EXISTS idx_user_scholarship_deadline ON user_scholarship_interactions(personal_deadline);
CREATE INDEX IF NOT EXISTS idx_user_scholarship_priority ON user_scholarship_interactions(priority);

-- Create function to calculate days until deadline
CREATE OR REPLACE FUNCTION calculate_days_until_deadline()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate days until scholarship deadline
  IF EXISTS (
    SELECT 1 FROM scholarships 
    WHERE id = NEW.scholarship_id
  ) THEN
    NEW.days_until_deadline := (
      SELECT EXTRACT(DAY FROM (deadline - CURRENT_DATE))::INTEGER
      FROM scholarships 
      WHERE id = NEW.scholarship_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate days until deadline
DROP TRIGGER IF EXISTS calculate_deadline_trigger ON user_scholarship_interactions;
CREATE TRIGGER calculate_deadline_trigger
  BEFORE INSERT OR UPDATE ON user_scholarship_interactions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_days_until_deadline();

-- Update RLS policies to include new columns
DROP POLICY IF EXISTS "Users can insert own interactions" ON user_scholarship_interactions;
CREATE POLICY "Users can insert own interactions" ON user_scholarship_interactions 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own interactions" ON user_scholarship_interactions;
CREATE POLICY "Users can update own interactions" ON user_scholarship_interactions 
FOR UPDATE USING (auth.uid() = user_id);

-- Create a view for scholarship deadlines dashboard
CREATE OR REPLACE VIEW user_scholarship_deadlines AS
SELECT 
  s.id as scholarship_id,
  s.title,
  s.provider,
  s.amount,
  s.deadline,
  s.location,
  s.field,
  s.level,
  usi.user_id,
  usi.status,
  usi.priority,
  usi.personal_deadline,
  usi.days_until_deadline,
  usi.is_saved,
  usi.is_applied,
  usi.notes,
  -- Calculate urgency score for sorting
  CASE 
    WHEN usi.days_until_deadline <= 3 THEN 'critical'
    WHEN usi.days_until_deadline <= 7 THEN 'urgent'
    WHEN usi.days_until_deadline <= 14 THEN 'important'
    WHEN usi.days_until_deadline <= 30 THEN 'moderate'
    ELSE 'low'
  END as urgency,
  -- Determine if deadline has passed
  CASE 
    WHEN s.deadline < CURRENT_DATE THEN true
    ELSE false
  END as is_overdue
FROM scholarships s
JOIN user_scholarship_interactions usi ON s.id = usi.scholarship_id
WHERE s.is_active = true
AND (usi.is_saved = true OR usi.is_applied = true);

-- Enable RLS on the view
ALTER VIEW user_scholarship_deadlines SET (security_invoker = true);

-- Insert sample document checklist templates
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scholarship_type TEXT NOT NULL,
  level TEXT NOT NULL,
  required_documents JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert common document requirements
INSERT INTO document_templates (scholarship_type, level, required_documents) VALUES
('Merit-based', 'Graduate', '[
  {"name": "Academic Transcripts", "required": true, "description": "Official transcripts from all universities attended"},
  {"name": "Statement of Purpose", "required": true, "description": "2-3 page statement of academic goals"},
  {"name": "Letters of Recommendation", "required": true, "description": "2-3 letters from academic or professional references"},
  {"name": "English Proficiency Test", "required": true, "description": "IELTS/TOEFL scores if applicable"},
  {"name": "CV/Resume", "required": true, "description": "Academic or professional CV"},
  {"name": "Research Proposal", "required": false, "description": "Research proposal for PhD applications"},
  {"name": "Portfolio", "required": false, "description": "Portfolio of work if applicable"}
]'),
('Research-based', 'PhD', '[
  {"name": "Academic Transcripts", "required": true, "description": "Official transcripts from all universities attended"},
  {"name": "Research Proposal", "required": true, "description": "Detailed research proposal (3-5 pages)"},
  {"name": "Letters of Recommendation", "required": true, "description": "3 letters from academic references"},
  {"name": "English Proficiency Test", "required": true, "description": "IELTS/TOEFL scores if applicable"},
  {"name": "Academic CV", "required": true, "description": "Academic CV with publications and research experience"},
  {"name": "Writing Sample", "required": true, "description": "Sample of academic writing"},
  {"name": "Personal Statement", "required": false, "description": "Personal background and motivation"}
]');

-- Add comment for documentation
COMMENT ON TABLE user_scholarship_interactions IS 'Enhanced scholarship tracking with status, documents, and deadline management';
COMMENT ON COLUMN user_scholarship_interactions.status IS 'Application status: interested -> researching -> preparing -> applying -> submitted -> decision';
COMMENT ON COLUMN user_scholarship_interactions.document_checklist IS 'JSON array of required documents with completion status';
COMMENT ON COLUMN user_scholarship_interactions.priority IS 'User-defined priority level for this scholarship';
COMMENT ON VIEW user_scholarship_deadlines IS 'Convenient view for dashboard showing scholarship deadlines and urgency'; 