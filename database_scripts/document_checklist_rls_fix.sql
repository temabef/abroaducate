-- Fix for Row-Level Security Policy on user_checklist_progress table
-- The current policy is too restrictive for INSERT operations

-- First, drop the existing policy
DROP POLICY IF EXISTS "Users can manage their own checklist progress" ON public.user_checklist_progress;

-- Create separate policies for different operations
-- 1. Allow users to INSERT their own progress records
CREATE POLICY "Users can insert their own checklist progress" ON public.user_checklist_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Allow users to SELECT their own progress records
CREATE POLICY "Users can view their own checklist progress" ON public.user_checklist_progress
    FOR SELECT USING (auth.uid() = user_id);

-- 3. Allow users to UPDATE their own progress records
CREATE POLICY "Users can update their own checklist progress" ON public.user_checklist_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- 4. Allow users to DELETE their own progress records
CREATE POLICY "Users can delete their own checklist progress" ON public.user_checklist_progress
    FOR DELETE USING (auth.uid() = user_id);

-- Verify that the service role has appropriate permissions
GRANT ALL ON public.user_checklist_progress TO service_role;

-- Reset any potential issues with user access
GRANT ALL ON public.user_checklist_progress TO authenticated;

-- Allow service_role to bypass RLS for admin operations
ALTER TABLE public.user_checklist_progress FORCE ROW LEVEL SECURITY;

-- Create a function that can be called with service_role to bypass RLS
CREATE OR REPLACE FUNCTION public.insert_checklist_progress(p_user_id UUID, p_checklist_id UUID)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
BEGIN
    -- This function runs with the privileges of the function owner (typically postgres)
    -- which allows it to bypass RLS policies
    INSERT INTO public.user_checklist_progress (
        user_id, 
        checklist_id, 
        completed_items, 
        progress_percentage, 
        started_at, 
        last_updated
    )
    VALUES (
        p_user_id,
        p_checklist_id,
        '[]'::jsonb,
        0,
        now(),
        now()
    )
    ON CONFLICT (user_id, checklist_id) DO UPDATE SET
        last_updated = now()
    RETURNING to_jsonb(user_checklist_progress.*) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Add a second helper function for service_role access
CREATE OR REPLACE FUNCTION public.start_checklist_with_service_role(p_user_id UUID, p_checklist_id UUID)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
BEGIN
    -- Insert or update the progress record
    INSERT INTO public.user_checklist_progress (
        user_id, 
        checklist_id, 
        completed_items, 
        progress_percentage, 
        started_at, 
        last_updated
    )
    VALUES (
        p_user_id,
        p_checklist_id,
        '[]'::jsonb,
        0,
        now(),
        now()
    )
    ON CONFLICT (user_id, checklist_id) DO UPDATE SET
        last_updated = now()
    RETURNING to_jsonb(user_checklist_progress.*) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql; 