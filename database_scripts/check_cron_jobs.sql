-- Check Cron Jobs and Email Digest Status
-- Run these queries to diagnose the email digest issue

-- 1. Check if cron jobs are enabled
SELECT 
  name,
  enabled,
  schedule,
  last_run,
  next_run
FROM cron.job;

-- 2. Check recent cron job runs
SELECT 
  job_id,
  run_id,
  job_pid,
  database,
  username,
  command,
  return_message,
  start_time,
  end_time,
  total_runtime
FROM cron.job_run 
ORDER BY start_time DESC 
LIMIT 10;

-- 3. Check if there are any premium users who should receive daily digest
SELECT 
  p.id,
  p.email,
  p.full_name,
  us.plan_type,
  us.status as subscription_status,
  us.current_period_end
FROM profiles p
LEFT JOIN user_subscriptions us ON us.user_id = p.id
WHERE us.plan_type IN ('professional', 'elite')
  AND us.status = 'active'
  AND us.current_period_end > NOW();

-- 4. Check newsletter subscribers who should receive daily digest
SELECT 
  user_id,
  email,
  status,
  scholarship_digest,
  subscribed_at
FROM newsletter_subscribers 
WHERE scholarship_digest = true 
  AND status = 'subscribed';

-- 5. Check recent email logs
SELECT 
  id,
  user_id,
  email,
  subject,
  status,
  created_at
FROM newsletter_email_logs 
ORDER BY created_at DESC 
LIMIT 20;

-- 6. Check if the cron job function exists
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name LIKE '%digest%' 
  OR routine_name LIKE '%cron%';

-- 7. Test the digest function manually (if it exists)
-- CALL send_scholarship_digest(); 