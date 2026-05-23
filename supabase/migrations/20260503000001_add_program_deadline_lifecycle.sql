-- Adds explicit deadline lifecycle fields for future admin/reporting workflows.
-- The app can already compute lifecycle from application_close_date and
-- deadline_summary; these columns make that state queryable once this
-- migration is applied.

DO $$ BEGIN
  CREATE TYPE program_deadline_status AS ENUM (
    'verified',
    'estimated',
    'rolling',
    'not_published',
    'expired',
    'unknown'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.programs
ADD COLUMN IF NOT EXISTS deadline_status program_deadline_status NOT NULL DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS deadline_cycle_year INTEGER,
ADD COLUMN IF NOT EXISTS deadline_last_evaluated_date DATE,
ADD COLUMN IF NOT EXISTS deadline_next_refresh_due DATE,
ADD COLUMN IF NOT EXISTS deadline_display_label TEXT;

CREATE INDEX IF NOT EXISTS idx_programs_deadline_status
ON public.programs(deadline_status);

CREATE INDEX IF NOT EXISTS idx_programs_deadline_next_refresh_due
ON public.programs(deadline_next_refresh_due);
