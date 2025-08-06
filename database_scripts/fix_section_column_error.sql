-- ========================================
-- FIX SECTION COLUMN ERROR
-- ========================================
-- This script fixes the "column section does not exist" error

-- First, let's check if the user_practice_attempts table exists and has the correct structure
DO $$
BEGIN
    -- Check if user_practice_attempts table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_practice_attempts') THEN
        -- Check if section column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_practice_attempts' AND column_name = 'section') THEN
            -- Add the missing section column
            ALTER TABLE user_practice_attempts ADD COLUMN section TEXT;
            
            -- Add the check constraint
            ALTER TABLE user_practice_attempts ADD CONSTRAINT user_practice_attempts_section_check 
                CHECK (section IN ('reading', 'listening', 'writing', 'speaking'));
                
            RAISE NOTICE 'Added missing section column to user_practice_attempts table';
        ELSE
            RAISE NOTICE 'Section column already exists in user_practice_attempts table';
        END IF;
    ELSE
        -- Create the table if it doesn't exist
        CREATE TABLE user_practice_attempts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          section TEXT NOT NULL CHECK (section IN ('reading', 'listening', 'writing', 'speaking')),
          answers JSONB DEFAULT '{}',
          score INTEGER,
          total_questions INTEGER,
          correct_answers INTEGER,
          time_taken INTEGER, -- in seconds
          started_at TIMESTAMPTZ DEFAULT NOW(),
          completed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        RAISE NOTICE 'Created user_practice_attempts table with section column';
    END IF;
END $$;

-- Check if user_practice_responses table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_practice_responses') THEN
        CREATE TABLE user_practice_responses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          question_id UUID REFERENCES practice_questions(id) ON DELETE CASCADE,
          selected_choice_id UUID REFERENCES practice_choices(id) ON DELETE SET NULL,
          text_response TEXT,
          is_correct BOOLEAN,
          time_taken INTEGER, -- in seconds
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        RAISE NOTICE 'Created user_practice_responses table';
    END IF;
END $$;

-- Check if user_test_sessions table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_test_sessions') THEN
        CREATE TABLE user_test_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          session_name TEXT,
          total_score INTEGER,
          reading_score INTEGER,
          listening_score INTEGER,
          writing_score INTEGER,
          speaking_score INTEGER,
          time_taken INTEGER, -- in seconds
          started_at TIMESTAMPTZ DEFAULT NOW(),
          completed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        RAISE NOTICE 'Created user_test_sessions table';
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_practice_attempts_user_id ON user_practice_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_practice_attempts_section ON user_practice_attempts(section);
CREATE INDEX IF NOT EXISTS idx_user_practice_attempts_created_at ON user_practice_attempts(created_at);

CREATE INDEX IF NOT EXISTS idx_user_practice_responses_user_id ON user_practice_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_practice_responses_question_id ON user_practice_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_user_practice_responses_created_at ON user_practice_responses(created_at);

CREATE INDEX IF NOT EXISTS idx_user_test_sessions_user_id ON user_test_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_test_sessions_created_at ON user_test_sessions(created_at);

-- Enable Row Level Security
ALTER TABLE user_practice_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_practice_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_test_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop if exists first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own practice attempts" ON user_practice_attempts;
DROP POLICY IF EXISTS "Users can insert their own practice attempts" ON user_practice_attempts;
DROP POLICY IF EXISTS "Users can update their own practice attempts" ON user_practice_attempts;

CREATE POLICY "Users can view their own practice attempts" ON user_practice_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own practice attempts" ON user_practice_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own practice attempts" ON user_practice_attempts
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for user_practice_responses
DROP POLICY IF EXISTS "Users can view their own practice responses" ON user_practice_responses;
DROP POLICY IF EXISTS "Users can insert their own practice responses" ON user_practice_responses;
DROP POLICY IF EXISTS "Users can update their own practice responses" ON user_practice_responses;

CREATE POLICY "Users can view their own practice responses" ON user_practice_responses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own practice responses" ON user_practice_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own practice responses" ON user_practice_responses
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for user_test_sessions
DROP POLICY IF EXISTS "Users can view their own test sessions" ON user_test_sessions;
DROP POLICY IF EXISTS "Users can insert their own test sessions" ON user_test_sessions;
DROP POLICY IF EXISTS "Users can update their own test sessions" ON user_test_sessions;

CREATE POLICY "Users can view their own test sessions" ON user_test_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own test sessions" ON user_test_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own test sessions" ON user_test_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create or replace functions
CREATE OR REPLACE FUNCTION get_user_progress_summary(user_id_param UUID)
RETURNS TABLE (
  section TEXT,
  total_attempts INTEGER,
  average_score NUMERIC,
  best_score INTEGER,
  total_questions_answered INTEGER,
  last_attempt_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    upa.section,
    COUNT(*) as total_attempts,
    ROUND(AVG(upa.score), 2) as average_score,
    MAX(upa.score) as best_score,
    SUM(upa.total_questions) as total_questions_answered,
    MAX(upa.completed_at) as last_attempt_date
  FROM user_practice_attempts upa
  WHERE upa.user_id = user_id_param
  GROUP BY upa.section
  ORDER BY upa.section;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION calculate_user_performance(user_id_param UUID, section_param TEXT)
RETURNS TABLE (
  total_questions INTEGER,
  correct_answers INTEGER,
  accuracy_percentage NUMERIC,
  average_time_per_question NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_questions,
    COUNT(*) FILTER (WHERE upr.is_correct = true) as correct_answers,
    ROUND(
      (COUNT(*) FILTER (WHERE upr.is_correct = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 
      2
    ) as accuracy_percentage,
    ROUND(AVG(upr.time_taken), 2) as average_time_per_question
  FROM user_practice_responses upr
  JOIN practice_questions pq ON upr.question_id = pq.id
  JOIN practice_sets ps ON pq.set_id = ps.id
  WHERE upr.user_id = user_id_param 
    AND ps.section = section_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_current_progress(user_id_param UUID)
RETURNS TABLE (
  section TEXT,
  section_name TEXT,
  total_questions INTEGER,
  answered_questions INTEGER,
  completion_percentage NUMERIC,
  last_question_id UUID,
  is_completed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.section,
    CASE ps.section
      WHEN 'reading' THEN 'Reading'
      WHEN 'listening' THEN 'Listening'
      WHEN 'writing' THEN 'Writing'
      WHEN 'speaking' THEN 'Speaking'
    END as section_name,
    COUNT(pq.id) as total_questions,
    COUNT(upr.id) as answered_questions,
    ROUND(
      (COUNT(upr.id)::NUMERIC / COUNT(pq.id)::NUMERIC) * 100, 
      2
    ) as completion_percentage,
    MAX(upr.question_id) as last_question_id,
    COUNT(upr.id) >= COUNT(pq.id) as is_completed
  FROM practice_sets ps
  LEFT JOIN practice_questions pq ON ps.id = pq.set_id
  LEFT JOIN user_practice_responses upr ON pq.id = upr.question_id AND upr.user_id = user_id_param
  GROUP BY ps.section
  ORDER BY ps.section;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_user_practice_attempts_updated_at ON user_practice_attempts;
CREATE TRIGGER update_user_practice_attempts_updated_at
  BEFORE UPDATE ON user_practice_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

SELECT 'Section column error fixed successfully!' as status; 