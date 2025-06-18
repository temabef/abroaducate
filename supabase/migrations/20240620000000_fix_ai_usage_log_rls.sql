-- Migration: Fix RLS for ai_usage_log table
-- Description: Enables Row Level Security on the ai_usage_log table and adds appropriate policies

-- Enable Row Level Security on the ai_usage_log table
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own usage logs
CREATE POLICY "Users can view their own usage logs"
  ON public.ai_usage_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to only insert their own usage logs
CREATE POLICY "Users can insert their own usage logs"
  ON public.ai_usage_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to only update their own usage logs
CREATE POLICY "Users can update their own usage logs"
  ON public.ai_usage_log
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy to allow users to only delete their own usage logs
CREATE POLICY "Users can delete their own usage logs"
  ON public.ai_usage_log
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant admin users full access to all usage logs based on specific admin emails
CREATE POLICY "Admin users have full access to all usage logs"
  ON public.ai_usage_log
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@abroaducate.com' OR
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'solakolawole62@gmail.com' OR
    (SELECT email FROM auth.users WHERE id = auth.uid()) LIKE '%admin%'
  ); 