-- Migration: Implement Pay-As-You-Go Credit System
-- Strategy: Add a `credits` integer to the base `users` or `profiles` table.

-- Assuming you have a `user_profiles` table that triggers on auth.users:
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 1 NOT NULL;

-- Log table for credit usage (audit trail)
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    amount INTEGER NOT NULL, -- Negative for usage, positive for top-up
    action_type VARCHAR(255) NOT NULL, -- 'SIGNUP_BONUS', 'PURCHASE', 'RIGHT_FIT_CHECK', 'DOC_REVIEW'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for transactions
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own transactions" 
ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);

-- RPC for securely spending a credit (prevents race conditions)
CREATE OR REPLACE FUNCTION spend_credits(user_uid UUID, required_credits INTEGER, action_name VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_balance INTEGER;
BEGIN
    SELECT credits INTO current_balance FROM user_profiles WHERE user_id = user_uid FOR UPDATE;
    
    IF current_balance >= required_credits THEN
        UPDATE user_profiles SET credits = credits - required_credits WHERE user_id = user_uid;
        INSERT INTO credit_transactions (user_id, amount, action_type) VALUES (user_uid, -required_credits, action_name);
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;
