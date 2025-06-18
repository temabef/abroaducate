-- ========================================
-- INLINE EDITING RATE LIMITING MIGRATION
-- ========================================
-- Run this SQL in your Supabase dashboard to enable rate limiting for inline editing

-- 1. Add inline_edits_used column to user_usage table
ALTER TABLE public.user_usage 
ADD COLUMN IF NOT EXISTS inline_edits_used INTEGER DEFAULT 0;

-- 2. Create an index for better performance on usage queries
CREATE INDEX IF NOT EXISTS idx_user_usage_inline_edits 
ON public.user_usage (user_id, month_year, inline_edits_used);

-- 3. Update plan_limits table to include inline editing limits
-- Note: This assumes your plan_limits table exists. If not, you may need to adjust.
UPDATE public.plan_limits 
SET features = CASE 
    WHEN plan_type = 'free' THEN 
        COALESCE(features, '{}'::jsonb) || jsonb_build_object('inline_edits_limit', 5)
    WHEN plan_type = 'professional' THEN 
        COALESCE(features, '{}'::jsonb) || jsonb_build_object('inline_edits_limit', 50)
    WHEN plan_type = 'elite' THEN 
        COALESCE(features, '{}'::jsonb) || jsonb_build_object('inline_edits_limit', null)
    ELSE features
END
WHERE plan_type IN ('free', 'professional', 'elite');

-- 4. Create a function to check and increment inline editing usage
CREATE OR REPLACE FUNCTION check_and_increment_inline_edits(
    user_uuid UUID,
    increment_by INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
    current_month VARCHAR(7);
    plan_type TEXT;
    current_usage INTEGER;
    plan_limit INTEGER;
BEGIN
    current_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Get user's plan (default to free if no active subscription)
    SELECT us.plan_type INTO plan_type
    FROM user_subscriptions us
    WHERE us.user_id = user_uuid 
    AND us.status IN ('active', 'trialing')
    ORDER BY us.created_at DESC
    LIMIT 1;
    
    -- Default to free plan if no subscription found
    IF plan_type IS NULL THEN
        plan_type := 'free';
    END IF;
    
    -- Get plan limit for inline edits
    CASE plan_type
        WHEN 'free' THEN plan_limit := 5;
        WHEN 'professional' THEN plan_limit := 50;
        WHEN 'elite' THEN plan_limit := NULL; -- Unlimited
        ELSE plan_limit := 5; -- Default to free limit
    END CASE;
    
    -- If unlimited (elite plan), allow increment and track usage
    IF plan_limit IS NULL THEN
        INSERT INTO user_usage (user_id, month_year, inline_edits_used)
        VALUES (user_uuid, current_month, increment_by)
        ON CONFLICT (user_id, month_year)
        DO UPDATE SET inline_edits_used = COALESCE(user_usage.inline_edits_used, 0) + increment_by;
        
        RETURN TRUE;
    END IF;
    
    -- Get current usage for this month
    SELECT COALESCE(inline_edits_used, 0) INTO current_usage 
    FROM user_usage 
    WHERE user_id = user_uuid AND month_year = current_month;
    
    current_usage := COALESCE(current_usage, 0);
    
    -- Check if increment would exceed limit
    IF current_usage + increment_by > plan_limit THEN
        -- Log the limit exceeded attempt (optional)
        RAISE LOG 'Inline editing limit exceeded for user % (plan: %, usage: %/%)', 
                  user_uuid, plan_type, current_usage, plan_limit;
        RETURN FALSE;
    END IF;
    
    -- Increment usage since limit check passed
    INSERT INTO user_usage (user_id, month_year, inline_edits_used)
    VALUES (user_uuid, current_month, increment_by)
    ON CONFLICT (user_id, month_year)
    DO UPDATE SET inline_edits_used = COALESCE(user_usage.inline_edits_used, 0) + increment_by;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create a function to get current inline editing usage
CREATE OR REPLACE FUNCTION get_inline_editing_usage(user_uuid UUID)
RETURNS TABLE (
    current_usage INTEGER,
    monthly_limit INTEGER,
    plan_type TEXT,
    usage_percentage NUMERIC
) AS $$
DECLARE
    current_month VARCHAR(7);
    user_plan TEXT;
    plan_limit INTEGER;
    usage_count INTEGER;
BEGIN
    current_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Get user's plan
    SELECT us.plan_type INTO user_plan
    FROM user_subscriptions us
    WHERE us.user_id = user_uuid 
    AND us.status IN ('active', 'trialing')
    ORDER BY us.created_at DESC
    LIMIT 1;
    
    -- Default to free if no subscription
    user_plan := COALESCE(user_plan, 'free');
    
    -- Get plan limit
    CASE user_plan
        WHEN 'free' THEN plan_limit := 5;
        WHEN 'professional' THEN plan_limit := 50;
        WHEN 'elite' THEN plan_limit := NULL; -- Unlimited
        ELSE plan_limit := 5;
    END CASE;
    
    -- Get current usage
    SELECT COALESCE(uu.inline_edits_used, 0) INTO usage_count
    FROM user_usage uu
    WHERE uu.user_id = user_uuid AND uu.month_year = current_month;
    
    usage_count := COALESCE(usage_count, 0);
    
    RETURN QUERY SELECT 
        usage_count,
        plan_limit,
        user_plan,
        CASE 
            WHEN plan_limit IS NULL THEN 0::NUMERIC  -- Unlimited = 0%
            ELSE ROUND((usage_count::NUMERIC / plan_limit::NUMERIC) * 100, 2)
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant necessary permissions to authenticated users
GRANT EXECUTE ON FUNCTION check_and_increment_inline_edits(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_inline_editing_usage(UUID) TO authenticated;

-- 7. Add helpful comments for documentation
COMMENT ON COLUMN public.user_usage.inline_edits_used IS 'Number of inline AI text edits performed this month';
COMMENT ON FUNCTION check_and_increment_inline_edits IS 'Check if user can perform inline edit and increment usage counter if allowed';
COMMENT ON FUNCTION get_inline_editing_usage IS 'Get current inline editing usage stats for a user';

-- 8. Create RLS policies if they don't exist (optional security enhancement)
DO $$
BEGIN
    -- Enable RLS on user_usage if not already enabled
    ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;
    
    -- Create policy for users to see their own usage (if doesn't exist)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_usage' 
        AND policyname = 'Users can view own usage'
    ) THEN
        CREATE POLICY "Users can view own usage" ON public.user_usage
        FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    -- Create policy for users to update their own usage (if doesn't exist)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_usage' 
        AND policyname = 'Users can update own usage'
    ) THEN
        CREATE POLICY "Users can update own usage" ON public.user_usage
        FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    -- Create policy for users to insert their own usage (if doesn't exist)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_usage' 
        AND policyname = 'Users can insert own usage'
    ) THEN
        CREATE POLICY "Users can insert own usage" ON public.user_usage
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE LOG 'RLS policies may already exist or there was an error: %', SQLERRM;
END
$$;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================
-- Run these to verify the migration worked:

-- Check if column was added
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'user_usage' AND column_name = 'inline_edits_used';

-- Check if functions were created
-- SELECT routine_name, routine_type 
-- FROM information_schema.routines 
-- WHERE routine_name IN ('check_and_increment_inline_edits', 'get_inline_editing_usage');

-- Test the function (replace with a real user UUID)
-- SELECT * FROM get_inline_editing_usage('your-user-uuid-here');

-- ========================================
-- SUMMARY
-- ========================================
-- ✅ Added inline_edits_used column to user_usage table
-- ✅ Created performance index for inline editing queries  
-- ✅ Updated plan limits to include inline editing limits
-- ✅ Created function to check and increment usage with proper limits
-- ✅ Created function to get current usage statistics
-- ✅ Set up proper RLS policies for security
-- ✅ Added comprehensive comments and documentation
--
-- PLAN LIMITS IMPLEMENTED:
-- • Free Plan: 5 inline edits/month (GPT-3.5 Turbo)
-- • Professional Plan: 50 inline edits/month (GPT-4o-mini)  
-- • Elite Plan: Unlimited inline edits (GPT-4o)
-- ======================================== 