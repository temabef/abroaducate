-- =====================================================
-- UNIFIED PROFILE MIGRATION
-- Extends existing user_quick_profile for platform-wide use
-- =====================================================

-- First, ensure the base table exists (it should from existing scholarship system)
CREATE TABLE IF NOT EXISTS user_quick_profile (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    degree_level TEXT NOT NULL CHECK (degree_level IN ('undergraduate', 'masters', 'phd', 'graduate')),
    field_of_study TEXT NOT NULL,
    preferred_countries TEXT[] NOT NULL DEFAULT '{}',
    gpa_range TEXT NOT NULL CHECK (gpa_range IN ('<2.5', '2.5-3.0', '3.0-3.5', '3.5-4.0')),
    scholarship_priority TEXT NOT NULL CHECK (scholarship_priority IN ('essential', 'high', 'moderate', 'low')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new fields for unified profile (extending existing scholarship profile)
ALTER TABLE user_quick_profile 
ADD COLUMN IF NOT EXISTS target_intake TEXT, -- "Fall 2025", "Spring 2026", etc.
ADD COLUMN IF NOT EXISTS budget_range TEXT CHECK (budget_range IN ('0-20k', '20k-50k', '50k-100k', '100k+')),
ADD COLUMN IF NOT EXISTS current_gpa_value DECIMAL(4,2), -- Actual GPA value (e.g., 3.7)
ADD COLUMN IF NOT EXISTS current_gpa_scale TEXT, -- "4.0", "5.0", "100", etc.
ADD COLUMN IF NOT EXISTS standardized_gpa_4_scale DECIMAL(4,2), -- Auto-calculated 4.0 scale
ADD COLUMN IF NOT EXISTS profile_completion_score INTEGER DEFAULT 0 CHECK (profile_completion_score >= 0 AND profile_completion_score <= 100),
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS visa_preferences JSONB DEFAULT '{}', -- Future: visa requirements, interview prep preferences
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"weekly_digest": true, "deadline_reminders": true, "scholarship_alerts": true}';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_quick_profile_onboarding ON user_quick_profile(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_user_quick_profile_completion ON user_quick_profile(profile_completion_score);
CREATE INDEX IF NOT EXISTS idx_user_quick_profile_budget ON user_quick_profile(budget_range);
CREATE INDEX IF NOT EXISTS idx_user_quick_profile_intake ON user_quick_profile(target_intake);

-- Add RLS policies if they don't exist
ALTER TABLE user_quick_profile ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them (idempotent)
DROP POLICY IF EXISTS "Users can view own profile" ON user_quick_profile;
DROP POLICY IF EXISTS "Users can update own profile" ON user_quick_profile;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_quick_profile;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view own profile" ON user_quick_profile
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_quick_profile
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_quick_profile
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Function to calculate profile completion score
CREATE OR REPLACE FUNCTION calculate_profile_completion(profile_row user_quick_profile)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    total_fields INTEGER := 10; -- Total number of important fields
BEGIN
    -- Required fields (base scholarship profile) - 50 points total
    IF profile_row.degree_level IS NOT NULL AND profile_row.degree_level != '' THEN
        score := score + 5;
    END IF;
    
    IF profile_row.field_of_study IS NOT NULL AND profile_row.field_of_study != '' THEN
        score := score + 5;
    END IF;
    
    IF profile_row.preferred_countries IS NOT NULL AND array_length(profile_row.preferred_countries, 1) > 0 THEN
        score := score + 10;
    END IF;
    
    IF profile_row.gpa_range IS NOT NULL AND profile_row.gpa_range != '' THEN
        score := score + 10;
    END IF;
    
    IF profile_row.scholarship_priority IS NOT NULL AND profile_row.scholarship_priority != '' THEN
        score := score + 5;
    END IF;
    
    -- Enhanced fields - 50 points total
    IF profile_row.target_intake IS NOT NULL AND profile_row.target_intake != '' THEN
        score := score + 10;
    END IF;
    
    IF profile_row.budget_range IS NOT NULL AND profile_row.budget_range != '' THEN
        score := score + 10;
    END IF;
    
    IF profile_row.current_gpa_value IS NOT NULL THEN
        score := score + 15;
    END IF;
    
    IF profile_row.current_gpa_scale IS NOT NULL AND profile_row.current_gpa_scale != '' THEN
        score := score + 5;
    END IF;
    
    IF profile_row.standardized_gpa_4_scale IS NOT NULL THEN
        score := score + 10;
    END IF;
    
    RETURN LEAST(100, score); -- Cap at 100%
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update profile completion score
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.profile_completion_score := calculate_profile_completion(NEW);
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_profile_completion ON user_quick_profile;
CREATE TRIGGER trigger_update_profile_completion
    BEFORE INSERT OR UPDATE ON user_quick_profile
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_completion();

-- Function to auto-calculate standardized GPA (integrate with existing GPA converter)
CREATE OR REPLACE FUNCTION calculate_standardized_gpa(
    gpa_value DECIMAL,
    gpa_scale TEXT,
    country TEXT DEFAULT 'US'
)
RETURNS DECIMAL AS $$
DECLARE
    standardized_gpa DECIMAL;
BEGIN
    -- Simple conversion logic (can be enhanced with full GPA converter integration)
    IF gpa_scale = '4.0' THEN
        standardized_gpa := gpa_value;
    ELSIF gpa_scale = '5.0' THEN
        standardized_gpa := (gpa_value / 5.0) * 4.0;
    ELSIF gpa_scale = '7.0' THEN
        standardized_gpa := (gpa_value / 7.0) * 4.0;
    ELSIF gpa_scale = '10.0' THEN
        standardized_gpa := (gpa_value / 10.0) * 4.0;
    ELSIF gpa_scale = '100' THEN
        -- Percentage to 4.0 scale approximation
        standardized_gpa := CASE 
            WHEN gpa_value >= 90 THEN 4.0
            WHEN gpa_value >= 80 THEN 3.5
            WHEN gpa_value >= 70 THEN 3.0
            WHEN gpa_value >= 60 THEN 2.5
            ELSE 2.0
        END;
    ELSE
        -- Default: assume 4.0 scale
        standardized_gpa := LEAST(4.0, gpa_value);
    END IF;
    
    RETURN ROUND(standardized_gpa, 2);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate standardized GPA when GPA fields change
CREATE OR REPLACE FUNCTION update_standardized_gpa()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_gpa_value IS NOT NULL AND NEW.current_gpa_scale IS NOT NULL THEN
        NEW.standardized_gpa_4_scale := calculate_standardized_gpa(
            NEW.current_gpa_value, 
            NEW.current_gpa_scale
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create GPA calculation trigger
DROP TRIGGER IF EXISTS trigger_update_standardized_gpa ON user_quick_profile;
CREATE TRIGGER trigger_update_standardized_gpa
    BEFORE INSERT OR UPDATE ON user_quick_profile
    FOR EACH ROW
    EXECUTE FUNCTION update_standardized_gpa();

-- Update existing profiles to calculate completion scores
UPDATE user_quick_profile SET updated_at = NOW();

-- =====================================================
-- COMMENTS AND USAGE NOTES
-- =====================================================

/*
UNIFIED PROFILE USAGE:

1. BACKWARD COMPATIBILITY:
   - Existing scholarship QuickProfile continues to work
   - All existing fields remain unchanged
   - New fields are optional (nullable)

2. ONBOARDING FLOW:
   - Step 1: preferred_countries, target_intake
   - Step 2: current_gpa_value, current_gpa_scale (auto-calculates standardized_gpa_4_scale)
   - Step 3: field_of_study, degree_level, budget_range
   - Set onboarding_completed = true

3. PROFILE COMPLETION:
   - Auto-calculated score 0-100%
   - Used for dashboard completion widget
   - Triggers on every profile update

4. GPA INTEGRATION:
   - standardized_gpa_4_scale auto-calculated
   - Can be enhanced to integrate with full GPAConverterService
   - Used for scholarship/university matching

5. NOTIFICATION PREFERENCES:
   - JSONB field for flexible notification settings
   - Default: all notifications enabled
   - Used for email digest system

6. FUTURE EXTENSIONS:
   - visa_preferences: Store visa requirements, interview prep settings
   - Can add more JSONB fields as needed
   - Maintains backward compatibility
*/
