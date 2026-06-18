-- Early User Feedback System
-- Collects structured feedback from early-access users in exchange for credits

CREATE TABLE early_user_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  used_sop BOOLEAN DEFAULT false,
  used_scholarship_radar BOOLEAN DEFAULT false,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  what_worked TEXT,
  what_to_improve TEXT,
  would_recommend TEXT CHECK (would_recommend IN ('yes', 'maybe', 'no')),
  can_feature_testimonial BOOLEAN DEFAULT false,
  credits_awarded BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- RLS Policies
ALTER TABLE early_user_feedback ENABLE ROW LEVEL SECURITY;

-- Users can only insert their own feedback (one-time only due to UNIQUE constraint)
CREATE POLICY "Users can submit own feedback" ON early_user_feedback 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback" ON early_user_feedback 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback" ON early_user_feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.can_manage_scholarships = true
    )
  );

-- Admins can update credits_awarded status
CREATE POLICY "Admins can update credit status" ON early_user_feedback
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.can_manage_scholarships = true
    )
  );

-- Index for admin queries
CREATE INDEX idx_early_feedback_created ON early_user_feedback(created_at DESC);
CREATE INDEX idx_early_feedback_credits_awarded ON early_user_feedback(credits_awarded) WHERE credits_awarded = false;

COMMENT ON TABLE early_user_feedback IS 'Stores structured feedback from early-access users who complete the feedback form in exchange for 20 free credits';
COMMENT ON COLUMN early_user_feedback.credits_awarded IS 'Flag to track whether the 20 credits have been manually added to the user account';
