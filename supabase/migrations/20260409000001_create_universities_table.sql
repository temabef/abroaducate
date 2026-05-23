-- Create universities table
CREATE TABLE IF NOT EXISTS public.universities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    city TEXT NOT NULL,
    type TEXT, -- e.g., 'Technical University', 'Public Research', 'Applied Sciences'
    tuition_type TEXT, -- e.g., 'Zero Tuition', 'Low Tuition State'
    acceptance_rate TEXT,
    global_rank TEXT,
    living_cost_estimate TEXT,
    description TEXT,
    hero_image_url TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_universities_updated_at ON public.universities;
CREATE TRIGGER update_universities_updated_at
  BEFORE UPDATE ON public.universities
  FOR EACH ROW EXECUTE FUNCTION public.update_upi_updated_at();

-- Add foreign key to programs table
ALTER TABLE public.programs 
ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL;

-- Enable RLS on universities table
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read universities
DROP POLICY IF EXISTS "Anyone can read universities" ON public.universities;
CREATE POLICY "Anyone can read universities" 
ON public.universities FOR SELECT USING (true);

-- Restrict write/update/delete to admins only
DROP POLICY IF EXISTS "Admins can insert universities" ON public.universities;
CREATE POLICY "Admins can insert universities" 
ON public.universities FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

DROP POLICY IF EXISTS "Admins can update universities" ON public.universities;
CREATE POLICY "Admins can update universities" 
ON public.universities FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

DROP POLICY IF EXISTS "Admins can delete universities" ON public.universities;
CREATE POLICY "Admins can delete universities" 
ON public.universities FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);
