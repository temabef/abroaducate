-- Scholarships table
CREATE TABLE scholarships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  provider TEXT NOT NULL,
  amount TEXT NOT NULL,
  deadline DATE NOT NULL,
  location TEXT NOT NULL,
  field TEXT NOT NULL,
  level TEXT NOT NULL, -- Bachelor, Master, PhD, Graduate
  type TEXT NOT NULL, -- Merit-based, Research-based, etc.
  description TEXT NOT NULL,
  requirements TEXT[] NOT NULL, -- Array of requirement strings
  website TEXT,
  min_gpa DECIMAL(3,2) DEFAULT 0.0,
  min_ielts DECIMAL(3,1) DEFAULT 0.0,
  min_toefl INTEGER DEFAULT 0,
  age_limit INTEGER,
  nationality_restrictions TEXT[], -- Array of allowed countries
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User profiles table for matching
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  field_of_study TEXT,
  current_level TEXT, -- Bachelor, Master, PhD
  target_level TEXT, -- Master, PhD
  gpa DECIMAL(3,2),
  ielts_score DECIMAL(3,1),
  toefl_score INTEGER,
  age INTEGER,
  nationality TEXT,
  preferred_countries TEXT[], -- Array of preferred study countries
  work_experience_years INTEGER DEFAULT 0,
  has_leadership_experience BOOLEAN DEFAULT false,
  has_research_experience BOOLEAN DEFAULT false,
  has_volunteer_experience BOOLEAN DEFAULT false,
  career_goals TEXT,
  research_interests TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- User scholarship interactions
CREATE TABLE user_scholarship_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scholarship_id UUID REFERENCES scholarships(id) ON DELETE CASCADE,
  is_saved BOOLEAN DEFAULT false,
  is_applied BOOLEAN DEFAULT false,
  match_score INTEGER, -- Calculated match percentage
  applied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, scholarship_id)
);

-- Insert sample scholarship data
INSERT INTO scholarships (title, provider, amount, deadline, location, field, level, type, description, requirements, website, min_gpa, min_ielts) VALUES
('Fulbright Foreign Student Program', 'U.S. Department of State', '$50,000/year', '2024-05-15', 'United States', 'All Fields', 'Graduate', 'Merit-based', 'Provides funding for graduate study, research, and teaching in the United States.', '{"Bachelor''s degree", "TOEFL/IELTS", "Leadership experience"}', 'https://us.fulbrightonline.org', 3.0, 7.0),

('Chevening Scholarships', 'UK Government', 'Full funding', '2024-04-30', 'United Kingdom', 'All Fields', 'Master''s', 'Merit-based', 'UK government''s global scholarship program for one-year master''s degrees.', '{"Work experience", "Leadership potential", "English proficiency"}', 'https://chevening.org', 3.2, 6.5),

('DAAD Graduate School Scholarship', 'German Academic Exchange Service', '€1,200/month', '2024-06-01', 'Germany', 'Engineering, Sciences', 'PhD', 'Research-based', 'Funding for PhD candidates in engineering and natural sciences.', '{"Master''s degree", "Research proposal", "German language (basic)"}', 'https://daad.de', 3.0, 6.0),

('Australia Awards Scholarships', 'Australian Government', 'Full funding + living allowance', '2024-04-15', 'Australia', 'Development Studies', 'Master''s, PhD', 'Development-focused', 'For students from developing countries to study in Australia.', '{"Leadership potential", "Development goals", "English proficiency"}', 'https://australiaawards.gov.au', 2.8, 6.5),

('Swedish Institute Scholarships', 'Swedish Institute', 'Full tuition + living allowance', '2024-03-20', 'Sweden', 'Sustainability, Innovation', 'Master''s', 'Field-specific', 'For master''s studies in sustainability and innovation fields.', '{"Academic excellence", "Sustainability focus", "Leadership experience"}', 'https://si.se', 3.5, 6.5),

('Erasmus Mundus Joint Masters', 'European Commission', '€1,400/month', '2024-05-31', 'Multiple EU Countries', 'Various', 'Master''s', 'Joint degree', 'Joint master''s programs delivered by consortiums of European universities.', '{"Bachelor''s degree", "Academic excellence", "Mobility readiness"}', 'https://eacea.ec.europa.eu', 3.3, 6.0);

-- RLS Policies
ALTER TABLE scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_scholarship_interactions ENABLE ROW LEVEL SECURITY;

-- Public read access for scholarships
CREATE POLICY "Anyone can view scholarships" ON scholarships FOR SELECT USING (is_active = true);

-- Users can only view/edit their own profiles
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Users can only view/edit their own interactions
CREATE POLICY "Users can view own interactions" ON user_scholarship_interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interactions" ON user_scholarship_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own interactions" ON user_scholarship_interactions FOR UPDATE USING (auth.uid() = user_id);

-- Admin policies (you'll need to set admin role)
CREATE POLICY "Admins can manage scholarships" ON scholarships FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_scholarships_updated_at BEFORE UPDATE ON scholarships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_scholarship_interactions_updated_at BEFORE UPDATE ON user_scholarship_interactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 