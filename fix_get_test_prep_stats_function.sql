-- Fix get_test_prep_stats function return type issue
-- This drops the existing function and recreates it with the correct signature

-- Drop the existing function first
DROP FUNCTION IF EXISTS get_test_prep_stats();

-- Recreate with correct return type
CREATE OR REPLACE FUNCTION get_test_prep_stats()
RETURNS TABLE (
  test_name TEXT,
  total_sets INTEGER,
  total_questions INTEGER,
  reading_questions INTEGER,
  listening_questions INTEGER,
  writing_questions INTEGER,
  speaking_questions INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.name,
    COUNT(DISTINCT ps.id)::INTEGER,
    COUNT(DISTINCT pq.id)::INTEGER,
    COUNT(DISTINCT CASE WHEN ps.section = 'reading' THEN pq.id END)::INTEGER,
    COUNT(DISTINCT CASE WHEN ps.section = 'listening' THEN pq.id END)::INTEGER,
    COUNT(DISTINCT CASE WHEN ps.section = 'writing' THEN pq.id END)::INTEGER,
    COUNT(DISTINCT CASE WHEN ps.section = 'speaking' THEN pq.id END)::INTEGER
  FROM practice_tests pt
  LEFT JOIN practice_sets ps ON pt.id = ps.test_id
  LEFT JOIN practice_questions pq ON ps.id = pq.set_id
  GROUP BY pt.id, pt.name
  ORDER BY pt.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_test_prep_stats() TO authenticated;

SELECT 'get_test_prep_stats function fixed successfully!' as result; 