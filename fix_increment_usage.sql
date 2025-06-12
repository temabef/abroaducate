-- Fix for increment_usage function (Version 1)
-- Add SET search_path = '' to secure the function

CREATE OR REPLACE FUNCTION increment_usage(
    user_uuid UUID,
    usage_type TEXT,
    increment_by INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SET search_path = ''  -- 🔒 SECURITY FIX: Set fixed search path
AS $$
DECLARE
    current_month DATE := DATE_TRUNC('month', CURRENT_DATE);
BEGIN
    -- Verify the user_uuid matches the authenticated user for security
    IF user_uuid != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: Cannot modify usage for other users';
    END IF;

    -- Insert or update usage record
    INSERT INTO public.user_usage (user_id, month, sops_created, ai_improvements_used, analytics_generated, plagiarism_checks)
    VALUES (
        user_uuid,
        current_month,
        CASE WHEN usage_type = 'sops_created' THEN increment_by ELSE 0 END,
        CASE WHEN usage_type = 'ai_improvements_used' THEN increment_by ELSE 0 END,
        CASE WHEN usage_type = 'analytics_generated' THEN increment_by ELSE 0 END,
        CASE WHEN usage_type = 'plagiarism_checks' THEN increment_by ELSE 0 END
    )
    ON CONFLICT (user_id, month) DO UPDATE SET
        sops_created = public.user_usage.sops_created + 
            CASE WHEN usage_type = 'sops_created' THEN increment_by ELSE 0 END,
        ai_improvements_used = public.user_usage.ai_improvements_used + 
            CASE WHEN usage_type = 'ai_improvements_used' THEN increment_by ELSE 0 END,
        analytics_generated = public.user_usage.analytics_generated + 
            CASE WHEN usage_type = 'analytics_generated' THEN increment_by ELSE 0 END,
        plagiarism_checks = public.user_usage.plagiarism_checks + 
            CASE WHEN usage_type = 'plagiarism_checks' THEN increment_by ELSE 0 END,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- Fix for increment_usage function (Version 2 - with plan limits)
-- Add SET search_path = '' to secure the function

CREATE OR REPLACE FUNCTION increment_usage_with_limits(
    user_uuid UUID,
    usage_type TEXT,
    increment_by INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SET search_path = ''  -- 🔒 SECURITY FIX: Set fixed search path
AS $$
DECLARE
    current_month VARCHAR(7);
    current_plan VARCHAR(50);
    plan_limit INTEGER;
    current_usage INTEGER;
BEGIN
    current_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Get user's current plan
    SELECT plan_type INTO current_plan
    FROM public.user_subscriptions
    WHERE user_id = user_uuid AND status = 'active'
    LIMIT 1;
    
    IF current_plan IS NULL THEN
        current_plan := 'free';
    END IF;
    
    -- Get plan limit for this usage type
    CASE usage_type
        WHEN 'sops_created' THEN
            SELECT sops_limit INTO plan_limit FROM public.plan_limits WHERE plan_type = current_plan;
        WHEN 'ai_improvements_used' THEN
            SELECT ai_improvements_limit INTO plan_limit FROM public.plan_limits WHERE plan_type = current_plan;
        WHEN 'analytics_generated' THEN
            SELECT analytics_limit INTO plan_limit FROM public.plan_limits WHERE plan_type = current_plan;
        WHEN 'plagiarism_checks' THEN
            SELECT plagiarism_checks_limit INTO plan_limit FROM public.plan_limits WHERE plan_type = current_plan;
    END CASE;
    
    -- If limit is NULL (unlimited), allow increment
    IF plan_limit IS NULL THEN
        -- Insert or update usage
        INSERT INTO public.user_usage (user_id, month_year, sops_created, ai_improvements_used, analytics_generated, plagiarism_checks)
        VALUES (
            user_uuid, 
            current_month,
            CASE WHEN usage_type = 'sops_created' THEN increment_by ELSE 0 END,
            CASE WHEN usage_type = 'ai_improvements_used' THEN increment_by ELSE 0 END,
            CASE WHEN usage_type = 'analytics_generated' THEN increment_by ELSE 0 END,
            CASE WHEN usage_type = 'plagiarism_checks' THEN increment_by ELSE 0 END
        )
        ON CONFLICT (user_id, month_year) DO UPDATE SET
            sops_created = public.user_usage.sops_created + CASE WHEN usage_type = 'sops_created' THEN increment_by ELSE 0 END,
            ai_improvements_used = public.user_usage.ai_improvements_used + CASE WHEN usage_type = 'ai_improvements_used' THEN increment_by ELSE 0 END,
            analytics_generated = public.user_usage.analytics_generated + CASE WHEN usage_type = 'analytics_generated' THEN increment_by ELSE 0 END,
            plagiarism_checks = public.user_usage.plagiarism_checks + CASE WHEN usage_type = 'plagiarism_checks' THEN increment_by ELSE 0 END,
            updated_at = NOW();
        RETURN TRUE;
    END IF;
    
    -- Get current usage
    CASE usage_type
        WHEN 'sops_created' THEN
            SELECT COALESCE(sops_created, 0) INTO current_usage FROM public.user_usage WHERE user_id = user_uuid AND month_year = current_month;
        WHEN 'ai_improvements_used' THEN
            SELECT COALESCE(ai_improvements_used, 0) INTO current_usage FROM public.user_usage WHERE user_id = user_uuid AND month_year = current_month;
        WHEN 'analytics_generated' THEN
            SELECT COALESCE(analytics_generated, 0) INTO current_usage FROM public.user_usage WHERE user_id = user_uuid AND month_year = current_month;
        WHEN 'plagiarism_checks' THEN
            SELECT COALESCE(plagiarism_checks, 0) INTO current_usage FROM public.user_usage WHERE user_id = user_uuid AND month_year = current_month;
    END CASE;
    
    current_usage := COALESCE(current_usage, 0);
    
    -- Check if increment would exceed limit
    IF current_usage + increment_by > plan_limit THEN
        RETURN FALSE;
    END IF;
    
    -- Increment usage
    INSERT INTO public.user_usage (user_id, month_year, sops_created, ai_improvements_used, analytics_generated, plagiarism_checks)
    VALUES (
        user_uuid, 
        current_month,
        CASE WHEN usage_type = 'sops_created' THEN increment_by ELSE 0 END,
        CASE WHEN usage_type = 'ai_improvements_used' THEN increment_by ELSE 0 END,
        CASE WHEN usage_type = 'analytics_generated' THEN increment_by ELSE 0 END,
        CASE WHEN usage_type = 'plagiarism_checks' THEN increment_by ELSE 0 END
    )
    ON CONFLICT (user_id, month_year) DO UPDATE SET
        sops_created = public.user_usage.sops_created + CASE WHEN usage_type = 'sops_created' THEN increment_by ELSE 0 END,
        ai_improvements_used = public.user_usage.ai_improvements_used + CASE WHEN usage_type = 'ai_improvements_used' THEN increment_by ELSE 0 END,
        analytics_generated = public.user_usage.analytics_generated + CASE WHEN usage_type = 'analytics_generated' THEN increment_by ELSE 0 END,
        plagiarism_checks = public.user_usage.plagiarism_checks + CASE WHEN usage_type = 'plagiarism_checks' THEN increment_by ELSE 0 END,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$; 