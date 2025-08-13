-- Ensure views run with the querying user's privileges and RLS policies
-- rather than the view owner's (fixes Supabase security advisor errors)

-- Scholarships public decoded view
ALTER VIEW IF EXISTS public.public_scholarships_decoded
  SET (security_invoker = true);

-- Scholarship tracking and reminders related views
ALTER VIEW IF EXISTS public.user_scholarship_deadlines
  SET (security_invoker = true);

ALTER VIEW IF EXISTS public.user_deadline_reminders
  SET (security_invoker = true);

ALTER VIEW IF EXISTS public.user_calendar_status
  SET (security_invoker = true);

-- Newsletter-related views (defensive hardening)
ALTER VIEW IF EXISTS public.active_newsletter_subscribers
  SET (security_invoker = true);

ALTER VIEW IF EXISTS public.newsletter_campaign_performance
  SET (security_invoker = true);

ALTER VIEW IF EXISTS public.newsletter_subscriber_summary
  SET (security_invoker = true);

-- Keep explicit permissions for public access where intended
GRANT SELECT ON public.public_scholarships_decoded TO anon, authenticated;


