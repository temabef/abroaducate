-- Fix the remaining 6 functions with search_path issues
-- Simple approach - handle each function individually

DO $$
DECLARE
    success_count INTEGER := 0;
    func_name TEXT;
BEGIN
    RAISE NOTICE '🔧 Starting to fix remaining 6 functions...';
    
    -- First, let's find the exact function signatures from the database
    RAISE NOTICE '🔍 Finding exact function signatures...';
    
    FOR func_name IN 
        SELECT 
            p.proname || '(' || 
            COALESCE(pg_get_function_identity_arguments(p.oid), '') || ')'
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname IN (
            'check_and_increment_inline_edits', 
            'log_migration', 
            'get_dashboard_analytics', 
            'calculate_fraud_risk_score', 
            'should_block_registration', 
            'log_registration_event'
        )
    LOOP
        BEGIN
            EXECUTE format('ALTER FUNCTION public.%s SET search_path FROM CURRENT', func_name);
            RAISE NOTICE '✅ Fixed search_path for function: %', func_name;
            success_count := success_count + 1;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '⚠️ Could not fix function: % - Error: %', func_name, SQLERRM;
        END;
    END LOOP;
    
    -- If the query-based approach didn't work, try common variants manually
    IF success_count = 0 THEN
        RAISE NOTICE '🔄 Trying manual approach with common signatures...';
        
        -- Try check_and_increment_inline_edits variants
        BEGIN
            ALTER FUNCTION public.check_and_increment_inline_edits() SET search_path FROM CURRENT;
            RAISE NOTICE '✅ Fixed: check_and_increment_inline_edits()';
            success_count := success_count + 1;
        EXCEPTION WHEN OTHERS THEN
            BEGIN
                ALTER FUNCTION public.check_and_increment_inline_edits(uuid,text) SET search_path FROM CURRENT;
                RAISE NOTICE '✅ Fixed: check_and_increment_inline_edits(uuid,text)';
                success_count := success_count + 1;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '⚠️ Could not fix check_and_increment_inline_edits';
            END;
        END;
        
        -- Try log_migration variants
        BEGIN
            ALTER FUNCTION public.log_migration(text,text) SET search_path FROM CURRENT;
            RAISE NOTICE '✅ Fixed: log_migration(text,text)';
            success_count := success_count + 1;
        EXCEPTION WHEN OTHERS THEN
            BEGIN
                ALTER FUNCTION public.log_migration(text) SET search_path FROM CURRENT;
                RAISE NOTICE '✅ Fixed: log_migration(text)';
                success_count := success_count + 1;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '⚠️ Could not fix log_migration';
            END;
        END;
        
        -- Try get_dashboard_analytics variants
        BEGIN
            ALTER FUNCTION public.get_dashboard_analytics(uuid) SET search_path FROM CURRENT;
            RAISE NOTICE '✅ Fixed: get_dashboard_analytics(uuid)';
            success_count := success_count + 1;
        EXCEPTION WHEN OTHERS THEN
            BEGIN
                ALTER FUNCTION public.get_dashboard_analytics() SET search_path FROM CURRENT;
                RAISE NOTICE '✅ Fixed: get_dashboard_analytics()';
                success_count := success_count + 1;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '⚠️ Could not fix get_dashboard_analytics';
            END;
        END;
        
        -- Try calculate_fraud_risk_score variants
        BEGIN
            ALTER FUNCTION public.calculate_fraud_risk_score(uuid) SET search_path FROM CURRENT;
            RAISE NOTICE '✅ Fixed: calculate_fraud_risk_score(uuid)';
            success_count := success_count + 1;
        EXCEPTION WHEN OTHERS THEN
            BEGIN
                ALTER FUNCTION public.calculate_fraud_risk_score(text) SET search_path FROM CURRENT;
                RAISE NOTICE '✅ Fixed: calculate_fraud_risk_score(text)';
                success_count := success_count + 1;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '⚠️ Could not fix calculate_fraud_risk_score';
            END;
        END;
        
        -- Try should_block_registration variants
        BEGIN
            ALTER FUNCTION public.should_block_registration(text) SET search_path FROM CURRENT;
            RAISE NOTICE '✅ Fixed: should_block_registration(text)';
            success_count := success_count + 1;
        EXCEPTION WHEN OTHERS THEN
            BEGIN
                ALTER FUNCTION public.should_block_registration() SET search_path FROM CURRENT;
                RAISE NOTICE '✅ Fixed: should_block_registration()';
                success_count := success_count + 1;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '⚠️ Could not fix should_block_registration';
            END;
        END;
        
        -- Try log_registration_event variants
        BEGIN
            ALTER FUNCTION public.log_registration_event(uuid,text,text,text) SET search_path FROM CURRENT;
            RAISE NOTICE '✅ Fixed: log_registration_event(uuid,text,text,text)';
            success_count := success_count + 1;
        EXCEPTION WHEN OTHERS THEN
            BEGIN
                ALTER FUNCTION public.log_registration_event(uuid,text) SET search_path FROM CURRENT;
                RAISE NOTICE '✅ Fixed: log_registration_event(uuid,text)';
                success_count := success_count + 1;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '⚠️ Could not fix log_registration_event';
            END;
        END;
    END IF;
    
    RAISE NOTICE '🏁 FINAL RESULT: Successfully fixed % out of 6 remaining functions', success_count;
    RAISE NOTICE '🎯 Database security should now be significantly improved!';
END $$; 