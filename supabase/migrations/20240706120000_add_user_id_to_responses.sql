ALTER TABLE user_practice_responses
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE; 