-- ============================================================
-- Migration: scholarship matching system
-- RUN THIS ONCE in Supabase SQL Editor (Dashboard → SQL Editor → paste & run).
--
-- Adds:
--   1. tuition_tier enum + programs.tuition_tier column (backfilled)
--   2. program_scholarship_matches precomputed table + indexes + RLS
--   3. scholarships.deadline_recurrence column
--   4. Helper view: public_program_scholarship_matches
--
-- Safe to re-run: all operations are idempotent.
-- ============================================================

-- 1. Tuition tier enum on programs
DO $$ BEGIN
  CREATE TYPE tuition_tier AS ENUM ('zero_tuition', 'low_tuition', 'scholarship_funded', 'paid');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS tuition_tier tuition_tier;

-- Backfill tiers based on current tuition values. scholarship_funded is set
-- later by the matcher when the programme has at least one strong scholarship
-- match that covers tuition.
UPDATE programs
SET tuition_tier = CASE
  WHEN COALESCE(tuition_per_semester, 0) = 0 THEN 'zero_tuition'::tuition_tier
  WHEN COALESCE(tuition_per_semester, 0) <= 5000 THEN 'low_tuition'::tuition_tier
  ELSE 'paid'::tuition_tier
END
WHERE tuition_tier IS NULL;

CREATE INDEX IF NOT EXISTS idx_programs_tuition_tier ON programs(tuition_tier);

-- 2. program_scholarship_matches: precomputed matches
CREATE TABLE IF NOT EXISTS program_scholarship_matches (
  program_id      TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  scholarship_id  UUID NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
  score           INTEGER NOT NULL DEFAULT 0,
  match_rules     JSONB NOT NULL DEFAULT '[]'::jsonb,
  covers          TEXT[] NOT NULL DEFAULT '{}'::text[],
  rank_in_program INTEGER,
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (program_id, scholarship_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_program     ON program_scholarship_matches(program_id);
CREATE INDEX IF NOT EXISTS idx_matches_scholarship ON program_scholarship_matches(scholarship_id);
CREATE INDEX IF NOT EXISTS idx_matches_score       ON program_scholarship_matches(program_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_matches_rank        ON program_scholarship_matches(program_id, rank_in_program);

ALTER TABLE program_scholarship_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Matches are publicly readable" ON program_scholarship_matches;
CREATE POLICY "Matches are publicly readable"
  ON program_scholarship_matches FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can manage matches" ON program_scholarship_matches;
CREATE POLICY "Service role can manage matches"
  ON program_scholarship_matches FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 3. deadline_recurrence on scholarships
ALTER TABLE scholarships
  ADD COLUMN IF NOT EXISTS deadline_recurrence TEXT;

-- 4. Join view for the frontend
CREATE OR REPLACE VIEW public_program_scholarship_matches AS
SELECT
  m.program_id,
  m.scholarship_id,
  m.score,
  m.match_rules,
  m.covers,
  m.rank_in_program,
  s.title        AS scholarship_title,
  s.provider     AS scholarship_provider,
  s.amount       AS scholarship_amount,
  s.deadline     AS scholarship_deadline,
  s.location     AS scholarship_location,
  s.type         AS scholarship_type,
  s.website      AS scholarship_website,
  s.level        AS scholarship_level,
  s.field        AS scholarship_field,
  s.funding_category,
  s.description  AS scholarship_description
FROM program_scholarship_matches m
JOIN scholarships s ON s.id = m.scholarship_id
WHERE s.is_active = true;

GRANT SELECT ON public_program_scholarship_matches TO anon, authenticated, service_role;

-- Sanity counts after apply
SELECT
  (SELECT COUNT(*) FROM programs WHERE tuition_tier IS NOT NULL) AS programs_with_tier,
  (SELECT COUNT(*) FROM programs WHERE tuition_tier = 'zero_tuition') AS zero_tuition,
  (SELECT COUNT(*) FROM programs WHERE tuition_tier = 'low_tuition')  AS low_tuition,
  (SELECT COUNT(*) FROM programs WHERE tuition_tier = 'paid')         AS paid;
