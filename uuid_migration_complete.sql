-- ============================================================================
-- COMPREHENSIVE UUID MIGRATION SCRIPT
-- Safe migration from INTEGER/BIGINT IDs to UUID for remaining tables
-- ============================================================================

-- ============================================================================
-- PHASE 1: PREPARATION AND SAFETY CHECKS
-- ============================================================================

-- Create UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a log table to track migration progress
CREATE TABLE IF NOT EXISTS migration_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to log migration steps
CREATE OR REPLACE FUNCTION log_migration(
    table_name TEXT,
    operation TEXT,
    status TEXT,
    message TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO migration_log (table_name, operation, status, message)
    VALUES (table_name, operation, status, message);
END;
$$ LANGUAGE plpgsql;

-- Check current state of tables
DO $$
DECLARE
    sops_id_type TEXT;
    applications_id_type TEXT;
    sop_edits_id_type TEXT;
BEGIN
    -- Check current ID types
    SELECT data_type INTO sops_id_type 
    FROM information_schema.columns 
    WHERE table_name = 'sops' AND column_name = 'id';
    
    SELECT data_type INTO applications_id_type 
    FROM information_schema.columns 
    WHERE table_name = 'applications' AND column_name = 'id';
    
    SELECT data_type INTO sop_edits_id_type 
    FROM information_schema.columns 
    WHERE table_name = 'sop_edits' AND column_name = 'id';
    
    -- Log current state
    PERFORM log_migration('sops', 'check_current_type', 'info', 'Current ID type: ' || COALESCE(sops_id_type, 'table_not_exists'));
    PERFORM log_migration('applications', 'check_current_type', 'info', 'Current ID type: ' || COALESCE(applications_id_type, 'table_not_exists'));
    PERFORM log_migration('sop_edits', 'check_current_type', 'info', 'Current ID type: ' || COALESCE(sop_edits_id_type, 'table_not_exists'));
END $$;

-- ============================================================================
-- PHASE 2: BACKUP EXISTING DATA RELATIONSHIPS
-- ============================================================================

-- Create backup tables to preserve relationships during migration
CREATE TABLE IF NOT EXISTS sops_id_mapping (
    old_id BIGINT,
    new_id UUID DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications_id_mapping (
    old_id BIGINT,
    new_id UUID DEFAULT gen_random_uuid(),
    sop_old_id BIGINT,
    sop_new_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PHASE 3: MIGRATE SOPS TABLE (FOUNDATION TABLE)
-- ============================================================================

DO $$
DECLARE
    sops_id_type TEXT;
    rec RECORD;
BEGIN
    -- Check if sops table exists and needs migration
    SELECT data_type INTO sops_id_type 
    FROM information_schema.columns 
    WHERE table_name = 'sops' AND column_name = 'id';
    
    IF sops_id_type IN ('bigint', 'integer') THEN
        PERFORM log_migration('sops', 'migration_start', 'info', 'Starting UUID migration for sops table');
        
        -- Step 1: Create ID mapping for all existing records
        INSERT INTO sops_id_mapping (old_id)
        SELECT id FROM sops WHERE id IS NOT NULL;
        
        -- Step 2: Add new UUID column
        ALTER TABLE sops ADD COLUMN id_new UUID;
        
        -- Step 3: Populate new UUID column from mapping
        UPDATE sops 
        SET id_new = (SELECT new_id FROM sops_id_mapping WHERE old_id = sops.id);
        
        -- Step 4: Update foreign key references in other tables
        -- Update document_versions table (uses TEXT document_id)
        UPDATE document_versions 
        SET document_id = (
            SELECT new_id::TEXT 
            FROM sops_id_mapping 
            WHERE old_id = document_versions.document_id::BIGINT
        )
        WHERE document_type = 'sop' 
        AND document_id ~ '^[0-9]+$'; -- Only update if it's a numeric string
        
        -- Step 5: Handle applications table if it exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'applications') THEN
            -- Create mapping for applications
            INSERT INTO applications_id_mapping (old_id, sop_old_id)
            SELECT a.id, a.sop_id 
            FROM applications a 
            WHERE a.id IS NOT NULL;
            
            -- Update sop_new_id in mapping
            UPDATE applications_id_mapping 
            SET sop_new_id = (
                SELECT new_id 
                FROM sops_id_mapping 
                WHERE old_id = applications_id_mapping.sop_old_id
            );
        END IF;
        
        -- Step 6: Drop old constraints and indexes
        ALTER TABLE sops DROP CONSTRAINT IF EXISTS sops_pkey CASCADE;
        
        -- Step 7: Drop old ID column and rename new one
        ALTER TABLE sops DROP COLUMN id;
        ALTER TABLE sops RENAME COLUMN id_new TO id;
        
        -- Step 8: Set new primary key
        ALTER TABLE sops ADD PRIMARY KEY (id);
        
        -- Step 9: Set default for new records
        ALTER TABLE sops ALTER COLUMN id SET DEFAULT gen_random_uuid();
        
        PERFORM log_migration('sops', 'migration_complete', 'success', 'SOPs table successfully migrated to UUID');
    ELSE
        PERFORM log_migration('sops', 'migration_skip', 'info', 'SOPs table already uses UUID or does not exist');
    END IF;
END $$;

-- ============================================================================
-- PHASE 4: MIGRATE APPLICATIONS TABLE
-- ============================================================================

DO $$
DECLARE
    applications_id_type TEXT;
    sops_id_type TEXT;
BEGIN
    -- Check if applications table exists and needs migration
    SELECT data_type INTO applications_id_type 
    FROM information_schema.columns 
    WHERE table_name = 'applications' AND column_name = 'id';
    
    SELECT data_type INTO sops_id_type 
    FROM information_schema.columns 
    WHERE table_name = 'sops' AND column_name = 'id';
    
    IF applications_id_type IN ('bigint', 'integer') THEN
        PERFORM log_migration('applications', 'migration_start', 'info', 'Starting UUID migration for applications table');
        
        -- Step 1: Add new UUID columns
        ALTER TABLE applications ADD COLUMN id_new UUID DEFAULT gen_random_uuid();
        ALTER TABLE applications ADD COLUMN sop_id_new UUID;
        
        -- Step 2: Populate new UUID column for id
        UPDATE applications 
        SET id_new = (SELECT new_id FROM applications_id_mapping WHERE old_id = applications.id);
        
        -- Step 3: Populate new sop_id from mapping
        UPDATE applications 
        SET sop_id_new = (
            SELECT new_id 
            FROM sops_id_mapping 
            WHERE old_id = applications.sop_id
        );
        
        -- Step 4: Drop old constraints
        ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_pkey CASCADE;
        ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_sop_id_fkey;
        
        -- Step 5: Drop old columns and rename new ones
        ALTER TABLE applications DROP COLUMN id;
        ALTER TABLE applications DROP COLUMN sop_id;
        ALTER TABLE applications RENAME COLUMN id_new TO id;
        ALTER TABLE applications RENAME COLUMN sop_id_new TO sop_id;
        
        -- Step 6: Set new primary key and foreign key
        ALTER TABLE applications ADD PRIMARY KEY (id);
        ALTER TABLE applications ADD FOREIGN KEY (sop_id) REFERENCES sops(id) ON DELETE CASCADE;
        
        PERFORM log_migration('applications', 'migration_complete', 'success', 'Applications table successfully migrated to UUID');
    ELSE
        PERFORM log_migration('applications', 'migration_skip', 'info', 'Applications table already uses UUID or does not exist');
    END IF;
END $$;

-- ============================================================================
-- PHASE 5: MIGRATE SOP_EDITS TABLE
-- ============================================================================

DO $$
DECLARE
    sop_edits_id_type TEXT;
BEGIN
    -- Check if sop_edits table exists and needs migration
    SELECT data_type INTO sop_edits_id_type 
    FROM information_schema.columns 
    WHERE table_name = 'sop_edits' AND column_name = 'id';
    
    IF sop_edits_id_type IN ('bigint', 'integer') THEN
        PERFORM log_migration('sop_edits', 'migration_start', 'info', 'Starting UUID migration for sop_edits table');
        
        -- Step 1: Add new UUID columns
        ALTER TABLE sop_edits ADD COLUMN id_new UUID DEFAULT gen_random_uuid();
        ALTER TABLE sop_edits ADD COLUMN sop_id_new UUID;
        
        -- Step 2: Update sop_id references
        UPDATE sop_edits 
        SET sop_id_new = (
            SELECT new_id 
            FROM sops_id_mapping 
            WHERE old_id = sop_edits.sop_id
        );
        
        -- Step 3: Drop old constraints
        ALTER TABLE sop_edits DROP CONSTRAINT IF EXISTS sop_edits_pkey CASCADE;
        ALTER TABLE sop_edits DROP CONSTRAINT IF EXISTS sop_edits_sop_id_fkey;
        
        -- Step 4: Drop old columns and rename new ones
        ALTER TABLE sop_edits DROP COLUMN id;
        ALTER TABLE sop_edits DROP COLUMN sop_id;
        ALTER TABLE sop_edits RENAME COLUMN id_new TO id;
        ALTER TABLE sop_edits RENAME COLUMN sop_id_new TO sop_id;
        
        -- Step 5: Set new primary key and foreign key
        ALTER TABLE sop_edits ADD PRIMARY KEY (id);
        ALTER TABLE sop_edits ADD FOREIGN KEY (sop_id) REFERENCES sops(id) ON DELETE CASCADE;
        
        PERFORM log_migration('sop_edits', 'migration_complete', 'success', 'SOP edits table successfully migrated to UUID');
    ELSE
        PERFORM log_migration('sop_edits', 'migration_skip', 'info', 'SOP edits table already uses UUID or does not exist');
    END IF;
END $$;

-- ============================================================================
-- PHASE 6: MIGRATE APPLICATION_STATUS_HISTORY TABLE
-- ============================================================================

DO $$
DECLARE
    status_history_id_type TEXT;
BEGIN
    -- Check if application_status_history table exists and needs migration
    SELECT data_type INTO status_history_id_type 
    FROM information_schema.columns 
    WHERE table_name = 'application_status_history' AND column_name = 'id';
    
    IF status_history_id_type IN ('bigint', 'integer') THEN
        PERFORM log_migration('application_status_history', 'migration_start', 'info', 'Starting UUID migration for application_status_history table');
        
        -- Step 1: Add new UUID columns
        ALTER TABLE application_status_history ADD COLUMN id_new UUID DEFAULT gen_random_uuid();
        ALTER TABLE application_status_history ADD COLUMN application_id_new UUID;
        
        -- Step 2: Update application_id references
        UPDATE application_status_history 
        SET application_id_new = (
            SELECT new_id 
            FROM applications_id_mapping 
            WHERE old_id = application_status_history.application_id
        );
        
        -- Step 3: Drop old constraints
        ALTER TABLE application_status_history DROP CONSTRAINT IF EXISTS application_status_history_pkey CASCADE;
        ALTER TABLE application_status_history DROP CONSTRAINT IF EXISTS application_status_history_application_id_fkey;
        
        -- Step 4: Drop old columns and rename new ones
        ALTER TABLE application_status_history DROP COLUMN id;
        ALTER TABLE application_status_history DROP COLUMN application_id;
        ALTER TABLE application_status_history RENAME COLUMN id_new TO id;
        ALTER TABLE application_status_history RENAME COLUMN application_id_new TO application_id;
        
        -- Step 5: Set new primary key and foreign key
        ALTER TABLE application_status_history ADD PRIMARY KEY (id);
        ALTER TABLE application_status_history ADD FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE;
        
        PERFORM log_migration('application_status_history', 'migration_complete', 'success', 'Application status history table successfully migrated to UUID');
    ELSE
        PERFORM log_migration('application_status_history', 'migration_skip', 'info', 'Application status history table already uses UUID or does not exist');
    END IF;
END $$;

-- ============================================================================
-- PHASE 7: RECREATE INDEXES AND OPTIMIZE
-- ============================================================================

-- Recreate all indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_sops_user_id ON sops(user_id);
CREATE INDEX IF NOT EXISTS idx_sops_created_at ON sops(created_at);
CREATE INDEX IF NOT EXISTS idx_sops_updated_at ON sops(updated_at);
CREATE INDEX IF NOT EXISTS idx_sops_application_deadline ON sops(application_deadline);

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_sop_id ON applications(sop_id);
CREATE INDEX IF NOT EXISTS idx_applications_deadline ON applications(application_deadline);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

CREATE INDEX IF NOT EXISTS idx_sop_edits_sop_id ON sop_edits(sop_id);
CREATE INDEX IF NOT EXISTS idx_sop_edits_user_id ON sop_edits(user_id);
CREATE INDEX IF NOT EXISTS idx_sop_edits_created_at ON sop_edits(created_at);

CREATE INDEX IF NOT EXISTS idx_application_status_history_application_id ON application_status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_application_status_history_user_id ON application_status_history(user_id);

-- ============================================================================
-- PHASE 8: UPDATE FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Update any functions that might reference the old ID types
-- Update the dashboard function to handle UUID IDs
CREATE OR REPLACE FUNCTION get_dashboard_sops(user_uuid UUID)
RETURNS TABLE (
    sop_id UUID,
    university_name TEXT,
    program_name TEXT,
    country TEXT,
    program_type TEXT,
    application_deadline DATE,
    status TEXT,
    word_count INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    days_until_deadline INTEGER,
    deadline_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as sop_id,
        s.university_name,
        s.program_name,
        s.country,
        s.program_type,
        s.application_deadline,
        s.status,
        s.word_count,
        s.created_at,
        s.updated_at,
        CASE 
            WHEN s.application_deadline IS NULL THEN NULL
            ELSE (s.application_deadline - CURRENT_DATE)::INTEGER
        END as days_until_deadline,
        CASE 
            WHEN s.application_deadline IS NULL THEN 'no_deadline'
            WHEN s.application_deadline < CURRENT_DATE THEN 'overdue'
            WHEN s.application_deadline - CURRENT_DATE <= 7 THEN 'urgent'
            WHEN s.application_deadline - CURRENT_DATE <= 30 THEN 'upcoming'
            ELSE 'future'
        END as deadline_status
    FROM sops s 
    WHERE s.user_id = user_uuid
    ORDER BY 
        CASE 
            WHEN s.application_deadline IS NULL THEN 2
            WHEN s.application_deadline < CURRENT_DATE THEN 0
            ELSE 1
        END,
        s.application_deadline ASC NULLS LAST,
        s.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PHASE 9: CLEANUP AND VERIFICATION
-- ============================================================================

-- Clean up mapping tables (optional - you may want to keep these for rollback)
-- DROP TABLE IF EXISTS sops_id_mapping;
-- DROP TABLE IF EXISTS applications_id_mapping;

-- Verify migration success
DO $$
DECLARE
    migration_summary TEXT;
BEGIN
    SELECT string_agg(
        table_name || ': ' || operation || ' - ' || status || 
        CASE WHEN message IS NOT NULL THEN ' (' || message || ')' ELSE '' END, 
        E'\n' ORDER BY created_at
    ) INTO migration_summary
    FROM migration_log 
    WHERE operation IN ('migration_complete', 'migration_skip');
    
    PERFORM log_migration('MIGRATION_SUMMARY', 'final_report', 'success', migration_summary);
    
    RAISE NOTICE 'UUID Migration Complete! Summary:';
    RAISE NOTICE '%', migration_summary;
END $$;

-- Final verification queries
SELECT 'Final verification:' as status;

SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('sops', 'applications', 'sop_edits', 'application_status_history')
    AND column_name = 'id'
ORDER BY table_name;

-- Show migration log
SELECT * FROM migration_log ORDER BY created_at;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Final logging
DO $$
BEGIN
    PERFORM log_migration('FINAL', 'permissions_granted', 'success', 'All permissions updated for UUID schema');
END $$; 