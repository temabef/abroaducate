-- ============================================================
-- Auto-create user_profiles row on signup
-- ============================================================
-- This trigger ensures every new auth.users row gets a 
-- corresponding user_profiles row with 3 free credits.
-- 
-- Fixes the issue where 77% of users have null credits because
-- the welcome email endpoint fails silently.
-- ============================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create profile if one doesn't exist yet
  INSERT INTO public.user_profiles (user_id, credits, workspace_data)
  VALUES (NEW.id, 3, '{}'::jsonb)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger that fires after new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users who don't have profiles
-- This fixes the 10 users from last 7 days who have null credits
INSERT INTO public.user_profiles (user_id, credits, workspace_data)
SELECT id, 3, '{}'::jsonb
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_profiles)
ON CONFLICT (user_id) DO NOTHING;

-- Log how many profiles were backfilled
DO $$
DECLARE
  backfilled_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO backfilled_count
  FROM auth.users
  WHERE id NOT IN (SELECT user_id FROM public.user_profiles);
  
  IF backfilled_count > 0 THEN
    RAISE NOTICE 'Backfilled % user profiles with 3 credits', backfilled_count;
  ELSE
    RAISE NOTICE 'All users already have profiles';
  END IF;
END $$;
