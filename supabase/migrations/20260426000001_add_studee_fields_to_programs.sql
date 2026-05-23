-- Add missing metadata columns to programs table based on competitor analysis
ALTER TABLE public.programs
ADD COLUMN IF NOT EXISTS intake TEXT,
ADD COLUMN IF NOT EXISTS duration TEXT,
ADD COLUMN IF NOT EXISTS format TEXT,
ADD COLUMN IF NOT EXISTS pace TEXT;
