-- Blog System Schema & RLS
-- Date: 2025-08-15

-- 1) Tables
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content_md TEXT NOT NULL,
  cover_image_url TEXT,
  author_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published','archived')),
  published_at TIMESTAMPTZ,
  reading_time INTEGER,
  seo_title TEXT,
  seo_description TEXT,
  canonical_url TEXT,
  og_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Many-to-many relationships
CREATE TABLE IF NOT EXISTS public.blog_post_categories (
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.blog_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);

CREATE TABLE IF NOT EXISTS public.blog_post_tags (
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.blog_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  title_snapshot TEXT,
  content_snapshot TEXT,
  editor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS blog_posts_published_at_idx ON public.blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS blog_posts_status_idx ON public.blog_posts(status);

-- 2) Helper function for permissions
CREATE OR REPLACE FUNCTION public.can_manage_blog()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.can_manage_blog() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_blog() TO anon;

-- 3) RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_revisions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DO $$
BEGIN
  PERFORM 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'blog_posts';
  IF FOUND THEN
    DROP POLICY IF EXISTS "Public can read published posts" ON public.blog_posts;
    DROP POLICY IF EXISTS "Admins can read all posts" ON public.blog_posts;
    DROP POLICY IF EXISTS "Admins can insert posts" ON public.blog_posts;
    DROP POLICY IF EXISTS "Admins can update posts" ON public.blog_posts;
    DROP POLICY IF EXISTS "Admins can delete posts" ON public.blog_posts;
  END IF;
  PERFORM 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'blog_categories';
  IF FOUND THEN
    DROP POLICY IF EXISTS "Anyone can read categories" ON public.blog_categories;
    DROP POLICY IF EXISTS "Admins manage categories" ON public.blog_categories;
  END IF;
  PERFORM 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'blog_tags';
  IF FOUND THEN
    DROP POLICY IF EXISTS "Anyone can read tags" ON public.blog_tags;
    DROP POLICY IF EXISTS "Admins manage tags" ON public.blog_tags;
  END IF;
  PERFORM 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'blog_post_categories';
  IF FOUND THEN
    DROP POLICY IF EXISTS "Public read post-categories" ON public.blog_post_categories;
    DROP POLICY IF EXISTS "Admins manage post-categories" ON public.blog_post_categories;
  END IF;
  PERFORM 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'blog_post_tags';
  IF FOUND THEN
    DROP POLICY IF EXISTS "Public read post-tags" ON public.blog_post_tags;
    DROP POLICY IF EXISTS "Admins manage post-tags" ON public.blog_post_tags;
  END IF;
  PERFORM 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'blog_revisions';
  IF FOUND THEN
    DROP POLICY IF EXISTS "Admins manage revisions" ON public.blog_revisions;
    DROP POLICY IF EXISTS "Admins read revisions" ON public.blog_revisions;
  END IF;
END $$;

-- blog_posts policies
CREATE POLICY "Public can read published posts"
  ON public.blog_posts
  FOR SELECT
  USING (
    (status = 'published' AND (published_at IS NOT NULL AND published_at <= NOW()))
    OR public.is_admin()
  );

CREATE POLICY "Admins can read all posts"
  ON public.blog_posts
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert posts"
  ON public.blog_posts
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update posts"
  ON public.blog_posts
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete posts"
  ON public.blog_posts
  FOR DELETE
  USING (public.is_admin());

-- categories
CREATE POLICY "Anyone can read categories"
  ON public.blog_categories
  FOR SELECT
  USING (true);

CREATE POLICY "Admins manage categories"
  ON public.blog_categories
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- tags
CREATE POLICY "Anyone can read tags"
  ON public.blog_tags
  FOR SELECT
  USING (true);

CREATE POLICY "Admins manage tags"
  ON public.blog_tags
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- post_categories
CREATE POLICY "Public read post-categories"
  ON public.blog_post_categories
  FOR SELECT
  USING (true);

CREATE POLICY "Admins manage post-categories"
  ON public.blog_post_categories
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- post_tags
CREATE POLICY "Public read post-tags"
  ON public.blog_post_tags
  FOR SELECT
  USING (true);

CREATE POLICY "Admins manage post-tags"
  ON public.blog_post_tags
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- revisions (admin only)
CREATE POLICY "Admins read revisions"
  ON public.blog_revisions
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins manage revisions"
  ON public.blog_revisions
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4) Storage: Create blog bucket and policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog', 'blog', true)
ON CONFLICT (id) DO NOTHING;

-- Ensure RLS on storage.objects is enabled by Supabase defaults.
-- Public READ for blog bucket
DROP POLICY IF EXISTS "Public read blog images" ON storage.objects;
CREATE POLICY "Public read blog images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'blog');

-- Admin WRITE on blog bucket
DROP POLICY IF EXISTS "Admin write blog images" ON storage.objects;
CREATE POLICY "Admin write blog images"
  ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'blog' AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admin update blog images" ON storage.objects;
CREATE POLICY "Admin update blog images"
  ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'blog' AND public.is_admin())
  WITH CHECK (bucket_id = 'blog' AND public.is_admin());

DROP POLICY IF EXISTS "Admin delete blog images" ON storage.objects;
CREATE POLICY "Admin delete blog images"
  ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'blog' AND public.is_admin());

-- 5) Triggers to maintain updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_blog_posts ON public.blog_posts;
CREATE TRIGGER set_updated_at_blog_posts
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


