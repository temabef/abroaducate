-- Test script for step-by-step migration verification
-- Run this after each step to verify it worked

-- Test 1: Check if levels column exists
SELECT 'Test 1: Levels Column' as test_name;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'scholarships' AND column_name = 'levels';

-- Test 2: Check if encoding function exists
SELECT 'Test 2: Encoding Function' as test_name;
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'encode_html_entities';

-- Test 3: Test encoding function
SELECT 'Test 3: Test Encoding' as test_name;
SELECT encode_html_entities('Test $50,000 scholarship with #hashtag & symbols') as encoded_text;

-- Test 4: Check if decoding function exists
SELECT 'Test 4: Decoding Function' as test_name;
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'decode_html_entities';

-- Test 5: Test decoding function
SELECT 'Test 5: Test Decoding' as test_name;
SELECT decode_html_entities('Test &#36;50,000 scholarship with &#35;hashtag &amp; symbols') as decoded_text;

-- Test 6: Check levels data
SELECT 'Test 6: Levels Data' as test_name;
SELECT COUNT(*) as total_scholarships,
       COUNT(*) FILTER (WHERE array_length(levels, 1) > 0) as with_levels,
       COUNT(*) FILTER (WHERE array_length(levels, 1) IS NULL) as without_levels
FROM scholarships;

-- Test 7: Check index
SELECT 'Test 7: Levels Index' as test_name;
SELECT indexname FROM pg_indexes 
WHERE tablename = 'scholarships' AND indexname = 'idx_scholarships_levels';

-- Test 8: Check view
SELECT 'Test 8: Public View' as test_name;
SELECT COUNT(*) as active_scholarships FROM public_scholarships_decoded;

-- Test 9: Check enhanced functions
SELECT 'Test 9: Enhanced Functions' as test_name;
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('nuclear_insert_scholarship_enhanced', 'nuclear_update_scholarship_enhanced', 'nuclear_load_scholarships_enhanced');

-- Test 10: Sample decoded scholarship
SELECT 'Test 10: Sample Decoded Scholarship' as test_name;
SELECT title, amount, levels 
FROM public_scholarships_decoded 
LIMIT 1; 