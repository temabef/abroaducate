-- Add GPA Conversions table
CREATE TABLE IF NOT EXISTS gpa_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  country VARCHAR(100) NOT NULL,
  grading_system VARCHAR(100) NOT NULL,
  original_gpa DECIMAL(4,2),
  converted_gpa DECIMAL(4,2) NOT NULL,
  total_credits INTEGER NOT NULL,
  courses JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gpa_conversions_user_id ON gpa_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_gpa_conversions_created_at ON gpa_conversions(created_at);
CREATE INDEX IF NOT EXISTS idx_gpa_conversions_country ON gpa_conversions(country);

-- Add GPA conversion usage tracking to user_usage table
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS gpa_conversions_used INTEGER DEFAULT 0;

-- Add GPA conversion limits to plan_limits table
ALTER TABLE plan_limits ADD COLUMN IF NOT EXISTS gpa_conversions_limit INTEGER;

-- Update plan limits for GPA conversions
UPDATE plan_limits SET gpa_conversions_limit = NULL WHERE plan_type = 'free';        -- Unlimited basic conversion
UPDATE plan_limits SET gpa_conversions_limit = 10 WHERE plan_type = 'professional';  -- 10 saves per month
UPDATE plan_limits SET gpa_conversions_limit = NULL WHERE plan_type = 'elite';       -- Unlimited everything

-- Add RLS policies for gpa_conversions
ALTER TABLE gpa_conversions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own conversions
CREATE POLICY "Users can view own gpa conversions" ON gpa_conversions
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own conversions
CREATE POLICY "Users can insert own gpa conversions" ON gpa_conversions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own conversions
CREATE POLICY "Users can update own gpa conversions" ON gpa_conversions
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own conversions
CREATE POLICY "Users can delete own gpa conversions" ON gpa_conversions
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_gpa_conversions_updated_at 
  BEFORE UPDATE ON gpa_conversions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add some sample data for testing (optional)
-- INSERT INTO gpa_conversions (user_id, country, grading_system, original_gpa, converted_gpa, total_credits, courses)
-- VALUES 
-- (
--   auth.uid(), 
--   'nigeria', 
--   '5_point_system', 
--   4.2, 
--   3.8, 
--   24,
--   '[{"code":"MTH101","title":"Mathematics I","credits":3,"grade":"A","convertedGPA":4.0}]'::jsonb
-- ); 