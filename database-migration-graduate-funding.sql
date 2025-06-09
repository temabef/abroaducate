-- Graduate Program Funding Migration
-- Run this in Supabase SQL Editor to add graduate funding fields

ALTER TABLE scholarships 
ADD COLUMN IF NOT EXISTS funding_category TEXT DEFAULT 'Traditional Scholarship',
ADD COLUMN IF NOT EXISTS university_name TEXT,
ADD COLUMN IF NOT EXISTS program_name TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS funding_type TEXT,
ADD COLUMN IF NOT EXISTS application_method TEXT,
ADD COLUMN IF NOT EXISTS professor_name TEXT,
ADD COLUMN IF NOT EXISTS professor_email TEXT,
ADD COLUMN IF NOT EXISTS position_details TEXT,
ADD COLUMN IF NOT EXISTS has_automatic_funding BOOLEAN DEFAULT FALSE;

-- Add check constraints for valid values
ALTER TABLE scholarships 
ADD CONSTRAINT valid_funding_category 
CHECK (funding_category IN ('Traditional Scholarship', 'Graduate Program Funding', 'Advertised Position'));

ALTER TABLE scholarships 
ADD CONSTRAINT valid_funding_type 
CHECK (funding_type IS NULL OR funding_type IN ('RA', 'TA', 'GA', 'Full Funding', 'Tuition Waiver', 'Mixed'));

ALTER TABLE scholarships 
ADD CONSTRAINT valid_application_method 
CHECK (application_method IS NULL OR application_method IN ('Direct Apply', 'Contact Professor First', 'Advertised Position'));

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scholarships_funding_category ON scholarships(funding_category);
CREATE INDEX IF NOT EXISTS idx_scholarships_university_name ON scholarships(university_name);
CREATE INDEX IF NOT EXISTS idx_scholarships_funding_type ON scholarships(funding_type);
CREATE INDEX IF NOT EXISTS idx_scholarships_has_automatic_funding ON scholarships(has_automatic_funding);

-- Update existing scholarships to have the default funding category
UPDATE scholarships 
SET funding_category = 'Traditional Scholarship' 
WHERE funding_category IS NULL; 