-- ========================================
-- EMERGENCY FIX FOR CREATED_AT COLUMN ERROR
-- ========================================
-- This script specifically targets the "column created_at does not exist" error

-- First, let's check which tables exist and their current structure
DO $$
DECLARE
    table_record RECORD;
    column_record RECORD;
BEGIN
    RAISE NOTICE '=== CHECKING EXISTING TABLE STRUCTURES ===';
    
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('practice_tests', 'practice_sets', 'practice_questions', 'practice_choices', 'user_practice_attempts', 'user_practice_responses', 'user_test_sessions')
        ORDER BY table_name
    LOOP
        RAISE NOTICE 'Table: %', table_record.table_name;
        
        FOR column_record IN 
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = table_record.table_name
            ORDER BY column_name
        LOOP
            RAISE NOTICE '  Column: % (%)', column_record.column_name, column_record.data_type;
        END LOOP;
    END LOOP;
END $$;

-- Now let's fix each table one by one, starting with the most likely culprits

-- 1. Fix practice_sets table (most likely to be missing created_at)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'practice_sets') THEN
        -- Check if created_at column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_sets' AND column_name = 'created_at') THEN
            ALTER TABLE practice_sets ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
            RAISE NOTICE 'Added created_at column to practice_sets table';
        ELSE
            RAISE NOTICE 'created_at column already exists in practice_sets table';
        END IF;
        
        -- Check if updated_at column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_sets' AND column_name = 'updated_at') THEN
            ALTER TABLE practice_sets ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
            RAISE NOTICE 'Added updated_at column to practice_sets table';
        ELSE
            RAISE NOTICE 'updated_at column already exists in practice_sets table';
        END IF;
    ELSE
        RAISE NOTICE 'practice_sets table does not exist';
    END IF;
END $$;

-- 2. Fix practice_questions table
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'practice_questions') THEN
        -- Check if created_at column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_questions' AND column_name = 'created_at') THEN
            ALTER TABLE practice_questions ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
            RAISE NOTICE 'Added created_at column to practice_questions table';
        ELSE
            RAISE NOTICE 'created_at column already exists in practice_questions table';
        END IF;
        
        -- Check if updated_at column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_questions' AND column_name = 'updated_at') THEN
            ALTER TABLE practice_questions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
            RAISE NOTICE 'Added updated_at column to practice_questions table';
        ELSE
            RAISE NOTICE 'updated_at column already exists in practice_questions table';
        END IF;
    ELSE
        RAISE NOTICE 'practice_questions table does not exist';
    END IF;
END $$;

-- 3. Fix practice_choices table
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'practice_choices') THEN
        -- Check if created_at column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_choices' AND column_name = 'created_at') THEN
            ALTER TABLE practice_choices ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
            RAISE NOTICE 'Added created_at column to practice_choices table';
        ELSE
            RAISE NOTICE 'created_at column already exists in practice_choices table';
        END IF;
    ELSE
        RAISE NOTICE 'practice_choices table does not exist';
    END IF;
END $$;

-- 4. Fix practice_tests table
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'practice_tests') THEN
        -- Check if created_at column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_tests' AND column_name = 'created_at') THEN
            ALTER TABLE practice_tests ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
            RAISE NOTICE 'Added created_at column to practice_tests table';
        ELSE
            RAISE NOTICE 'created_at column already exists in practice_tests table';
        END IF;
        
        -- Check if updated_at column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'practice_tests' AND column_name = 'updated_at') THEN
            ALTER TABLE practice_tests ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
            RAISE NOTICE 'Added updated_at column to practice_tests table';
        ELSE
            RAISE NOTICE 'updated_at column already exists in practice_tests table';
        END IF;
    ELSE
        RAISE NOTICE 'practice_tests table does not exist';
    END IF;
END $$;

-- 5. Fix user_practice_attempts table
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_practice_attempts') THEN
        -- Check if created_at column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_practice_attempts' AND column_name = 'created_at') THEN
            ALTER TABLE user_practice_attempts ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
            RAISE NOTICE 'Added created_at column to user_practice_attempts table';
        ELSE
            RAISE NOTICE 'created_at column already exists in user_practice_attempts table';
        END IF;
        
        -- Check if updated_at column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_practice_attempts' AND column_name = 'updated_at') THEN
            ALTER TABLE user_practice_attempts ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
            RAISE NOTICE 'Added updated_at column to user_practice_attempts table';
        ELSE
            RAISE NOTICE 'updated_at column already exists in user_practice_attempts table';
        END IF;
        
        -- Check if section column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_practice_attempts' AND column_name = 'section') THEN
            ALTER TABLE user_practice_attempts ADD COLUMN section TEXT;
            RAISE NOTICE 'Added section column to user_practice_attempts table';
        ELSE
            RAISE NOTICE 'section column already exists in user_practice_attempts table';
        END IF;
    ELSE
        RAISE NOTICE 'user_practice_attempts table does not exist';
    END IF;
END $$;

-- 6. Fix user_practice_responses table
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_practice_responses') THEN
        -- Check if created_at column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_practice_responses' AND column_name = 'created_at') THEN
            ALTER TABLE user_practice_responses ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
            RAISE NOTICE 'Added created_at column to user_practice_responses table';
        ELSE
            RAISE NOTICE 'created_at column already exists in user_practice_responses table';
        END IF;
    ELSE
        RAISE NOTICE 'user_practice_responses table does not exist';
    END IF;
END $$;

-- 7. Fix user_test_sessions table
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_test_sessions') THEN
        -- Check if created_at column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_test_sessions' AND column_name = 'created_at') THEN
            ALTER TABLE user_test_sessions ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
            RAISE NOTICE 'Added created_at column to user_test_sessions table';
        ELSE
            RAISE NOTICE 'created_at column already exists in user_test_sessions table';
        END IF;
    ELSE
        RAISE NOTICE 'user_test_sessions table does not exist';
    END IF;
END $$;

-- Now let's check if there are any queries or functions that might be referencing created_at incorrectly
DO $$
BEGIN
    RAISE NOTICE '=== CHECKING FOR POTENTIAL ISSUES ===';
    
    -- Check if there are any views that might be causing issues
    IF EXISTS (SELECT FROM information_schema.views WHERE table_schema = 'public' AND table_name LIKE '%practice%') THEN
        RAISE NOTICE 'Found practice-related views that might need updating';
    END IF;
    
    -- Check if there are any functions that might be causing issues
    IF EXISTS (SELECT FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name LIKE '%practice%') THEN
        RAISE NOTICE 'Found practice-related functions that might need updating';
    END IF;
END $$;

-- Finally, let's verify the fix worked by checking the structure again
DO $$
DECLARE
    table_record RECORD;
    column_record RECORD;
BEGIN
    RAISE NOTICE '=== VERIFYING FIXED TABLE STRUCTURES ===';
    
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('practice_tests', 'practice_sets', 'practice_questions', 'practice_choices', 'user_practice_attempts', 'user_practice_responses', 'user_test_sessions')
        ORDER BY table_name
    LOOP
        RAISE NOTICE 'Table: %', table_record.table_name;
        
        FOR column_record IN 
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = table_record.table_name
            AND column_name IN ('created_at', 'updated_at', 'section')
            ORDER BY column_name
        LOOP
            RAISE NOTICE '  Column: % (%)', column_record.column_name, column_record.data_type;
        END LOOP;
    END LOOP;
END $$;

SELECT 'Emergency fix for created_at column error completed!' as status; 