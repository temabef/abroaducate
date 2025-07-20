-- Add role column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super-admin'));

-- Update existing users to have appropriate roles
-- Set the first user (you) as super-admin
UPDATE profiles 
SET role = 'super-admin' 
WHERE id = 'f443d194-4b56-48da-9251-6c3f790f0f33';

-- Set a few other users as admin (optional)
-- UPDATE profiles SET role = 'admin' WHERE email LIKE '%@abroaducate.com';

-- Verify the changes
SELECT id, email, role FROM profiles ORDER BY created_at DESC LIMIT 10; 