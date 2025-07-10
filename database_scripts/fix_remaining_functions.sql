-- Fix the remaining 6 functions with search_path issues
-- These functions may have different parameter signatures

DO $$
DECLARE
    function_variants TEXT[][] := ARRAY[
        -- check_and_increment_inline_edits variants
        ARRAY['check_and_increment_inline_edits()', 'check_and_increment_inline_edits(uuid)', 'check_and_increment_inline_edits(uuid,text)', 'check_and_increment_inline_edits(uuid,text,integer)'],
        
        -- log_migration variants  
        ARRAY['log_migration()', 'log_migration(text)', 'log_migration(text,text)', 'log_migration(text,text,text)'],
        
        -- get_dashboard_analytics variants
        ARRAY['get_dashboard_analytics()', 'get_dashboard_analytics(uuid)', 'get_dashboard_analytics(uuid,timestamp)', 'get_dashboard_analytics(uuid,text)'],
        
        -- calculate_fraud_risk_score variants
        ARRAY['calculate_fraud_risk_score()', 'calculate_fraud_risk_score(uuid)', 'calculate_fraud_risk_score(text)', 'calculate_fraud_risk_score(uuid,text)'],
        
        -- should_block_registration variants
        ARRAY['should_block_registration()', 'should_block_registration(text)', 'should_block_registration(text,text)', 'should_block_registration(uuid,text)'],
        
        -- log_registration_event variants
        ARRAY['log_registration_event()', 'log_registration_event(uuid)', 'log_registration_event(uuid,text)', 'log_registration_event(uuid,text,text)', 'log_registration_event(uuid,text,text,text)']
    ];
    
    variant_array TEXT[];
    func_signature TEXT;
    success_count INTEGER := 0;
BEGIN
    -- Try each function with multiple parameter signature variants
    FOREACH variant_array SLICE 1 IN ARRAY function_variants
    LOOP
        FOREACH func_signature IN ARRAY variant_array
        LOOP
            BEGIN
                EXECUTE format('ALTER FUNCTION public.%s SET search_path FROM CURRENT', func_signature);
                RAISE NOTICE '✅ Fixed search_path for function: %', func_signature;
                success_count := success_count + 1;
                EXIT; -- Exit inner loop if successful
            EXCEPTION
                WHEN OTHERS THEN
                    -- Try next variant
                    CONTINUE;
            END;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '🎯 Successfully fixed % remaining functions', success_count;
    
    -- If some functions still don't work, let's try a different approach
    IF success_count < 6 THEN
        RAISE NOTICE '🔍 Trying alternative approach for remaining functions...';
        
        -- Alternative: Find exact function signatures from pg_proc
        FOR func_signature IN 
            SELECT 
                p.proname || '(' || 
                COALESCE(pg_get_function_identity_arguments(p.oid), '') || ')'
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public'
            AND p.proname IN ('check_and_increment_inline_edits', 'log_migration', 'get_dashboard_analytics', 'calculate_fraud_risk_score', 'should_block_registration', 'log_registration_event')
        LOOP
            BEGIN
                EXECUTE format('ALTER FUNCTION public.%s SET search_path FROM CURRENT', func_signature);
                RAISE NOTICE '✅ Fixed search_path for function (alt method): %', func_signature;
                success_count := success_count + 1;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE '⚠️ Could not fix function: % - Error: %', func_signature, SQLERRM;
            END;
        END LOOP;
    END IF;
    
    RAISE NOTICE '🏁 Final result: Fixed search_path for functions. Total successes: %', success_count;
END $$; 