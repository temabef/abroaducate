-- Get 10 high-value scholarships with upcoming deadlines for social media
-- Focus on: broad eligibility, good benefits, deadlines in next 2-3 months

SELECT 
  id,
  scholarship_name,
  organization_name,
  country,
  benefits,
  application_deadline,
  eligibility_criteria,
  scholarship_link,
  target_countries,
  degree_levels,
  CASE 
    WHEN benefits ILIKE '%fully funded%' OR benefits ILIKE '%full tuition%' THEN 'Fully Funded'
    WHEN benefits ILIKE '%€%' OR benefits ILIKE '%$%' THEN 'Monetary Award'
    ELSE 'Partial Funding'
  END as funding_type
FROM scholarships
WHERE 
  -- Upcoming deadlines (within next 90 days)
  application_deadline >= CURRENT_DATE
  AND application_deadline <= CURRENT_DATE + INTERVAL '90 days'
  -- Broad eligibility (not super restrictive)
  AND (
    target_countries ILIKE '%developing%' 
    OR target_countries ILIKE '%africa%'
    OR target_countries ILIKE '%international%'
    OR target_countries ILIKE '%all%'
  )
  -- Must have benefits and link
  AND benefits IS NOT NULL 
  AND benefits != ''
  AND scholarship_link IS NOT NULL
ORDER BY 
  application_deadline ASC,
  CASE 
    WHEN benefits ILIKE '%fully funded%' THEN 1
    ELSE 2
  END
LIMIT 10;
