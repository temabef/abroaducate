-- Fix application_method constraint and add missing graduate funding fields (SAFE VERSION)

-- Drop existing constraints if they exist
ALTER TABLE scholarships DROP CONSTRAINT IF EXISTS valid_application_method;
ALTER TABLE scholarships DROP CONSTRAINT IF EXISTS valid_funding_category;
ALTER TABLE scholarships DROP CONSTRAINT IF EXISTS valid_funding_type;

-- Add all graduate funding columns if they don't exist
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS funding_category TEXT DEFAULT 'Traditional Scholarship';
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS university_name TEXT;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS program_name TEXT;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS funding_type TEXT;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS application_method TEXT;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS professor_name TEXT;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS professor_email TEXT;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS position_details TEXT;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS has_automatic_funding BOOLEAN DEFAULT false;

-- Add constraints (fresh versions)
ALTER TABLE scholarships ADD CONSTRAINT valid_funding_category 
  CHECK (funding_category IN ('Traditional Scholarship', 'Graduate Program Funding', 'Advertised Position'));

ALTER TABLE scholarships ADD CONSTRAINT valid_application_method 
  CHECK (application_method IS NULL OR application_method IN ('Direct Apply', 'Contact Professor First'));

ALTER TABLE scholarships ADD CONSTRAINT valid_funding_type 
  CHECK (funding_type IS NULL OR funding_type IN ('RA', 'TA', 'GA', 'Full Funding', 'Tuition Waiver', 'Mixed', 'Postdoc'));

-- Create indexes for better performance (safe)
CREATE INDEX IF NOT EXISTS idx_scholarships_funding_category ON scholarships(funding_category);
CREATE INDEX IF NOT EXISTS idx_scholarships_university_name ON scholarships(university_name);
CREATE INDEX IF NOT EXISTS idx_scholarships_professor_name ON scholarships(professor_name);

-- Update RLS policies
DROP POLICY IF EXISTS "Anyone can view scholarships" ON scholarships;
CREATE POLICY "Anyone can view scholarships" ON scholarships FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage scholarships" ON scholarships;
CREATE POLICY "Admins can manage scholarships" ON scholarships FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.user_metadata->>'role' = 'admin'
  )
); 