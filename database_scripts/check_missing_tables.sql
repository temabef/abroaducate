-- Check if Missing Tables Migration has already been run
-- This query checks for the main tables that would be created by missing_tables_migration.sql

SELECT 
    -- Check for main tables
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cover_letters') 
         THEN '✅ cover_letters table exists' 
         ELSE '❌ cover_letters table missing' END as cover_letters_status,
         
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'personal_statements') 
         THEN '✅ personal_statements table exists' 
         ELSE '❌ personal_statements table missing' END as personal_statements_status,
         
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cover_letter_analytics') 
         THEN '✅ cover_letter_analytics table exists' 
         ELSE '❌ cover_letter_analytics table missing' END as cover_letter_analytics_status,
         
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'personal_statement_analytics') 
         THEN '✅ personal_statement_analytics table exists' 
         ELSE '❌ personal_statement_analytics table missing' END as personal_statement_analytics_status,
         
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cover_letter_edits') 
         THEN '✅ cover_letter_edits table exists' 
         ELSE '❌ cover_letter_edits table missing' END as cover_letter_edits_status,
         
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'personal_statement_edits') 
         THEN '✅ personal_statement_edits table exists' 
         ELSE '❌ personal_statement_edits table missing' END as personal_statement_edits_status;

-- Check key columns in cover_letters table (if it exists)
SELECT 'COVER LETTERS TABLE STRUCTURE:' as check_type;

SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cover_letters') THEN
        (SELECT string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position)
         FROM information_schema.columns 
         WHERE table_name = 'cover_letters')
    ELSE 'Table does not exist'
    END as cover_letters_columns;

-- Check key columns in personal_statements table (if it exists)  
SELECT 'PERSONAL STATEMENTS TABLE STRUCTURE:' as check_type;

SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'personal_statements') THEN
        (SELECT string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position)
         FROM information_schema.columns 
         WHERE table_name = 'personal_statements')
    ELSE 'Table does not exist'
    END as personal_statements_columns;

-- Count existing records (if tables exist)
SELECT 'RECORD COUNTS:' as check_type;

SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cover_letters') 
         THEN (SELECT 'cover_letters: ' || COUNT(*)::text FROM cover_letters)
         ELSE 'cover_letters: table missing' END as cover_letters_count,
         
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'personal_statements') 
         THEN (SELECT 'personal_statements: ' || COUNT(*)::text FROM personal_statements)
         ELSE 'personal_statements: table missing' END as personal_statements_count;

-- Summary assessment
SELECT 'MIGRATION STATUS SUMMARY:' as check_type;

SELECT 
    CASE 
        WHEN (
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cover_letters') AND
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'personal_statements') AND
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cover_letter_analytics') AND
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'personal_statement_analytics')
        ) THEN '✅ MISSING TABLES MIGRATION ALREADY COMPLETED - Skip this migration'
        WHEN (
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cover_letters') OR
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'personal_statements')
        ) THEN '⚠️ PARTIAL MIGRATION - Some tables exist, others missing - May need manual cleanup'
        ELSE '❌ MIGRATION NOT RUN - Safe to run missing_tables_migration.sql'
    END as migration_recommendation; 