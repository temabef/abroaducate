-- Uses to_regprocedure(...) guard since ALTER FUNCTION does not support IF EXISTS

DO $$ BEGIN
  IF to_regprocedure('public.update_practice_choices_updated_at()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.update_practice_choices_updated_at() SET search_path = public';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regprocedure('public.encode_html_entities(text)') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.encode_html_entities(text) SET search_path = public';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regprocedure('public.decode_html_entities(text)') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.decode_html_entities(text) SET search_path = public';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regprocedure('public.set_updated_at_quick_profile()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.set_updated_at_quick_profile() SET search_path = public';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regprocedure('public.increment_usage(uuid, text, integer)') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.increment_usage(uuid, text, integer) SET search_path = public';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regprocedure('public.sync_bbc_learning_english_content()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.sync_bbc_learning_english_content() SET search_path = public';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regprocedure('public.can_manage_content()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.can_manage_content() SET search_path = public';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regprocedure('public.get_admin_users_nuclear()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.get_admin_users_nuclear() SET search_path = public';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regprocedure('public.can_manage_admins_nuclear()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.can_manage_admins_nuclear() SET search_path = public';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regprocedure('public.get_current_user_admin_role()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.get_current_user_admin_role() SET search_path = public';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regprocedure('public.add_admin_user_nuclear(text, text)') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.add_admin_user_nuclear(text, text) SET search_path = public';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regprocedure('public.remove_admin_user_nuclear(text)') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.remove_admin_user_nuclear(text) SET search_path = public';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regprocedure('public.get_dashboard_analytics()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.get_dashboard_analytics() SET search_path = public';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regprocedure('public.get_listening_questions_with_audio(uuid)') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.get_listening_questions_with_audio(uuid) SET search_path = public';
  END IF;
END $$;


