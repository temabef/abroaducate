-- Phase 3A: Document Versions Table
-- Supports version history for all document types

CREATE TABLE IF NOT EXISTS public.document_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('cover_letter', 'personal_statement', 'sop', 'cv')),
    
    -- Version Information
    version_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    changes_summary TEXT,
    word_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Unique constraint for version numbers per document
    CONSTRAINT document_versions_unique UNIQUE (document_id, document_type, version_number)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON public.document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_type ON public.document_versions(document_type);
CREATE INDEX IF NOT EXISTS idx_document_versions_created_at ON public.document_versions(created_at DESC);

-- Enable RLS
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can manage versions of their own documents" ON public.document_versions;
CREATE POLICY "Users can manage versions of their own documents" ON public.document_versions
    FOR ALL USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Grant permissions
GRANT ALL ON public.document_versions TO authenticated;

-- Comments
COMMENT ON TABLE public.document_versions IS 'Phase 3A: Document version history for all document types'; 