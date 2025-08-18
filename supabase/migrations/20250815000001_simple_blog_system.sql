-- Simple Blog System Migration
-- This replaces the complex blog system with a clean, minimal approach

-- Drop existing complex tables if they exist
DROP TABLE IF EXISTS blog_post_tags CASCADE;
DROP TABLE IF EXISTS blog_post_categories CASCADE;
DROP TABLE IF EXISTS blog_revisions CASCADE;
DROP TABLE IF EXISTS blog_tags CASCADE;
DROP TABLE IF EXISTS blog_categories CASCADE;
DROP TABLE IF EXISTS blog_posts CASCADE;

-- Create simple blog_posts table with only essential fields
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

-- Create updated_at trigger
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

-- RLS Policies
-- Public can read published posts
CREATE POLICY "Public can read published posts" 
ON blog_posts FOR SELECT 
USING (status = 'published' AND published_at <= NOW());

-- Admins can do everything
CREATE POLICY "Admins can manage all posts" 
ON blog_posts FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

-- Create blog storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('blog', 'blog', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for blog bucket
CREATE POLICY "Public can view blog images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'blog');

CREATE POLICY "Admins can upload blog images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'blog' AND 
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can update blog images" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'blog' AND 
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete blog images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'blog' AND 
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

-- Helper function to generate reading time
CREATE OR REPLACE FUNCTION calculate_reading_time(content TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN GREATEST(1, ROUND(array_length(string_to_array(content, ' '), 1) / 200.0));
END;
$$ LANGUAGE plpgsql;

-- Add some indexes for performance
CREATE INDEX idx_blog_posts_status_published ON blog_posts(status, published_at DESC) WHERE status = 'published';
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_author ON blog_posts(author_user_id);

