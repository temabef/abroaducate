-- Fix admin access issues and define admin role permissions
-- This migration addresses:
-- 1. Admin access to scholarships
-- 2. Admin role permissions
-- 3. Ensures proper email display in admin UI

-- 1. First, ensure the admin_users table has an email_cache column
-- Check if column exists first to avoid errors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'admin_users' 
    AND column_name = 'email_cache'
  ) THEN
    ALTER TABLE public.admin_users ADD COLUMN email_cache TEXT;
  END IF;
END $$;

-- 2. Update existing admin_users with email_cache from auth.users
UPDATE public.admin_users
SET email_cache = auth.users.email
FROM auth.users
WHERE admin_users.user_id = auth.users.id
AND admin_users.email_cache IS NULL;

-- 3. Create a function to check admin access with proper permissions
CREATE OR REPLACE FUNCTION public.check_admin_access(resource_type TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_id UUID;
  user_role TEXT;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user is in admin_users table and get their role
  SELECT role INTO user_role
  FROM public.admin_users
  WHERE user_id = current_user_id;
  
  -- Super admins can access everything
  IF user_role = 'super-admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Regular admins have access to scholarships
  IF user_role = 'admin' AND resource_type = 'scholarships' THEN
    RETURN TRUE;
  END IF;
  
  -- Scholarship admins only have access to scholarships
  IF user_role = 'scholarship-admin' AND resource_type = 'scholarships' THEN
    RETURN TRUE;
  END IF;
  
  -- Default to no access
  RETURN FALSE;
END;
$$;

-- 4. Create a function to check if the current user can manage scholarships
CREATE OR REPLACE FUNCTION public.can_manage_scholarships()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN check_admin_access('scholarships');
END;
$$;

-- 5. Create a function to add a new scholarship with proper permissions
CREATE OR REPLACE FUNCTION public.add_scholarship(
  scholarship_data JSONB
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_scholarship_id UUID;
  result JSONB;
BEGIN
  -- Check if user has permission to manage scholarships
  IF NOT can_manage_scholarships() THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'You do not have permission to add scholarships'
    );
  END IF;

  -- Insert the new scholarship
  INSERT INTO public.scholarships (
    title, provider, amount, deadline, location, field, level, type, 
    description, requirements, website, min_gpa, min_ielts, min_toefl, 
    age_limit, nationality_restrictions, is_active, funding_category,
    university_name, program_name, department, funding_type, 
    application_method, professor_name, professor_email, position_details, 
    has_automatic_funding
  )
  SELECT
    scholarship_data->>'title',
    scholarship_data->>'provider',
    scholarship_data->>'amount',
    scholarship_data->>'deadline',
    scholarship_data->>'location',
    scholarship_data->>'field',
    scholarship_data->>'level',
    scholarship_data->>'type',
    scholarship_data->>'description',
    (scholarship_data->'requirements')::jsonb,
    scholarship_data->>'website',
    (scholarship_data->>'min_gpa')::numeric,
    (scholarship_data->>'min_ielts')::numeric,
    (scholarship_data->>'min_toefl')::integer,
    (scholarship_data->>'age_limit')::integer,
    (scholarship_data->'nationality_restrictions')::jsonb,
    (scholarship_data->>'is_active')::boolean,
    scholarship_data->>'funding_category',
    scholarship_data->>'university_name',
    scholarship_data->>'program_name',
    scholarship_data->>'department',
    scholarship_data->>'funding_type',
    scholarship_data->>'application_method',
    scholarship_data->>'professor_name',
    scholarship_data->>'professor_email',
    scholarship_data->>'position_details',
    (scholarship_data->>'has_automatic_funding')::boolean
  RETURNING id INTO new_scholarship_id;

  -- Return success response
  result := jsonb_build_object(
    'success', TRUE,
    'message', 'Scholarship added successfully',
    'id', new_scholarship_id
  );

  RETURN result;
END;
$$;

-- 6. Update RLS policies for scholarships table to allow admin access
DROP POLICY IF EXISTS "Admins can manage scholarships" ON public.scholarships;
CREATE POLICY "Admins can manage scholarships" 
ON public.scholarships
USING (can_manage_scholarships())
WITH CHECK (can_manage_scholarships());

-- 7. Update the admin_users table RLS policy
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
CREATE POLICY "Admins can view admin users" 
ON public.admin_users
FOR SELECT
USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- 8. Create a function to get admin user details with emails
CREATE OR REPLACE FUNCTION public.get_admin_users_with_emails()
RETURNS SETOF public.admin_users
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if user is an admin
  IF auth.uid() NOT IN (SELECT user_id FROM public.admin_users) THEN
    RAISE EXCEPTION 'Access denied: User is not an admin';
  END IF;
  
  RETURN QUERY
  SELECT * FROM public.admin_users
  ORDER BY created_at DESC;
END;
$$;

-- 9. Create a function to safely add a new admin
CREATE OR REPLACE FUNCTION public.add_admin_safe(
  admin_email TEXT,
  admin_role TEXT DEFAULT 'admin'
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  target_user_id UUID;
  current_user_id UUID;
  current_user_role TEXT;
  result JSONB;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();
  
  -- Check if current user is an admin and get their role
  SELECT role INTO current_user_role
  FROM public.admin_users
  WHERE user_id = current_user_id;
  
  -- Only super-admins can add new admins
  IF current_user_role != 'super-admin' THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'Only super-admins can add new admin users'
    );
  END IF;
  
  -- Find the user ID for the given email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = admin_email;
  
  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'User with this email does not exist'
    );
  END IF;
  
  -- Check if user is already an admin
  IF EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = target_user_id) THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'User is already an admin'
    );
  END IF;
  
  -- Add the new admin
  INSERT INTO public.admin_users (user_id, role, created_by, email_cache)
  VALUES (target_user_id, admin_role, current_user_id, admin_email);
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Admin added successfully'
  );
END;
$$;

-- 10. Create a function to safely remove an admin
CREATE OR REPLACE FUNCTION public.remove_admin_safe(
  admin_email TEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  target_user_id UUID;
  current_user_id UUID;
  current_user_role TEXT;
  target_user_role TEXT;
  result JSONB;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();
  
  -- Check if current user is an admin and get their role
  SELECT role INTO current_user_role
  FROM public.admin_users
  WHERE user_id = current_user_id;
  
  -- Only super-admins can remove admins
  IF current_user_role != 'super-admin' THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'Only super-admins can remove admin users'
    );
  END IF;
  
  -- Find the user ID for the given email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = admin_email;
  
  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'User with this email does not exist'
    );
  END IF;
  
  -- Check if user is an admin
  SELECT role INTO target_user_role
  FROM public.admin_users
  WHERE user_id = target_user_id;
  
  IF target_user_role IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'User is not an admin'
    );
  END IF;
  
  -- Prevent removing super-admins
  IF target_user_role = 'super-admin' THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'Cannot remove super-admin users'
    );
  END IF;
  
  -- Remove the admin
  DELETE FROM public.admin_users
  WHERE user_id = target_user_id;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Admin removed successfully'
  );
END;
$$; 