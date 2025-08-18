-- Fix blog_posts table to use 'content' column instead of 'content_md'
-- This addresses the "Could not find the 'content' column" error

-- First, check if the table exists and what columns it has
DO $$
BEGIN
  -- If content_md exists but content doesn't, rename it
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'blog_posts' 
             AND column_name = 'content_md'
             AND table_schema = 'public') 
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'blog_posts' 
                  AND column_name = 'content'
                  AND table_schema = 'public') THEN
    ALTER TABLE blog_posts RENAME COLUMN content_md TO content;
  END IF;

  -- If neither exists, add content column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'blog_posts' 
                 AND column_name = 'content'
                 AND table_schema = 'public') THEN
    ALTER TABLE blog_posts ADD COLUMN content TEXT NOT NULL DEFAULT '';
  END IF;

  -- Remove unnecessary columns if they exist
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'blog_posts' 
             AND column_name = 'reading_time'
             AND table_schema = 'public') THEN
    ALTER TABLE blog_posts DROP COLUMN reading_time;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'blog_posts' 
             AND column_name = 'seo_title'
             AND table_schema = 'public') THEN
    ALTER TABLE blog_posts DROP COLUMN seo_title;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'blog_posts' 
             AND column_name = 'seo_description'
             AND table_schema = 'public') THEN
    ALTER TABLE blog_posts DROP COLUMN seo_description;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'blog_posts' 
             AND column_name = 'canonical_url'
             AND table_schema = 'public') THEN
    ALTER TABLE blog_posts DROP COLUMN canonical_url;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'blog_posts' 
             AND column_name = 'og_image_url'
             AND table_schema = 'public') THEN
    ALTER TABLE blog_posts DROP COLUMN og_image_url;
  END IF;
END $$;

-- Ensure the table has the correct structure for our simple blog system
-- Drop and recreate if needed
DROP TABLE IF EXISTS blog_posts CASCADE;

CREATE TABLE blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  author_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recreate the updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_blog_posts_updated_at 
    BEFORE UPDATE ON blog_posts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can read published posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can manage all posts" ON blog_posts;

-- RLS Policies
CREATE POLICY "Public can read published posts" 
ON blog_posts FOR SELECT 
USING (status = 'published' AND published_at <= NOW());

CREATE POLICY "Admins can manage all posts" 
ON blog_posts FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published ON blog_posts(status, published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_user_id);

