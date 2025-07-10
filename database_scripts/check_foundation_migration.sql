-- Check if Foundation Database Fix Migration has been run
-- This checks for key improvements from phase_a_foundation_fix.sql

SELECT 'FOUNDATION MIGRATION STATUS CHECK:' as check_type;

-- Check if key columns exist in sops table
SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sops' AND column_name = 'edit_history') 
         THEN '✅ edit_history column exists in sops' 
         ELSE '❌ edit_history column missing in sops' END as edit_history_status,
         
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sops' AND column_name = 'form_data') 
         THEN '✅ form_data column exists in sops' 
         ELSE '❌ form_data column missing in sops' END as form_data_status,
         
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sops' AND column_name = 'is_featured') 
         THEN '✅ is_featured column exists in sops' 
         ELSE '❌ is_featured column missing in sops' END as is_featured_status,
         
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sops' AND column_name = 'priority_level') 
         THEN '✅ priority_level column exists in sops' 
         ELSE '❌ priority_level column missing in sops' END as priority_level_status;

-- Check for performance indexes
SELECT 'PERFORMANCE INDEXES CHECK:' as check_type;

SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sops_user_university') 
         THEN '✅ idx_sops_user_university index exists' 
         ELSE '❌ idx_sops_user_university index missing' END as user_university_index,
         
    CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sops_user_deadline') 
         THEN '✅ idx_sops_user_deadline index exists' 
         ELSE '❌ idx_sops_user_deadline index missing' END as user_deadline_index,
         
    CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sops_search') 
         THEN '✅ idx_sops_search index exists (full-text search)' 
         ELSE '❌ idx_sops_search index missing (full-text search)' END as search_index;

-- Check for utility functions
SELECT 'UTILITY FUNCTIONS CHECK:' as check_type;

SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_user_sop_stats') 
         THEN '✅ get_user_sop_stats function exists' 
         ELSE '❌ get_user_sop_stats function missing' END as sop_stats_function,
         
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_user_dashboard_data') 
         THEN '✅ get_user_dashboard_data function exists' 
         ELSE '❌ get_user_dashboard_data function missing' END as dashboard_function;

-- Check if applications table has proper structure
SELECT 'APPLICATIONS TABLE CHECK:' as check_type;

SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'applications') 
         THEN '✅ applications table exists' 
         ELSE '❌ applications table missing' END as applications_table,
         
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'priority_ranking') 
         THEN '✅ priority_ranking column exists in applications' 
         ELSE '❌ priority_ranking column missing in applications' END as priority_ranking_status;

-- Check for PostgreSQL extensions
SELECT 'POSTGRESQL EXTENSIONS CHECK:' as check_type;

SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') 
         THEN '✅ pg_trgm extension enabled (for full-text search)' 
         ELSE '❌ pg_trgm extension missing (for full-text search)' END as trgm_extension;

-- Final recommendation
SELECT 'MIGRATION RECOMMENDATION:' as check_type;

SELECT 
    CASE 
        WHEN (
            EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sops' AND column_name = 'edit_history') AND
            EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sops' AND column_name = 'form_data') AND
            EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sops_user_university') AND
            EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_user_sop_stats')
        ) THEN '✅ FOUNDATION MIGRATION ALREADY COMPLETED - All migrations done! Ready for production!'
        WHEN (
            EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sops' AND column_name = 'edit_history') OR
            EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sops_user_university')
        ) THEN '⚠️ PARTIAL FOUNDATION MIGRATION - Some improvements exist, others missing'
        ELSE '❌ FOUNDATION MIGRATION NOT RUN - Run database_migrations/phase_a_foundation_fix.sql'
    END as final_recommendation; 