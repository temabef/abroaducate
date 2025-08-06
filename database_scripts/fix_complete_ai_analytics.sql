    -- ========================================
    -- FIX COMPLETE AI ANALYTICS
    -- ========================================
    -- This updates the analytics function to include ALL AI features being used

    -- Drop existing function first (to handle return type changes)
    DROP FUNCTION IF EXISTS get_dashboard_analytics();

    -- Create the analytics function with all AI features
    CREATE OR REPLACE FUNCTION get_dashboard_analytics()
    RETURNS TABLE (
        total_users BIGINT,
        active_users_30d BIGINT,
        new_users_30d BIGINT,
        free_users BIGINT,
        professional_users BIGINT,
        elite_users BIGINT,
        total_premium_users BIGINT,
        total_sops BIGINT,
        total_cover_letters BIGINT,
        total_personal_statements BIGINT,
        total_documents BIGINT,
        total_ai_usage BIGINT,
        reviews_count BIGINT,
        grammar_checks_count BIGINT,
        tone_analysis_count BIGINT,
        plagiarism_checks_count BIGINT,
        text_enhancements_count BIGINT,
        word_optimizations_count BIGINT,
        university_matching_count BIGINT,
        visa_interview_questions_count BIGINT,
        sop_generation_count BIGINT,
        cold_email_generation_count BIGINT,
        document_checklists_count BIGINT,
        cover_letter_generation_count BIGINT,
        academic_cv_generation_count BIGINT,
        personal_statement_generation_count BIGINT,
        inline_edits_count BIGINT,
        total_scholarships BIGINT,
        total_applications BIGINT,
        admin_users_count BIGINT
    ) AS $$
    DECLARE
        thirty_days_ago TIMESTAMPTZ := NOW() - INTERVAL '30 days';
        total_users_count BIGINT := 0;
        active_count BIGINT := 0;
        new_count BIGINT := 0;
        professional_count BIGINT := 0;
        elite_count BIGINT := 0;
        free_count BIGINT := 0;
        sops_count BIGINT := 0;
        cover_letters_count BIGINT := 0;
        personal_statements_count BIGINT := 0;
        scholarships_count BIGINT := 0;
        applications_count BIGINT := 0;
        admin_count BIGINT := 0;
        
        -- AI usage counts - all features
        total_ai_usage_count BIGINT := 0;
        reviews_count_val BIGINT := 0;
        grammar_checks_count_val BIGINT := 0;
        tone_analysis_count_val BIGINT := 0;
        plagiarism_checks_count_val BIGINT := 0;
        text_enhancements_count_val BIGINT := 0;
        word_optimizations_count_val BIGINT := 0;
        university_matching_count_val BIGINT := 0;
        visa_interview_questions_count_val BIGINT := 0;
        sop_generation_count_val BIGINT := 0;
        cold_email_generation_count_val BIGINT := 0;
        document_checklists_count_val BIGINT := 0;
        cover_letter_generation_count_val BIGINT := 0;
        academic_cv_generation_count_val BIGINT := 0;
        personal_statement_generation_count_val BIGINT := 0;
        inline_edits_count_val BIGINT := 0;
    BEGIN
        -- Get total users from auth.users (most reliable)
        SELECT COUNT(*) INTO total_users_count FROM auth.users;
        
        -- Get subscription counts - properly categorize all plan types
        SELECT 
            COUNT(*) FILTER (WHERE plan_type IN ('professional', 'basic') AND status = 'active'),
            COUNT(*) FILTER (WHERE plan_type IN ('elite', 'pro') AND status = 'active')
        INTO professional_count, elite_count
        FROM user_subscriptions;
        
        -- Calculate free users correctly:
        -- Free users = Users with no subscriptions + Users with 'free' plan type subscriptions
        SELECT 
            COUNT(*) FILTER (WHERE us.id IS NULL) + 
            COUNT(*) FILTER (WHERE us.plan_type = 'free' AND us.status = 'active')
        INTO free_count
        FROM auth.users u
        LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active';
        
        -- Get active users (who created documents in last 30 days)
        SELECT COUNT(DISTINCT user_id) INTO active_count
        FROM (
            SELECT user_id FROM sops WHERE created_at >= thirty_days_ago
            UNION
            SELECT user_id FROM cover_letters WHERE created_at >= thirty_days_ago
            UNION 
            SELECT user_id FROM personal_statements WHERE created_at >= thirty_days_ago
        ) active_users_union;
        
        -- Get new users (last 30 days)
        SELECT COUNT(*) INTO new_count 
        FROM auth.users 
        WHERE created_at >= thirty_days_ago;
        
        -- Get document counts
        SELECT COUNT(*) INTO sops_count FROM sops;
        SELECT COUNT(*) INTO cover_letters_count FROM cover_letters;
        SELECT COUNT(*) INTO personal_statements_count FROM personal_statements;
        
        -- Get scholarship data
        SELECT COUNT(*) INTO scholarships_count FROM scholarships;
        SELECT COUNT(*) INTO applications_count FROM scholarship_applications;
        
        -- Get admin count
        SELECT COUNT(*) INTO admin_count FROM admin_users;
        
        -- Get AI usage breakdown (if table exists)
        BEGIN
            -- Total AI usage
            SELECT COUNT(*) INTO total_ai_usage_count FROM ai_usage_log;
            
            -- Breakdown by feature type - ALL features
            SELECT COUNT(*) INTO reviews_count_val 
            FROM ai_usage_log 
            WHERE feature_type IN ('reviews', 'sop_review', 'review');
            
            SELECT COUNT(*) INTO grammar_checks_count_val 
            FROM ai_usage_log 
            WHERE feature_type IN ('grammar_check', 'grammar_checks', 'grammar');
            
            SELECT COUNT(*) INTO tone_analysis_count_val 
            FROM ai_usage_log 
            WHERE feature_type IN ('tone_analysis', 'tone_analyses', 'tone');
            
            SELECT COUNT(*) INTO plagiarism_checks_count_val 
            FROM ai_usage_log 
            WHERE feature_type IN ('plagiarism_check', 'plagiarism_checks', 'plagiarism');
            
            SELECT COUNT(*) INTO text_enhancements_count_val 
            FROM ai_usage_log 
            WHERE feature_type IN ('text_enhancement', 'text_enhancements', 'enhancement');
            
            SELECT COUNT(*) INTO word_optimizations_count_val 
            FROM ai_usage_log 
            WHERE feature_type IN ('word_optimization', 'word_optimizations', 'optimization');
            
            -- New features we discovered
            SELECT COUNT(*) INTO university_matching_count_val 
            FROM ai_usage_log 
            WHERE feature_type = 'university_matching';
            
            SELECT COUNT(*) INTO visa_interview_questions_count_val 
            FROM ai_usage_log 
            WHERE feature_type = 'visa_interview_questions';
            
            SELECT COUNT(*) INTO sop_generation_count_val 
            FROM ai_usage_log 
            WHERE feature_type = 'sop_generation';
            
            SELECT COUNT(*) INTO cold_email_generation_count_val 
            FROM ai_usage_log 
            WHERE feature_type = 'cold_email_generation';
            
            SELECT COUNT(*) INTO document_checklists_count_val 
            FROM ai_usage_log 
            WHERE feature_type = 'document_checklists';
            
            SELECT COUNT(*) INTO cover_letter_generation_count_val 
            FROM ai_usage_log 
            WHERE feature_type = 'cover_letter_generation';
            
            SELECT COUNT(*) INTO academic_cv_generation_count_val 
            FROM ai_usage_log 
            WHERE feature_type = 'academic_cv_generation';
            
            SELECT COUNT(*) INTO personal_statement_generation_count_val 
            FROM ai_usage_log 
            WHERE feature_type = 'personal_statement_generation';
            
            SELECT COUNT(*) INTO inline_edits_count_val 
            FROM ai_usage_log 
            WHERE feature_type = 'inline_edits';
            
        EXCEPTION
            WHEN undefined_table THEN
                -- If ai_usage_log doesn't exist, set all AI counts to 0
                total_ai_usage_count := 0;
                reviews_count_val := 0;
                grammar_checks_count_val := 0;
                tone_analysis_count_val := 0;
                plagiarism_checks_count_val := 0;
                text_enhancements_count_val := 0;
                word_optimizations_count_val := 0;
                university_matching_count_val := 0;
                visa_interview_questions_count_val := 0;
                sop_generation_count_val := 0;
                cold_email_generation_count_val := 0;
                document_checklists_count_val := 0;
                cover_letter_generation_count_val := 0;
                academic_cv_generation_count_val := 0;
                personal_statement_generation_count_val := 0;
                inline_edits_count_val := 0;
        END;
        
        -- Return the data
        RETURN QUERY
        SELECT 
            total_users_count,
            active_count,
            new_count,
            free_count,
            professional_count,
            elite_count,
            professional_count + elite_count as total_premium,
            sops_count,
            cover_letters_count,
            personal_statements_count,
            sops_count + cover_letters_count + personal_statements_count as total_docs,
            total_ai_usage_count,
            reviews_count_val,
            grammar_checks_count_val,
            tone_analysis_count_val,
            plagiarism_checks_count_val,
            text_enhancements_count_val,
            word_optimizations_count_val,
            university_matching_count_val,
            visa_interview_questions_count_val,
            sop_generation_count_val,
            cold_email_generation_count_val,
            document_checklists_count_val,
            cover_letter_generation_count_val,
            academic_cv_generation_count_val,
            personal_statement_generation_count_val,
            inline_edits_count_val,
            scholarships_count,
            applications_count,
            admin_count;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Grant permissions
    GRANT EXECUTE ON FUNCTION get_dashboard_analytics() TO authenticated;

    -- Test the updated function
    SELECT '=== TESTING COMPLETE AI ANALYTICS ===' as status;
    SELECT * FROM get_dashboard_analytics();

    -- Show the complete breakdown
    SELECT '=== COMPLETE AI USAGE BREAKDOWN ===' as description;
    WITH complete_analytics AS (
        SELECT * FROM get_dashboard_analytics()
    )
    SELECT 
        'Complete Analytics:' as category,
        total_users,
        total_ai_usage,
        reviews_count,
        grammar_checks_count,
        tone_analysis_count,
        plagiarism_checks_count,
        text_enhancements_count,
        word_optimizations_count,
        university_matching_count,
        visa_interview_questions_count,
        sop_generation_count,
        cold_email_generation_count,
        document_checklists_count,
        cover_letter_generation_count,
        academic_cv_generation_count,
        personal_statement_generation_count,
        inline_edits_count,
        (reviews_count + grammar_checks_count + tone_analysis_count + plagiarism_checks_count + 
        text_enhancements_count + word_optimizations_count + university_matching_count + 
        visa_interview_questions_count + sop_generation_count + cold_email_generation_count + 
        document_checklists_count + cover_letter_generation_count + academic_cv_generation_count + 
        personal_statement_generation_count + inline_edits_count) as calculated_total
    FROM complete_analytics; 