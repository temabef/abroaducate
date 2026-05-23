-- ============================================================
-- Migration: Create user_program_interactions table
-- This is the core table for the Clarity Engine Strategy Board.
-- Each row = one user tracking one program.
-- Run this in Supabase SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS user_program_interactions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id    TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,

  -- Status in the application pipeline
  status        TEXT NOT NULL DEFAULT 'saved'
                CHECK (status IN ('saved', 'strategy', 'ready', 'submitted')),

  -- AI-computed fit score (0–100), populated after running the Fit Check
  match_score   INTEGER,

  -- Saved workspace state (document slots, notes, etc.)
  workspace_data JSONB DEFAULT NULL,

  -- User notes on this program
  notes         TEXT,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One row per user per program; this is what makes the upsert work
  UNIQUE (user_id, program_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_upi_user_id   ON user_program_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_upi_program_id ON user_program_interactions(program_id);
CREATE INDEX IF NOT EXISTS idx_upi_status     ON user_program_interactions(status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_upi_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS upi_updated_at ON user_program_interactions;
CREATE TRIGGER upi_updated_at
  BEFORE UPDATE ON user_program_interactions
  FOR EACH ROW EXECUTE FUNCTION update_upi_updated_at();

-- RLS
ALTER TABLE user_program_interactions ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own rows
CREATE POLICY "Users can read own program interactions"
  ON user_program_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own program interactions"
  ON user_program_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own program interactions"
  ON user_program_interactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own program interactions"
  ON user_program_interactions FOR DELETE
  USING (auth.uid() = user_id);
