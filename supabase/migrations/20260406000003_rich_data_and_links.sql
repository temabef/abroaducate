-- 1. Add Rich Data fields to scholarships table
ALTER TABLE public.scholarships 
ADD COLUMN IF NOT EXISTS full_description_text TEXT,
ADD COLUMN IF NOT EXISTS raw_requirements_text TEXT,
ADD COLUMN IF NOT EXISTS winning_strategy_content JSONB;

-- 2. Create the program_scholarships join table
CREATE TABLE IF NOT EXISTS public.program_scholarships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    program_id TEXT REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
    scholarship_id UUID REFERENCES public.scholarships(id) ON DELETE CASCADE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(program_id, scholarship_id)
);

-- 3. Enable RLS and setup policies for the join table
ALTER TABLE public.program_scholarships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view program_scholarships" ON public.program_scholarships;
CREATE POLICY "Anyone can view program_scholarships" 
ON public.program_scholarships FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage program_scholarships" ON public.program_scholarships;
CREATE POLICY "Admins can manage program_scholarships" 
ON public.program_scholarships FOR ALL USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);
