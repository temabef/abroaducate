-- Fix IELTS Question Bank Admin Policies
-- This fixes the "column au.email does not exist" error

-- Drop the incorrect policies first
DROP POLICY IF EXISTS "Admin can manage practice tests" ON practice_tests;
DROP POLICY IF EXISTS "Admin can manage practice sets" ON practice_sets;
DROP POLICY IF EXISTS "Admin can manage practice questions" ON practice_questions;
DROP POLICY IF EXISTS "Admin can manage practice choices" ON practice_choices;

-- Create correct admin policies using user_id instead of email
CREATE POLICY "Admin can manage practice tests" ON practice_tests FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users au 
    WHERE au.user_id = auth.uid()
  )
);

CREATE POLICY "Admin can manage practice sets" ON practice_sets FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users au 
    WHERE au.user_id = auth.uid()
  )
);

CREATE POLICY "Admin can manage practice questions" ON practice_questions FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users au 
    WHERE au.user_id = auth.uid()
  )
);

CREATE POLICY "Admin can manage practice choices" ON practice_choices FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users au 
    WHERE au.user_id = auth.uid()
  )
);

-- Also fix the newsletter content management function
DROP FUNCTION IF EXISTS can_manage_newsletter_content();

CREATE OR REPLACE FUNCTION can_manage_newsletter_content()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is admin using user_id
  RETURN EXISTS (
    SELECT 1 FROM admin_users au 
    WHERE au.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION can_manage_newsletter_content() TO authenticated;

SELECT 'IELTS admin policies fixed successfully!' as result; 