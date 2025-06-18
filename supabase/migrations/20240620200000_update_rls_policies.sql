-- Migration: Update RLS Policies to Use Centralized Admin Check
-- Description: Updates existing RLS policies to use the new is_admin() function

-- Update ai_usage_log policy
DROP POLICY IF EXISTS "Admin users have full access to all usage logs" ON public.ai_usage_log;
CREATE POLICY "Admin users have full access to all usage logs"
  ON public.ai_usage_log
  USING (public.is_admin());

-- Update scholarships policy
DROP POLICY IF EXISTS "Admins can manage scholarships" ON public.scholarships;
CREATE POLICY "Admins can manage scholarships"
  ON public.scholarships
  FOR ALL
  USING (public.is_admin());

-- Update other policies as needed
-- Add more policy updates here as you identify them

-- Example for updating other admin policies:
/*
DROP POLICY IF EXISTS "Admin policy name" ON public.table_name;
CREATE POLICY "Admin policy name"
  ON public.table_name
  FOR ALL
  USING (public.is_admin());
*/ 