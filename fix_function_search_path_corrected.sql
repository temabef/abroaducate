-- Fix Function Search Path Mutable warnings (CORRECTED)
-- This addresses the security warnings about functions with mutable search_path

-- Fix functions by setting search_path to prevent security issues
DO $$
DECLARE
    func_name TEXT;
    func_names TEXT[] := ARRAY[
        'get_total_users_count()',
        'get_user_statistics()',
        'get_content_statistics()',
        'is_version_history_allowed(uuid,text)',
        'get_inline_editing_usage(uuid)',
        'check_and_increment_inline_edits(uuid,text)',
        'get_current_user_admin_role()',
        'get_admin_users_emergency()',
        'can_manage_admins_nuclear()',
        'get_version_usage_stats(uuid,text)',
        'cleanup_old_versions(uuid,text,uuid)',
        'log_migration(text,text)',
        'get_dashboard_sops(uuid)',
        'get_dashboard_analytics(uuid)',
        'is_admin()',
        'get_admin_users_nuclear()',
        'get_admin_users()',
        'cleanup_expired_versions(uuid)',
        'auto_cleanup_versions()',
        'get_version_limits(text)',
        'calculate_fraud_risk_score(uuid)',
        'should_block_registration(text)',
        'log_registration_event(uuid,text,text,text)'
    ];
BEGIN
    -- Loop through each function and fix the search_path
    FOREACH func_name IN ARRAY func_names
    LOOP
        BEGIN
            -- Attempt to alter the function to set a secure search_path
            EXECUTE format('ALTER FUNCTION public.%s SET search_path FROM CURRENT', func_name);
            RAISE NOTICE '✅ Fixed search_path for function: %', func_name;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '⚠️ Could not fix function: % - Error: %', func_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '🔧 Function search_path security fix complete - 23 functions processed';
END $$; 