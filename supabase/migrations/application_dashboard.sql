-- Application Dashboard Database Schema

-- Enhanced SOPs table
CREATE TABLE IF NOT EXISTS sops (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    university_name TEXT NOT NULL,
    program_name TEXT NOT NULL,
    application_deadline DATE,
    content TEXT NOT NULL,
    original_content TEXT, -- Store original for comparison
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    word_count INTEGER,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'submitted')),
    
    -- Application tracking fields
    application_submitted BOOLEAN DEFAULT FALSE,
    submission_date DATE,
    application_notes TEXT,
    
    -- Metadata
    form_data JSONB, -- Store original form responses
    edit_history JSONB DEFAULT '[]', -- Track edits made
    
    INDEX (user_id),
    INDEX (created_at),
    INDEX (application_deadline)
);

-- Application tracking table (for users applying to multiple programs at same university)
CREATE TABLE IF NOT EXISTS applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    sop_id UUID REFERENCES sops(id) ON DELETE CASCADE,
    university_name TEXT NOT NULL,
    program_name TEXT NOT NULL,
    application_deadline DATE,
    application_fee DECIMAL(10,2),
    requirements_checklist JSONB DEFAULT '[]',
    status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'submitted', 'accepted', 'rejected', 'waitlisted')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    decision_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX (user_id),
    INDEX (application_deadline),
    INDEX (status)
);

-- Text highlights/edits tracking
CREATE TABLE IF NOT EXISTS sop_edits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sop_id UUID REFERENCES sops(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    original_text TEXT NOT NULL,
    edited_text TEXT NOT NULL,
    edit_type TEXT NOT NULL CHECK (edit_type IN ('concise', 'detailed', 'research', 'academic', 'technical')),
    position_start INTEGER NOT NULL,
    position_end INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX (sop_id),
    INDEX (created_at)
);

-- Row Level Security
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_edits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own SOPs" ON sops
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own applications" ON applications
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own edits" ON sop_edits
    FOR ALL USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sops_updated_at BEFORE UPDATE ON sops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 