-- ========================================
-- FIX ALL TEST PREP TABLE STRUCTURES
-- ========================================
-- This script ensures all test prep tables have the correct structure with all required columns

-- 1. Fix practice_tests table
DO $$
BEGIN
    -- Check if practice_tests table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'practice_tests') THEN
        -- Add missing columns
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_tests' AND column_name = 'slug') THEN
            ALTER TABLE practice_tests ADD COLUMN slug TEXT UNIQUE;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_tests' AND column_name = 'name') THEN
            ALTER TABLE practice_tests ADD COLUMN name TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_tests' AND column_name = 'description') THEN
            ALTER TABLE practice_tests ADD COLUMN description TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_tests' AND column_name = 'created_at') THEN
            ALTER TABLE practice_tests ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_tests' AND column_name = 'updated_at') THEN
            ALTER TABLE practice_tests ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
        
        RAISE NOTICE 'Updated practice_tests table structure';
    ELSE
        -- Create practice_tests table
        CREATE TABLE practice_tests (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          slug TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Created practice_tests table';
    END IF;
END $$;

-- 2. Fix practice_sets table
DO $$
BEGIN
    -- Check if practice_sets table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'practice_sets') THEN
        -- Add missing columns
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_sets' AND column_name = 'test_id') THEN
            ALTER TABLE practice_sets ADD COLUMN test_id UUID REFERENCES practice_tests(id) ON DELETE CASCADE;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_sets' AND column_name = 'section') THEN
            ALTER TABLE practice_sets ADD COLUMN section TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_sets' AND column_name = 'title') THEN
            ALTER TABLE practice_sets ADD COLUMN title TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_sets' AND column_name = 'sort_order') THEN
            ALTER TABLE practice_sets ADD COLUMN sort_order INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_sets' AND column_name = 'passage') THEN
            ALTER TABLE practice_sets ADD COLUMN passage TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_sets' AND column_name = 'created_at') THEN
            ALTER TABLE practice_sets ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_sets' AND column_name = 'updated_at') THEN
            ALTER TABLE practice_sets ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
        
        -- Add check constraint if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.check_constraints WHERE constraint_name = 'practice_sets_section_check') THEN
            ALTER TABLE practice_sets ADD CONSTRAINT practice_sets_section_check 
                CHECK (section IN ('reading', 'listening', 'writing', 'speaking'));
        END IF;
        
        RAISE NOTICE 'Updated practice_sets table structure';
    ELSE
        -- Create practice_sets table
        CREATE TABLE practice_sets (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          test_id UUID REFERENCES practice_tests(id) ON DELETE CASCADE,
          section TEXT NOT NULL CHECK (section IN ('reading', 'listening', 'writing', 'speaking')),
          title TEXT NOT NULL,
          sort_order INTEGER NOT NULL DEFAULT 0,
          passage TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Created practice_sets table';
    END IF;
END $$;

-- 3. Fix practice_questions table
DO $$
BEGIN
    -- Check if practice_questions table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'practice_questions') THEN
        -- Add missing columns
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_questions' AND column_name = 'set_id') THEN
            ALTER TABLE practice_questions ADD COLUMN set_id UUID REFERENCES practice_sets(id) ON DELETE CASCADE;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_questions' AND column_name = 'question_text') THEN
            ALTER TABLE practice_questions ADD COLUMN question_text TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_questions' AND column_name = 'explanation') THEN
            ALTER TABLE practice_questions ADD COLUMN explanation TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_questions' AND column_name = 'question_type') THEN
            ALTER TABLE practice_questions ADD COLUMN question_type TEXT DEFAULT 'multiple_choice';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_questions' AND column_name = 'sort_order') THEN
            ALTER TABLE practice_questions ADD COLUMN sort_order INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_questions' AND column_name = 'audio_url') THEN
            ALTER TABLE practice_questions ADD COLUMN audio_url TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_questions' AND column_name = 'metadata') THEN
            ALTER TABLE practice_questions ADD COLUMN metadata JSONB;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_questions' AND column_name = 'created_at') THEN
            ALTER TABLE practice_questions ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_questions' AND column_name = 'updated_at') THEN
            ALTER TABLE practice_questions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
        
        -- Add check constraint if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.check_constraints WHERE constraint_name = 'practice_questions_question_type_check') THEN
            ALTER TABLE practice_questions ADD CONSTRAINT practice_questions_question_type_check 
                CHECK (question_type IN ('multiple_choice', 'essay', 'short_answer', 'speaking_prompt', 'listening_comprehension'));
        END IF;
        
        RAISE NOTICE 'Updated practice_questions table structure';
    ELSE
        -- Create practice_questions table
        CREATE TABLE practice_questions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          set_id UUID REFERENCES practice_sets(id) ON DELETE CASCADE,
          question_text TEXT NOT NULL,
          explanation TEXT,
          question_type TEXT NOT NULL DEFAULT 'multiple_choice' 
            CHECK (question_type IN ('multiple_choice', 'essay', 'short_answer', 'speaking_prompt', 'listening_comprehension')),
          sort_order INTEGER NOT NULL DEFAULT 0,
          audio_url TEXT,
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Created practice_questions table';
    END IF;
END $$;

-- 4. Fix practice_choices table
DO $$
BEGIN
    -- Check if practice_choices table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'practice_choices') THEN
        -- Add missing columns
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_choices' AND column_name = 'question_id') THEN
            ALTER TABLE practice_choices ADD COLUMN question_id UUID REFERENCES practice_questions(id) ON DELETE CASCADE;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_choices' AND column_name = 'choice_text') THEN
            ALTER TABLE practice_choices ADD COLUMN choice_text TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_choices' AND column_name = 'is_correct') THEN
            ALTER TABLE practice_choices ADD COLUMN is_correct BOOLEAN DEFAULT FALSE;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_choices' AND column_name = 'sort_order') THEN
            ALTER TABLE practice_choices ADD COLUMN sort_order INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_choices' AND column_name = 'created_at') THEN
            ALTER TABLE practice_choices ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
        
        RAISE NOTICE 'Updated practice_choices table structure';
    ELSE
        -- Create practice_choices table
        CREATE TABLE practice_choices (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          question_id UUID REFERENCES practice_questions(id) ON DELETE CASCADE,
          choice_text TEXT NOT NULL,
          is_correct BOOLEAN DEFAULT FALSE,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Created practice_choices table';
    END IF;
END $$;

-- 5. Fix user_practice_attempts table (from previous script)
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

-- 6. Create user_practice_responses table if it doesn't exist
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

-- 7. Create user_test_sessions table if it doesn't exist
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

-- 8. Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_practice_tests_slug ON practice_tests(slug);
CREATE INDEX IF NOT EXISTS idx_practice_sets_test_id ON practice_sets(test_id);
CREATE INDEX IF NOT EXISTS idx_practice_sets_section ON practice_sets(section);
CREATE INDEX IF NOT EXISTS idx_practice_questions_set_id ON practice_questions(set_id);
CREATE INDEX IF NOT EXISTS idx_practice_questions_sort_order ON practice_questions(sort_order);
CREATE INDEX IF NOT EXISTS idx_practice_choices_question_id ON practice_choices(question_id);
CREATE INDEX IF NOT EXISTS idx_practice_choices_sort_order ON practice_choices(sort_order);

CREATE INDEX IF NOT EXISTS idx_user_practice_attempts_user_id ON user_practice_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_practice_attempts_section ON user_practice_attempts(section);
CREATE INDEX IF NOT EXISTS idx_user_practice_attempts_created_at ON user_practice_attempts(created_at);

CREATE INDEX IF NOT EXISTS idx_user_practice_responses_user_id ON user_practice_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_practice_responses_question_id ON user_practice_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_user_practice_responses_created_at ON user_practice_responses(created_at);

CREATE INDEX IF NOT EXISTS idx_user_test_sessions_user_id ON user_test_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_test_sessions_created_at ON user_test_sessions(created_at);

-- 9. Enable Row Level Security
ALTER TABLE user_practice_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_practice_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_test_sessions ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies (drop if exists first to avoid conflicts)
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

-- 11. Create or replace functions
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

-- 12. Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13. Create triggers if they don't exist
DROP TRIGGER IF EXISTS update_user_practice_attempts_updated_at ON user_practice_attempts;
CREATE TRIGGER update_user_practice_attempts_updated_at
  BEFORE UPDATE ON user_practice_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_practice_tests_updated_at ON practice_tests;
CREATE TRIGGER update_practice_tests_updated_at
  BEFORE UPDATE ON practice_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_practice_sets_updated_at ON practice_sets;
CREATE TRIGGER update_practice_sets_updated_at
  BEFORE UPDATE ON practice_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_practice_questions_updated_at ON practice_questions;
CREATE TRIGGER update_practice_questions_updated_at
  BEFORE UPDATE ON practice_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

SELECT 'All test prep table structures fixed successfully!' as status; 