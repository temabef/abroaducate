-- =============================================================================
-- Fix Supabase Advisor (Database Linter) security errors
-- Run this in Supabase SQL Editor or via supabase db push
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. AUTH USERS EXPOSED + SECURITY DEFINER VIEWS
-- Drop views that expose auth.users to anon or use SECURITY DEFINER.
-- (Not referenced in app code; safe to drop.)
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS public.teacher_assignments_overview CASCADE;
DROP VIEW IF EXISTS public.class_enrollment_details CASCADE;
DROP VIEW IF EXISTS public.active_classes_overview CASCADE;
DROP VIEW IF EXISTS public.v_school_users CASCADE;

-- -----------------------------------------------------------------------------
-- 2. ENABLE RLS ON TABLES THAT HAVE POLICIES BUT RLS WAS OFF
-- -----------------------------------------------------------------------------
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.us_cities_cost_data ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 3. ENABLE RLS ON PUBLIC TABLES WITH NO POLICIES YET
-- Add a permissive SELECT policy so existing read access still works.
-- (App uses: us_cities_cost_data in BudgetCalculator, us_universities_normalized
--  in fetch_cached; others are reference/test-prep tables.)
-- -----------------------------------------------------------------------------
ALTER TABLE public.english_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.english_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.english_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.english_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.english_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.english_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.us_universities_normalized ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 4. ADD SELECT POLICIES FOR TABLES THAT HAD NO POLICIES
-- (Tables that already had policies only got RLS enabled in step 2/3.)
-- Allow read so app keeps working: BudgetCalculator uses us_cities_cost_data,
-- fetch_cached uses us_universities_normalized; others are reference/test-prep.
-- -----------------------------------------------------------------------------
CREATE POLICY "Allow public read" ON public.english_levels FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.english_modules FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.us_universities_normalized FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.english_lessons FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.lesson_types FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.lesson_content FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.english_vocabulary FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.vocabulary_lists FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.vocabulary_list_items FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.english_exercises FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.exercise_types FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.english_quizzes FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.quiz_exercises FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.achievement_types FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.teacher_assignments FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.class_enrollments FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.business_users FOR SELECT USING (true);

-- us_cities_cost_data, classes, schools, learning_lessons, learning_modules, study_resources
-- already have policies; RLS was only enabled above.
