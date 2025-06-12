-- 🚨 CRITICAL SECURITY FIX: Scholarships RLS Policy
-- Replace user_metadata with app_metadata to prevent privilege escalation

-- First, drop the vulnerable policy
DROP POLICY IF EXISTS "Admins can manage scholarships" ON public.scholarships;

-- Create the secure policy using app_metadata instead
-- app_metadata can only be set by admins, not by users
CREATE POLICY "Admins can manage scholarships" ON public.scholarships
FOR ALL TO authenticated
USING (
  -- 🔒 SECURITY FIX: Use app_metadata instead of user_metadata
  -- Only admins can modify app_metadata, preventing privilege escalation
  (auth.uid() IS NOT NULL) AND 
  (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text)
);

-- Alternative secure approach if you prefer to use a dedicated admin table:
-- You could also create an admin_users table and check against that
-- 
-- CREATE POLICY "Admins can manage scholarships" ON public.scholarships
-- FOR ALL TO authenticated  
-- USING (
--   auth.uid() IN (SELECT user_id FROM public.admin_users WHERE is_active = true)
-- ); 