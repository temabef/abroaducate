-- Migration: Change default free credits to 3
-- Update existing users to have 3 credits if they had 0 or 1.

ALTER TABLE public.user_profiles 
ALTER COLUMN credits SET DEFAULT 3;

UPDATE public.user_profiles 
SET credits = 3 
WHERE credits <= 1;
