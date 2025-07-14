-- FINAL VISA INTERVIEW LIMITS FIX
-- Updates SQL database to match pricing page exactly

-- Update the existing subscription_plan_limits table to match pricing page
UPDATE subscription_plan_limits 
SET visa_interview_limit = 50 
WHERE plan_type = 'professional';

UPDATE subscription_plan_limits 
SET visa_interview_limit = 80 
WHERE plan_type = 'elite';

-- Verify the changes
SELECT plan_type, visa_interview_limit, cold_emails_limit, reviews_limit 
FROM subscription_plan_limits 
ORDER BY 
  CASE plan_type 
    WHEN 'free' THEN 1 
    WHEN 'professional' THEN 2 
    WHEN 'elite' THEN 3 
  END;

-- Success message
SELECT 'SUCCESS: Visa interview limits updated to match pricing page exactly!' as result; 