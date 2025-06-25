-- Create a non-RLS alternative table for document checklist progress
-- This is a workaround for RLS issues

-- Create a new table without RLS
CREATE TABLE IF NOT EXISTS public.simple_checklist_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    checklist_id UUID NOT NULL,
    completed_items JSONB DEFAULT '[]',
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    notes TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: one progress record per user per checklist
    CONSTRAINT simple_checklist_unique UNIQUE (user_id, checklist_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_simple_progress_user_id ON public.simple_checklist_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_simple_progress_checklist_id ON public.simple_checklist_progress(checklist_id);

-- Grant permissions but DON'T enable RLS
GRANT ALL ON public.simple_checklist_progress TO authenticated;
GRANT ALL ON public.simple_checklist_progress TO service_role;

-- Create updated_at trigger
CREATE TRIGGER update_simple_progress_updated_at 
BEFORE UPDATE ON public.simple_checklist_progress
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 