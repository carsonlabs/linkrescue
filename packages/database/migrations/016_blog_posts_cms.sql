-- 016: blog_posts CMS table — CMS home moves INTO the LinkRescue project.
-- Why: the blog was architected to read from the AgentReady Supabase project
-- (CMS_SUPABASE_URL), but that project is unreachable/being torn down and the
-- env var was never set in Vercel. lib/blog.ts already falls back to this
-- project's NEXT_PUBLIC_SUPABASE_URL, so creating the table here makes the
-- blog work with zero code or env changes.
-- Schema matches every column lib/blog.ts reads (getAllPosts / getPostBySlug).

CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  author text NOT NULL DEFAULT 'LinkRescue Team',
  tags text[] NOT NULL DEFAULT '{}',
  category text NOT NULL DEFAULT 'guides',
  seo_title text,
  meta_description text,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  sites text[] NOT NULL DEFAULT '{linkrescue}',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blog_posts_published_idx
  ON blog_posts (published_at DESC)
  WHERE status = 'published';

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public (anon) may read published posts only — the web app reads with the anon key.
DROP POLICY IF EXISTS blog_posts_public_read ON blog_posts;
CREATE POLICY blog_posts_public_read ON blog_posts
  FOR SELECT
  USING (status = 'published' AND published_at <= now());

-- No anon/authenticated writes; publishing goes through the SQL editor or service role.
