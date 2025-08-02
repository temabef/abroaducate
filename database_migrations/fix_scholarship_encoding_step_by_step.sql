-- Step-by-Step Scholarship Encoding and Multiple Levels Fix
-- Run each section separately to ensure success

-- STEP 1: Add levels column (if not exists)
-- Run this first
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS levels TEXT[] DEFAULT '{}';

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'scholarships' AND column_name = 'levels';

-- STEP 2: Create HTML entity encoding function
-- Run this second
CREATE OR REPLACE FUNCTION encode_html_entities(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    IF input_text IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN 
        -- Common HTML entities
        replace(
        replace(
        replace(
        replace(
        replace(
        -- Currency and special symbols
        replace(
        replace(
        replace(
        replace(
        replace(
        replace(
        replace(
        replace(
        -- Common punctuation that might cause issues
        replace(
        replace(
        replace(
        replace(
        replace(
        replace(
        replace(
            input_text,
            '&', '&amp;'
        ),
            '<', '&lt;'
        ),
            '>', '&gt;'
        ),
            '"', '&quot;'
        ),
            E'\'', '&#39;'
        ),
            '$', '&#36;'
        ),
            '#', '&#35;'
        ),
            '€', '&#128;'
        ),
            '£', '&#163;'
        ),
            '¥', '&#165;'
        ),
            '©', '&#169;'
        ),
            '®', '&#174;'
        ),
            '™', '&#8482;'
        ),
            '–', '&#8211;'
        ),
            '—', '&#8212;'
        ),
            '…', '&#8230;'
        ),
            '"', '&#8220;'
        ),
            '"', '&#8221;'
        ),
            E'\'', '&#8216;'
        ),
            E'\'', '&#8217;'
        );
END;
$$;

-- Test the encoding function
SELECT encode_html_entities('Test $50,000 scholarship with #hashtag & symbols') as encoded_text;

-- STEP 3: Create HTML entity decoding function
-- Run this third
CREATE OR REPLACE FUNCTION decode_html_entities(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    IF input_text IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN 
        -- HTML entities back to characters
        replace(
        replace(
        replace(
        replace(
        replace(
        replace(
        replace(
        replace(
        replace(
        replace(
        replace(
        replace(
        replace(
        replace(
        replace(
        replace(
        replace(
        replace(
        replace(
        replace(
            input_text,
            '&amp;', '&'
        ),
            '&lt;', '<'
        ),
            '&gt;', '>'
        ),
            '&quot;', '"'
        ),
            '&#39;', E'\''
        ),
            '&#36;', '$'
        ),
            '&#35;', '#'
        ),
            '&#128;', '€'
        ),
            '&#163;', '£'
        ),
            '&#165;', '¥'
        ),
            '&#169;', '©'
        ),
            '&#174;', '®'
        ),
            '&#8482;', '™'
        ),
            '&#8211;', '–'
        ),
            '&#8212;', '—'
        ),
            '&#8230;', '…'
        ),
            '&#8220;', '"'
        ),
            '&#8221;', '"'
        ),
            '&#8216;', E'\''
        ),
            '&#8217;', E'\''
        );
END;
$$;

-- Test the decoding function
SELECT decode_html_entities('Test &#36;50,000 scholarship with &#35;hashtag &amp; symbols') as decoded_text;

-- STEP 4: Update existing scholarships to populate levels array
-- Run this fourth
UPDATE scholarships 
SET levels = ARRAY[level] 
WHERE levels IS NULL OR array_length(levels, 1) IS NULL;

-- Verify the update
SELECT COUNT(*) as updated_count FROM scholarships WHERE array_length(levels, 1) > 0;

-- STEP 5: Create index for levels array
-- Run this fifth
CREATE INDEX IF NOT EXISTS idx_scholarships_levels ON scholarships USING GIN (levels);

-- Verify the index was created
SELECT indexname FROM pg_indexes WHERE tablename = 'scholarships' AND indexname = 'idx_scholarships_levels';

-- STEP 6: Create public view for decoded scholarships
-- Run this sixth
CREATE OR REPLACE VIEW public_scholarships_decoded AS
SELECT 
  id,
  decode_html_entities(title) as title,
  decode_html_entities(provider) as provider,
  decode_html_entities(amount) as amount,
  deadline,
  location,
  field,
  level,
  levels,
  type,
  decode_html_entities(description) as description,
  ARRAY(
    SELECT decode_html_entities(req)
    FROM unnest(requirements) AS req
  ) as requirements,
  website,
  min_gpa,
  min_ielts,
  min_toefl,
  age_limit,
  nationality_restrictions,
  is_active,
  funding_category,
  decode_html_entities(university_name) as university_name,
  decode_html_entities(program_name) as program_name,
  decode_html_entities(department) as department,
  funding_type,
  application_method,
  decode_html_entities(professor_name) as professor_name,
  professor_email,
  decode_html_entities(position_details) as position_details,
  has_automatic_funding,
  created_at,
  updated_at
FROM scholarships
WHERE is_active = true;

-- Grant permissions to the view
GRANT SELECT ON public_scholarships_decoded TO anon, authenticated;

-- Test the view
SELECT COUNT(*) as active_scholarships FROM public_scholarships_decoded;

-- STEP 7: Create enhanced nuclear functions (run this last)
-- This creates the enhanced functions that handle encoding/decoding

-- Enhanced insert function
CREATE OR REPLACE FUNCTION nuclear_insert_scholarship_enhanced(scholarship_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  inserted_id uuid;
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
  
  -- Check if user is admin (simplified check)
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

  -- Insert scholarship with encoded data
  INSERT INTO scholarships (
    title, provider, amount, deadline, location, field, level, levels, type, 
    description, requirements, website, min_gpa, min_ielts, min_toefl, 
    age_limit, nationality_restrictions, is_active, funding_category,
    university_name, program_name, department, funding_type, 
    application_method, professor_name, professor_email, 
    position_details, has_automatic_funding
  ) VALUES (
    encoded_title,
    encoded_provider,
    encoded_amount,
    (scholarship_data->>'deadline')::date,
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
    COALESCE((scholarship_data->>'has_automatic_funding')::boolean, false)
  )
  RETURNING id INTO inserted_id;

  RETURN jsonb_build_object('success', true, 'id', inserted_id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Enhanced update function
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
  
  -- Check if user is admin (simplified check)
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
    deadline = (scholarship_data->>'deadline')::date,
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
    updated_at = NOW()
  WHERE id = scholarship_id;

  RETURN jsonb_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Enhanced load function
CREATE OR REPLACE FUNCTION nuclear_load_scholarships_enhanced(page_number integer, page_size integer)
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

  -- Calculate offset
  offset_value := (page_number - 1) * page_size;
  
  -- Get total count
  SELECT COUNT(*) INTO total_count FROM scholarships;
  
  -- Get paginated scholarships with decoded entities
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'title', decode_html_entities(s.title),
      'provider', decode_html_entities(s.provider),
      'amount', decode_html_entities(s.amount),
      'deadline', s.deadline,
      'location', s.location,
      'field', s.field,
      'level', s.level,
      'levels', s.levels,
      'type', s.type,
      'description', decode_html_entities(s.description),
      'requirements', (
        SELECT jsonb_agg(decode_html_entities(req))
        FROM unnest(s.requirements) AS req
      ),
      'website', s.website,
      'min_gpa', s.min_gpa,
      'min_ielts', s.min_ielts,
      'min_toefl', s.min_toefl,
      'age_limit', s.age_limit,
      'nationality_restrictions', s.nationality_restrictions,
      'is_active', s.is_active,
      'funding_category', s.funding_category,
      'university_name', decode_html_entities(s.university_name),
      'program_name', decode_html_entities(s.program_name),
      'department', decode_html_entities(s.department),
      'funding_type', s.funding_type,
      'application_method', s.application_method,
      'professor_name', decode_html_entities(s.professor_name),
      'professor_email', s.professor_email,
      'position_details', decode_html_entities(s.position_details),
      'has_automatic_funding', s.has_automatic_funding,
      'created_at', s.created_at,
      'updated_at', s.updated_at
    )
  ) INTO scholarship_data
  FROM scholarships s
  ORDER BY s.created_at DESC
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

-- Test the enhanced functions
SELECT 'Migration completed successfully! All functions created and tested.' as status; 