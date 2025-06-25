-- Additional fix to allow executing raw SQL
-- Only create this if your database security policy allows it

-- Create a function that can execute raw SQL queries
-- WARNING: This is potentially dangerous and should be restricted
CREATE OR REPLACE FUNCTION public.execute_sql(sql_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE sql_query INTO result;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Alternative approach that doesn't use raw SQL
-- Create a direct checklist record creator function
CREATE OR REPLACE FUNCTION public.direct_insert_checklist_progress(user_uuid UUID, checklist_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_checklist_progress (
    user_id, 
    checklist_id, 
    completed_items, 
    progress_percentage, 
    started_at,
    last_updated
  ) 
  VALUES (
    user_uuid,
    checklist_uuid,
    '[]'::jsonb,
    0,
    now(),
    now()
  )
  ON CONFLICT (user_id, checklist_id) 
  DO UPDATE SET last_updated = now();
END;
$$; 