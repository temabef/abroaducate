-- Add new columns for tracking additional AI feature usage
ALTER TABLE user_usage
ADD COLUMN IF NOT EXISTS reviews_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS text_enhancements_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS word_optimizations_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS grammar_checks_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS plagiarism_checks_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS tone_analysis_used integer DEFAULT 0;

-- Migrate existing data from ai_improvements_used to specific columns
UPDATE user_usage
SET reviews_used = ai_improvements_used,
    text_enhancements_used = ai_improvements_used,
    word_optimizations_used = ai_improvements_used,
    grammar_checks_used = ai_improvements_used,
    tone_analysis_used = ai_improvements_used
WHERE ai_improvements_used IS NOT NULL;

-- Drop the old column after migration (optional, comment out if you want to keep it)
-- ALTER TABLE user_usage DROP COLUMN IF EXISTS ai_improvements_used; 