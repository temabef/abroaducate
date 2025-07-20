-- ====================================
-- FIX USER REGISTRATION ISSUE
-- ====================================
-- This fixes the "database error saving new user" issue
-- The problem is that there's no trigger to create profile entries when users sign up

-- 1. Ensure profiles table exists with proper structure
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile entry for new user
    INSERT INTO profiles (id, email, full_name, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.created_at
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 4. Populate missing profiles for existing users
INSERT INTO profiles (id, email, full_name, created_at)
SELECT 
    u.id, 
    u.email, 
    COALESCE(u.raw_user_meta_data->>'full_name', ''),
    u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = NOW();

-- 5. Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 7. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;

-- 8. Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 9. Verify the fix
DO $$
DECLARE
    profile_count INTEGER;
    user_count INTEGER;
BEGIN
    -- Count profiles
    SELECT COUNT(*) INTO profile_count FROM profiles;
    
    -- Count auth users
    SELECT COUNT(*) INTO user_count FROM auth.users;
    
    RAISE NOTICE 'Profiles count: %, Auth users count: %', profile_count, user_count;
    
    IF profile_count = user_count THEN
        RAISE NOTICE '✅ SUCCESS: All users have profile entries';
    ELSE
        RAISE NOTICE '⚠️  WARNING: Profile count mismatch. Profiles: %, Users: %', profile_count, user_count;
    END IF;
END $$;

-- 10. Test the trigger (optional - uncomment to test)
/*
-- This will test if the trigger works (don't run in production)
INSERT INTO auth.users (id, email, created_at)
VALUES (gen_random_uuid(), 'test@example.com', NOW())
ON CONFLICT DO NOTHING;
*/ 