-- Nuclear functions for scholarship admin operations
-- These bypass RLS for admin users only

-- Function to insert scholarship (admin only)
CREATE OR REPLACE FUNCTION nuclear_insert_scholarship(scholarship_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  inserted_id uuid;
  current_user_email text;
BEGIN
  -- Get current user email
  SELECT email INTO current_user_email 
  FROM auth.users 
  WHERE id = auth.uid();
  
  -- Check if user is admin (simplified check)
  IF current_user_email != 'solakolawole62@gmail.com' AND 
     current_user_email != 'admin@abroaducate.com' AND
     current_user_email NOT LIKE '%admin%' THEN
    RETURN jsonb_build_object('error', 'Access denied');
  END IF;

  -- Insert scholarship
  INSERT INTO scholarships (
    title, provider, amount, deadline, location, field, level, type, 
    description, requirements, website, min_gpa, min_ielts, min_toefl, 
    age_limit, nationality_restrictions, is_active, funding_category,
    university_name, program_name, department, funding_type, 
    application_method, professor_name, professor_email, 
    position_details, has_automatic_funding
  ) VALUES (
    scholarship_data->>'title',
    scholarship_data->>'provider',
    scholarship_data->>'amount',
    (scholarship_data->>'deadline')::date,
    scholarship_data->>'location',
    scholarship_data->>'field',
    scholarship_data->>'level',
    scholarship_data->>'type',
    scholarship_data->>'description',
    CASE 
      WHEN scholarship_data->'requirements' IS NULL THEN '{}'::text[]
      ELSE ARRAY(SELECT jsonb_array_elements_text(scholarship_data->'requirements'))
    END,
    CASE WHEN scholarship_data->>'website' = '' THEN NULL ELSE scholarship_data->>'website' END,
    CASE WHEN scholarship_data->>'min_gpa' = '' THEN NULL ELSE (scholarship_data->>'min_gpa')::numeric END,
    CASE WHEN scholarship_data->>'min_ielts' = '' THEN NULL ELSE (scholarship_data->>'min_ielts')::numeric END,
    CASE WHEN scholarship_data->>'min_toefl' = '' THEN NULL ELSE (scholarship_data->>'min_toefl')::integer END,
    CASE WHEN scholarship_data->>'age_limit' = '' THEN NULL ELSE (scholarship_data->>'age_limit')::integer END,
    CASE 
      WHEN scholarship_data->'nationality_restrictions' IS NULL THEN '{}'::text[]
      ELSE ARRAY(SELECT jsonb_array_elements_text(scholarship_data->'nationality_restrictions'))
    END,
    COALESCE((scholarship_data->>'is_active')::boolean, true),
    COALESCE(scholarship_data->>'funding_category', 'Traditional Scholarship'),
    CASE WHEN scholarship_data->>'university_name' = '' THEN NULL ELSE scholarship_data->>'university_name' END,
    CASE WHEN scholarship_data->>'program_name' = '' THEN NULL ELSE scholarship_data->>'program_name' END,
    CASE WHEN scholarship_data->>'department' = '' THEN NULL ELSE scholarship_data->>'department' END,
    CASE WHEN scholarship_data->>'funding_type' = '' THEN NULL ELSE scholarship_data->>'funding_type' END,
    CASE WHEN scholarship_data->>'application_method' = '' THEN NULL ELSE scholarship_data->>'application_method' END,
    CASE WHEN scholarship_data->>'professor_name' = '' THEN NULL ELSE scholarship_data->>'professor_name' END,
    CASE WHEN scholarship_data->>'professor_email' = '' THEN NULL ELSE scholarship_data->>'professor_email' END,
    CASE WHEN scholarship_data->>'position_details' = '' THEN NULL ELSE scholarship_data->>'position_details' END,
    COALESCE((scholarship_data->>'has_automatic_funding')::boolean, false)
  )
  RETURNING id INTO inserted_id;

  RETURN jsonb_build_object('success', true, 'id', inserted_id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Function to update scholarship (admin only)
CREATE OR REPLACE FUNCTION nuclear_update_scholarship(scholarship_id uuid, scholarship_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_email text;
BEGIN
  -- Get current user email
  SELECT email INTO current_user_email 
  FROM auth.users 
  WHERE id = auth.uid();
  
  -- Check if user is admin (simplified check)
  IF current_user_email != 'solakolawole62@gmail.com' AND 
     current_user_email != 'admin@abroaducate.com' AND
     current_user_email NOT LIKE '%admin%' THEN
    RETURN jsonb_build_object('error', 'Access denied');
  END IF;

  -- Update scholarship
  UPDATE scholarships SET
    title = scholarship_data->>'title',
    provider = scholarship_data->>'provider',
    amount = scholarship_data->>'amount',
    deadline = (scholarship_data->>'deadline')::date,
    location = scholarship_data->>'location',
    field = scholarship_data->>'field',
    level = scholarship_data->>'level',
    type = scholarship_data->>'type',
    description = scholarship_data->>'description',
    requirements = CASE 
      WHEN scholarship_data->'requirements' IS NULL THEN '{}'::text[]
      ELSE ARRAY(SELECT jsonb_array_elements_text(scholarship_data->'requirements'))
    END,
    website = scholarship_data->>'website',
    min_gpa = CASE WHEN scholarship_data->>'min_gpa' = '' THEN NULL ELSE (scholarship_data->>'min_gpa')::numeric END,
    min_ielts = CASE WHEN scholarship_data->>'min_ielts' = '' THEN NULL ELSE (scholarship_data->>'min_ielts')::numeric END,
    min_toefl = CASE WHEN scholarship_data->>'min_toefl' = '' THEN NULL ELSE (scholarship_data->>'min_toefl')::integer END,
    age_limit = CASE WHEN scholarship_data->>'age_limit' = '' THEN NULL ELSE (scholarship_data->>'age_limit')::integer END,
    nationality_restrictions = CASE 
      WHEN scholarship_data->'nationality_restrictions' IS NULL THEN '{}'::text[]
      ELSE ARRAY(SELECT jsonb_array_elements_text(scholarship_data->'nationality_restrictions'))
    END,
    is_active = COALESCE((scholarship_data->>'is_active')::boolean, true),
    funding_category = COALESCE(scholarship_data->>'funding_category', 'Traditional Scholarship'),
    university_name = scholarship_data->>'university_name',
    program_name = scholarship_data->>'program_name',
    department = scholarship_data->>'department',
    funding_type = scholarship_data->>'funding_type',
    application_method = scholarship_data->>'application_method',
    professor_name = scholarship_data->>'professor_name',
    professor_email = scholarship_data->>'professor_email',
    position_details = scholarship_data->>'position_details',
    has_automatic_funding = COALESCE((scholarship_data->>'has_automatic_funding')::boolean, false),
    updated_at = NOW()
  WHERE id = scholarship_id;

  RETURN jsonb_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Function to delete scholarship (admin only)
CREATE OR REPLACE FUNCTION nuclear_delete_scholarship(scholarship_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_email text;
BEGIN
  -- Get current user email
  SELECT email INTO current_user_email 
  FROM auth.users 
  WHERE id = auth.uid();
  
  -- Check if user is admin (simplified check)
  IF current_user_email != 'solakolawole62@gmail.com' AND 
     current_user_email != 'admin@abroaducate.com' AND
     current_user_email NOT LIKE '%admin%' THEN
    RETURN jsonb_build_object('error', 'Access denied');
  END IF;

  -- Delete scholarship
  DELETE FROM scholarships WHERE id = scholarship_id;

  RETURN jsonb_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Function to load scholarships with pagination (admin only)
CREATE OR REPLACE FUNCTION nuclear_load_scholarships(page_number integer, page_size integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  scholarship_data jsonb;
  total_count integer;
  offset_value integer;
  current_user_email text;
BEGIN
  -- Get current user email
  SELECT email INTO current_user_email 
  FROM auth.users 
  WHERE id = auth.uid();
  
  -- Check if user is admin (simplified check)
  IF current_user_email != 'solakolawole62@gmail.com' AND 
     current_user_email != 'admin@abroaducate.com' AND
     current_user_email NOT LIKE '%admin%' THEN
    RETURN jsonb_build_object('error', 'Access denied');
  END IF;

  -- Get total count
  SELECT COUNT(*) INTO total_count FROM scholarships;
  
  -- Calculate offset
  offset_value := (page_number - 1) * page_size;
  
  -- Get paginated scholarships
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'title', title,
      'provider', provider,
      'amount', amount,
      'deadline', deadline,
      'location', location,
      'field', field,
      'level', level,
      'type', type,
      'description', description,
      'requirements', requirements,
      'website', website,
      'min_gpa', min_gpa,
      'min_ielts', min_ielts,
      'min_toefl', min_toefl,
      'age_limit', age_limit,
      'nationality_restrictions', nationality_restrictions,
      'is_active', is_active,
      'funding_category', funding_category,
      'university_name', university_name,
      'program_name', program_name,
      'department', department,
      'funding_type', funding_type,
      'application_method', application_method,
      'professor_name', professor_name,
      'professor_email', professor_email,
      'position_details', position_details,
      'has_automatic_funding', has_automatic_funding,
      'created_at', created_at,
      'updated_at', updated_at
    )
  ) INTO scholarship_data
  FROM scholarships
  ORDER BY created_at DESC
  LIMIT page_size OFFSET offset_value;

  RETURN jsonb_build_object(
    'scholarships', COALESCE(scholarship_data, '[]'::jsonb),
    'total_count', total_count,
    'page_number', page_number,
    'page_size', page_size
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Enable RLS on subscription_plan_limits table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plan_limits') THEN
    ALTER TABLE subscription_plan_limits ENABLE ROW LEVEL SECURITY;
  END IF;
END $$; 