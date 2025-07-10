-- Admin Access Security Migration (PostgreSQL Fixed v2)
-- This creates secure admin functions and permissions

-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super-admin', 'scholarship-admin')),
    email_cache TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'updated_at') THEN
        ALTER TABLE public.admin_users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add updated_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'updated_by') THEN
        ALTER TABLE public.admin_users ADD COLUMN updated_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON public.admin_users;

-- Admin access policies
CREATE POLICY "Admins can view admin users" ON public.admin_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au 
            WHERE au.user_id = auth.uid() 
            AND au.role IN ('admin', 'super-admin')
        )
    );

CREATE POLICY "Super admins can manage admin users" ON public.admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au 
            WHERE au.user_id = auth.uid() 
            AND au.role = 'super-admin'
        )
    );

-- Core admin functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid() 
        AND email IN ('admin@abroaducate.com', 'solakolawole62@gmail.com')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_manage_scholarships()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
        AND role IN ('super-admin', 'admin', 'scholarship-admin')
    ) OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid() 
        AND email IN ('admin@abroaducate.com', 'solakolawole62@gmail.com')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_access_analytics()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
        AND role IN ('super-admin', 'admin')
    ) OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid() 
        AND email IN ('admin@abroaducate.com', 'solakolawole62@gmail.com')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_scholarships() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_analytics() TO authenticated;

-- Insert your admin user (robust version)
DO $$
DECLARE
    user_exists BOOLEAN;
    user_uuid UUID;
BEGIN
    -- Check if user exists and get UUID
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'solakolawole62@gmail.com'), 
           id INTO user_exists, user_uuid
    FROM auth.users 
    WHERE email = 'solakolawole62@gmail.com';
    
    -- Only proceed if user exists
    IF user_exists THEN
        INSERT INTO public.admin_users (user_id, role, email_cache, created_by)
        VALUES (user_uuid, 'super-admin', 'solakolawole62@gmail.com', user_uuid)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            role = 'super-admin',
            email_cache = 'solakolawole62@gmail.com';
    ELSE
        RAISE NOTICE 'User solakolawole62@gmail.com not found in auth.users table';
    END IF;
END $$; 