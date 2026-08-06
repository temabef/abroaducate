-- Update RPC functions to handle video_url field
-- This allows the admin panel to save video URLs properly

-- Update the nuclear_update_scholarship_enhanced function
CREATE OR REPLACE FUNCTION nuclear_update_scholarship_enhanced(scholarship_id uuid, scholarship_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_email text;
  encoded_title TEXT;
  encoded_provider TEXT;
  encoded_amount TEXT;
  encoded_description TEXT;
  encoded_requirements TEXT[];
  encoded_university_name TEXT;
  encoded_program_name TEXT;
  encoded_department TEXT;
  encoded_professor_name TEXT;
  encoded_position_details TEXT;
BEGIN
  -- Get current user email
  SELECT email INTO current_user_email 
  FROM auth.users 
  WHERE id = auth.uid();
  
  -- Check if user is admin
  IF current_user_email != 'solakolawole62@gmail.com' AND 
     current_user_email != 'admin@abroaducate.com' AND
     current_user_email NOT LIKE '%admin%' THEN
    RETURN jsonb_build_object('error', 'Access denied');
  END IF;

  -- Encode text fields to prevent encoding issues
  encoded_title := encode_html_entities(scholarship_data->>'title');
  encoded_provider := encode_html_entities(scholarship_data->>'provider');
  encoded_amount := encode_html_entities(scholarship_data->>'amount');
  encoded_description := encode_html_entities(scholarship_data->>'description');
  encoded_university_name := encode_html_entities(scholarship_data->>'university_name');
  encoded_program_name := encode_html_entities(scholarship_data->>'program_name');
  encoded_department := encode_html_entities(scholarship_data->>'department');
  encoded_professor_name := encode_html_entities(scholarship_data->>'professor_name');
  encoded_position_details := encode_html_entities(scholarship_data->>'position_details');
  
  -- Encode requirements array
  IF scholarship_data->'requirements' IS NOT NULL THEN
    SELECT ARRAY(
      SELECT encode_html_entities(jsonb_array_elements_text(scholarship_data->'requirements'))
    ) INTO encoded_requirements;
  ELSE
    encoded_requirements := '{}'::TEXT[];
  END IF;

  -- Update scholarship with encoded data
  UPDATE scholarships SET
    title = encoded_title,
    provider = encoded_provider,
    amount = encoded_amount,
    deadline = CASE WHEN scholarship_data ? 'deadline' AND coalesce(scholarship_data->>'deadline','') <> '' THEN (scholarship_data->>'deadline')::date ELSE deadline END,
    location = scholarship_data->>'location',
    field = scholarship_data->>'field',
    level = scholarship_data->>'level',
    levels = CASE 
      WHEN scholarship_data->'levels' IS NOT NULL THEN 
        ARRAY(SELECT jsonb_array_elements_text(scholarship_data->'levels'))
      ELSE 
        ARRAY[scholarship_data->>'level']
    END,
    type = scholarship_data->>'type',
    description = encoded_description,
    requirements = encoded_requirements,
    website = CASE WHEN scholarship_data->>'website' = '' THEN NULL ELSE scholarship_data->>'website' END,
    video_url = CASE WHEN scholarship_data->>'video_url' = '' THEN NULL ELSE scholarship_data->>'video_url' END,
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
    university_name = encoded_university_name,
    program_name = encoded_program_name,
    department = encoded_department,
    funding_type = CASE WHEN scholarship_data->>'funding_type' = '' THEN NULL ELSE scholarship_data->>'funding_type' END,
    application_method = CASE WHEN scholarship_data->>'application_method' = '' THEN NULL ELSE scholarship_data->>'application_method' END,
    professor_name = encoded_professor_name,
    professor_email = CASE WHEN scholarship_data->>'professor_email' = '' THEN NULL ELSE scholarship_data->>'professor_email' END,
    position_details = encoded_position_details,
    has_automatic_funding = COALESCE((scholarship_data->>'has_automatic_funding')::boolean, false),
    full_description_text = scholarship_data->>'full_description_text',
    raw_requirements_text = scholarship_data->>'raw_requirements_text',
    updated_at = NOW()
  WHERE id = scholarship_id;

  RETURN jsonb_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Update the nuclear_insert_scholarship_enhanced function
CREATE OR REPLACE FUNCTION nuclear_insert_scholarship_enhanced(scholarship_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_scholarship_id uuid;
  current_user_email text;
  encoded_title TEXT;
  encoded_provider TEXT;
  encoded_amount TEXT;
  encoded_description TEXT;
  encoded_requirements TEXT[];
  encoded_university_name TEXT;
  encoded_program_name TEXT;
  encoded_department TEXT;
  encoded_professor_name TEXT;
  encoded_position_details TEXT;
BEGIN
  -- Get current user email
  SELECT email INTO current_user_email 
  FROM auth.users 
  WHERE id = auth.uid();
  
  -- Check if user is admin
  IF current_user_email != 'solakolawole62@gmail.com' AND 
     current_user_email != 'admin@abroaducate.com' AND
     current_user_email NOT LIKE '%admin%' THEN
    RETURN jsonb_build_object('error', 'Access denied');
  END IF;

  -- Encode text fields
  encoded_title := encode_html_entities(scholarship_data->>'title');
  encoded_provider := encode_html_entities(scholarship_data->>'provider');
  encoded_amount := encode_html_entities(scholarship_data->>'amount');
  encoded_description := encode_html_entities(scholarship_data->>'description');
  encoded_university_name := encode_html_entities(scholarship_data->>'university_name');
  encoded_program_name := encode_html_entities(scholarship_data->>'program_name');
  encoded_department := encode_html_entities(scholarship_data->>'department');
  encoded_professor_name := encode_html_entities(scholarship_data->>'professor_name');
  encoded_position_details := encode_html_entities(scholarship_data->>'position_details');
  
  -- Encode requirements array
  IF scholarship_data->'requirements' IS NOT NULL THEN
    SELECT ARRAY(
      SELECT encode_html_entities(jsonb_array_elements_text(scholarship_data->'requirements'))
    ) INTO encoded_requirements;
  ELSE
    encoded_requirements := '{}'::TEXT[];
  END IF;

  -- Insert scholarship with encoded data
  INSERT INTO scholarships (
    title, provider, amount, deadline, location, field, level, levels, type, description,
    requirements, website, video_url, min_gpa, min_ielts, min_toefl, age_limit,
    nationality_restrictions, is_active, funding_category,
    university_name, program_name, department, funding_type, application_method,
    professor_name, professor_email, position_details, has_automatic_funding,
    full_description_text, raw_requirements_text
  ) VALUES (
    encoded_title,
    encoded_provider,
    encoded_amount,
    CASE WHEN scholarship_data ? 'deadline' AND coalesce(scholarship_data->>'deadline','') <> '' THEN (scholarship_data->>'deadline')::date ELSE NULL END,
    scholarship_data->>'location',
    scholarship_data->>'field',
    scholarship_data->>'level',
    CASE 
      WHEN scholarship_data->'levels' IS NOT NULL THEN 
        ARRAY(SELECT jsonb_array_elements_text(scholarship_data->'levels'))
      ELSE 
        ARRAY[scholarship_data->>'level']
    END,
    scholarship_data->>'type',
    encoded_description,
    encoded_requirements,
    CASE WHEN scholarship_data->>'website' = '' THEN NULL ELSE scholarship_data->>'website' END,
    CASE WHEN scholarship_data->>'video_url' = '' THEN NULL ELSE scholarship_data->>'video_url' END,
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
    encoded_university_name,
    encoded_program_name,
    encoded_department,
    CASE WHEN scholarship_data->>'funding_type' = '' THEN NULL ELSE scholarship_data->>'funding_type' END,
    CASE WHEN scholarship_data->>'application_method' = '' THEN NULL ELSE scholarship_data->>'application_method' END,
    encoded_professor_name,
    CASE WHEN scholarship_data->>'professor_email' = '' THEN NULL ELSE scholarship_data->>'professor_email' END,
    encoded_position_details,
    COALESCE((scholarship_data->>'has_automatic_funding')::boolean, false),
    scholarship_data->>'full_description_text',
    scholarship_data->>'raw_requirements_text'
  ) RETURNING id INTO new_scholarship_id;

  RETURN jsonb_build_object('success', true, 'id', new_scholarship_id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION nuclear_update_scholarship_enhanced IS 'Admin function to update scholarship with video_url support';
COMMENT ON FUNCTION nuclear_insert_scholarship_enhanced IS 'Admin function to insert scholarship with video_url support';
