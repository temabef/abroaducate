-- ============================================================
-- Migration 001: Create programs table
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create enums
DO $$ BEGIN
  CREATE TYPE funding_pathway AS ENUM ('automatic', 'program_first', 'funding_first', 'professor_dependent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE application_platform AS ENUM ('direct', 'uni_assist', 'studyinfo', 'parcoursup', 'universitaly', 'ucas', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tuition_label AS ENUM ('free', 'low_tuition', 'paid');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE degree_level AS ENUM ('bachelor', 'master', 'phd', 'short_course');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create programs table
CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY, -- human-readable slug like 'tum-data-engineering'
  
  -- Core info
  program_name TEXT NOT NULL,
  university_name TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Germany',
  city TEXT NOT NULL,
  degree_level degree_level NOT NULL DEFAULT 'master',
  field_of_study TEXT NOT NULL,
  language_of_instruction TEXT NOT NULL DEFAULT 'English',
  
  -- Cost info
  tuition_per_semester NUMERIC(10,2) NOT NULL DEFAULT 0,
  tuition_currency TEXT NOT NULL DEFAULT 'EUR',
  tuition_label tuition_label NOT NULL DEFAULT 'free',
  semester_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  application_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  application_fee_currency TEXT NOT NULL DEFAULT 'EUR',
  has_application_fee BOOLEAN NOT NULL DEFAULT false,
  
  -- Living cost estimates
  living_cost_per_month NUMERIC(10,2) NOT NULL DEFAULT 0,
  blocked_account_per_year NUMERIC(10,2) NOT NULL DEFAULT 11208,
  
  -- Application details
  application_platform application_platform NOT NULL DEFAULT 'direct',
  application_platform_name TEXT, -- if 'other'
  application_platform_url TEXT,
  direct_application_url TEXT,
  application_open_date DATE,
  application_close_date DATE,
  program_start_date DATE,
  program_duration_months INTEGER DEFAULT 24,
  
  -- Intakes (stored as JSONB array of strings like ["Winter", "Summer"])
  intakes JSONB NOT NULL DEFAULT '["Winter"]'::jsonb,
  deadline_summary TEXT,
  
  -- Funding pathway
  funding_pathway funding_pathway NOT NULL DEFAULT 'program_first',
  funding_pathway_explanation TEXT,
  
  -- Requirements
  min_gpa_4_scale NUMERIC(3,2),
  language_requirement TEXT, -- e.g., 'IELTS 6.5' or 'No requirement'
  english_required BOOLEAN NOT NULL DEFAULT true,
  german_required BOOLEAN NOT NULL DEFAULT false,
  work_experience_required BOOLEAN NOT NULL DEFAULT false,
  work_experience_details TEXT,
  relevant_field_keywords JSONB DEFAULT '[]'::jsonb, -- array of strings
  
  -- Eligibility
  open_to_international BOOLEAN NOT NULL DEFAULT true,
  eligible_nationalities TEXT DEFAULT 'all', -- 'all' or comma-separated
  
  -- Affordability notes (JSONB array of strings)
  affordability_notes JSONB DEFAULT '[]'::jsonb,
  
  -- Verification
  last_verified_date DATE,
  verified_by TEXT,
  official_source_url TEXT,
  
  -- Rich Data for AI analysis
  full_description_text TEXT, -- Paste official website description here
  raw_requirements_text TEXT, -- Paste official website requirements here
  rubric_criteria JSONB NOT NULL DEFAULT '{}'::jsonb, -- Structured AI-extracted rules
  application_steps JSONB NOT NULL DEFAULT '[]'::jsonb, -- Sequential timeline for the Clarity Engine
  
  -- Admin
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_programs_country ON programs(country);
CREATE INDEX IF NOT EXISTS idx_programs_field ON programs(field_of_study);
CREATE INDEX IF NOT EXISTS idx_programs_active ON programs(is_active);
CREATE INDEX IF NOT EXISTS idx_programs_tuition ON programs(tuition_label);
CREATE INDEX IF NOT EXISTS idx_programs_pathway ON programs(funding_pathway);

-- 4. Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_programs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS programs_updated_at ON programs;
CREATE TRIGGER programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW
  EXECUTE FUNCTION update_programs_updated_at();

-- 5. RLS Policies
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- Anyone can read active programs (public browse)
CREATE POLICY "Programs are publicly readable"
  ON programs FOR SELECT
  USING (is_active = true);

-- Only service role can insert/update/delete (admin operations via server)
-- No INSERT/UPDATE/DELETE policies for anon/authenticated = only service_role can modify
