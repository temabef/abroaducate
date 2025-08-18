-- Direct fix for storage policies using email-based admin check
-- This bypasses potential issues with the is_admin() function

-- Ensure blog bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('blog', 'blog', true)
ON CONFLICT (id) DO NOTHING;

-- Drop all existing storage policies for blog bucket
DROP POLICY IF EXISTS "Public can view blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete blog images" ON storage.objects;

-- Create new storage policies using direct email check
CREATE POLICY "Public can view blog images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'blog');

CREATE POLICY "Admins can upload blog images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'blog' AND (
    auth.email() = 'admin@abroaducate.com' OR
    auth.email() = 'solakolawole62@gmail.com' OR
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Admins can update blog images" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'blog' AND (
    auth.email() = 'admin@abroaducate.com' OR
    auth.email() = 'solakolawole62@gmail.com' OR
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Admins can delete blog images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'blog' AND (
    auth.email() = 'admin@abroaducate.com' OR
    auth.email() = 'solakolawole62@gmail.com' OR
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  )
);

