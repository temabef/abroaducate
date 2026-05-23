-- ============================================================
-- Seed data for the "One Program MVP" - RWTH Aachen
-- Run this in Supabase SQL Editor after running 001
-- ============================================================

INSERT INTO programs (
  id,
  program_name,
  university_name,
  country,
  city,
  degree_level,
  field_of_study,
  language_of_instruction,
  tuition_per_semester,
  tuition_currency,
  tuition_label,
  semester_fee,
  application_fee,
  has_application_fee,
  living_cost_per_month,
  blocked_account_per_year,
  application_platform,
  direct_application_url,
  application_open_date,
  application_close_date,
  program_start_date,
  program_duration_months,
  intakes,
  funding_pathway,
  funding_pathway_explanation,
  english_required,
  german_required,
  open_to_international,
  rubric_criteria,
  application_steps,
  full_description_text,
  raw_requirements_text
) VALUES (
  'rwth-software-systems',
  'M.Sc. Software Systems Engineering',
  'RWTH Aachen University',
  'Germany',
  'Aachen',
  'master',
  'Computer Science',
  'English',
  0,
  'EUR',
  'free',
  320, -- approximate semester fee
  0,
  false,
  950,
  11208,
  'direct',
  'https://www.rwth-aachen.de',
  '2025-12-01',
  '2026-03-01',
  '2026-10-01',
  24,
  '["Winter"]'::jsonb,
  'program_first',
  'Because this program has €0 tuition, your focus is on getting admitted first. Once your technical capability is proven, you can apply for research assistantships (HiWi) directly with professors to cover your living costs.',
  true,
  false,
  true,
  -- Deterministic Scoring Rubric output
  '{
    "requires_computing_bachelors": true,
    "english_level_required": "B2",
    "requires_gre": false,
    "bonus_traits": ["systems programming", "software architecture", "research experience"]
  }'::jsonb,
  -- The Clarity Engine Timeline Application Steps
  '[
    {
      "step_number": 1,
      "title": "Gather Technical Proofs",
      "description": "Ensure your academic transcripts explicitly highlight Software Architecture, Databases, and Systems courses.",
      "is_mandatory": true,
      "estimated_month": "November"
    },
    {
      "step_number": 2,
      "title": "Apply for University Admission",
      "description": "Submit your application on the RWTH application portal. No DAAD or funding application is required in this step.",
      "deadline": "March 1st",
      "is_mandatory": true,
      "estimated_month": "December - February"
    },
    {
      "step_number": 3,
      "title": "Secure Living Expense Funding (HiWi / Labs)",
      "description": "Once shortlisted or admitted, begin cold-emailing RWTH Computer Science professors for HiWi (Research Assistant) roles. This pays ~€500-€900/month.",
      "is_mandatory": false,
      "estimated_month": "June - August"
    }
  ]'::jsonb,
  'The Master of Science in Software Systems Engineering at RWTH Aachen focuses on the design, implementation, and analysis of complex software systems.',
  'A Bachelor degree in Computer Science, Software Engineering or a closely related field. Strong performance in systems-level programming languages. Certificate of English language proficiency.'
)
ON CONFLICT (id) DO UPDATE SET 
  application_steps = EXCLUDED.application_steps,
  rubric_criteria = EXCLUDED.rubric_criteria,
  funding_pathway = EXCLUDED.funding_pathway;
