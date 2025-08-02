-- Test script for scholarship encoding and multiple levels functionality
-- Run this after applying the migration to verify everything works

-- Test 1: Test HTML entity encoding/decoding functions
SELECT 'Test 1: HTML Entity Functions' as test_name;

-- Test encoding
SELECT 
  encode_html_entities('Test $50,000 scholarship with #hashtag & symbols') as encoded_text;

-- Test decoding
SELECT 
  decode_html_entities('Test &#36;50,000 scholarship with &#35;hashtag &amp; symbols') as decoded_text;

-- Test 2: Insert a test scholarship with special characters and multiple levels
SELECT 'Test 2: Insert Scholarship with Encoding' as test_name;

-- Insert test scholarship using the enhanced function
SELECT nuclear_insert_scholarship_enhanced('{
  "title": "Test $50,000 Scholarship with #hashtag",
  "provider": "Test Foundation & Co.",
  "amount": "$50,000/year + €5,000 bonus",
  "deadline": "2024-12-31",
  "location": "United States",
  "field": "Computer Science",
  "level": "Master''s",
  "levels": ["Master''s", "PhD"],
  "type": "Merit-based",
  "description": "This scholarship offers $50,000 per year with additional €5,000 bonus for outstanding performance.",
  "requirements": ["Bachelor''s degree", "3.5+ GPA", "Leadership experience"],
  "website": "https://test-foundation.edu",
  "funding_category": "Traditional Scholarship"
}'::jsonb);

-- Test 3: Load scholarships with decoded entities
SELECT 'Test 3: Load Scholarships with Decoding' as test_name;

-- Load the test scholarship using the enhanced function
SELECT nuclear_load_scholarships_enhanced(1, 10);

-- Test 4: Get specific scholarship with decoded entities
SELECT 'Test 4: Get Specific Scholarship' as test_name;

-- Get the most recently created scholarship
SELECT get_scholarship_decoded(id) 
FROM scholarships 
ORDER BY created_at DESC 
LIMIT 1;

-- Test 5: Verify levels array functionality
SELECT 'Test 5: Levels Array Functionality' as test_name;

-- Check scholarships with multiple levels
SELECT 
  title,
  level,
  levels,
  array_length(levels, 1) as levels_count
FROM scholarships 
WHERE array_length(levels, 1) > 1
ORDER BY created_at DESC
LIMIT 5;

-- Test 6: Test scholarship search with levels array
SELECT 'Test 6: Search with Levels Array' as test_name;

-- Search for scholarships that include "Master's" in their levels
SELECT 
  title,
  levels,
  level
FROM scholarships 
WHERE 'Master''s' = ANY(levels)
ORDER BY created_at DESC
LIMIT 5;

-- Test 7: Verify encoding in stored data
SELECT 'Test 7: Verify Encoding in Database' as test_name;

-- Check raw stored data (should be encoded)
SELECT 
  title,
  provider,
  amount
FROM scholarships 
WHERE title LIKE '%$%' OR provider LIKE '%&%'
ORDER BY created_at DESC
LIMIT 3;

-- Test 8: Verify decoding works correctly
SELECT 'Test 8: Verify Decoding Works' as test_name;

-- Check decoded data (should be readable)
SELECT 
  decode_html_entities(title) as decoded_title,
  decode_html_entities(provider) as decoded_provider,
  decode_html_entities(amount) as decoded_amount
FROM scholarships 
WHERE title LIKE '%&#36;%' OR provider LIKE '%&amp;%'
ORDER BY created_at DESC
LIMIT 3;

-- Test 9: Performance test with levels index
SELECT 'Test 9: Performance Test' as test_name;

-- Test query performance with levels array
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM scholarships 
WHERE 'PhD' = ANY(levels) 
AND is_active = true
LIMIT 10;

-- Test 10: Cleanup (optional - uncomment to remove test data)
-- SELECT 'Test 10: Cleanup' as test_name;
-- DELETE FROM scholarships WHERE title LIKE 'Test $50,000%';

SELECT 'All tests completed!' as status; 