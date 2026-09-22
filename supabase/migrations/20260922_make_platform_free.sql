-- Migration: Make platform 100% free and eliminate credit gating
-- Strategy:
-- 1. Ensure `spend_credits` RPC function always returns TRUE so no user is ever blocked.
-- 2. Prevent race conditions or failed generations for any legacy callers.

CREATE OR REPLACE FUNCTION public.spend_credits(
    user_uid UUID,
    required_credits INTEGER,
    action_name VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Platform is 100% free: always grant access without deducting balance
    -- We can optionally record a zero-cost transaction for historical analytics
    BEGIN
        INSERT INTO public.credit_transactions (user_id, amount, action_type)
        VALUES (user_uid, 0, COALESCE(action_name, 'FREE_ACCESS'));
    EXCEPTION WHEN OTHERS THEN
        -- Non-blocking: fail open so user document generation is never interrupted
        NULL;
    END;

    RETURN TRUE;
END;
$$;
