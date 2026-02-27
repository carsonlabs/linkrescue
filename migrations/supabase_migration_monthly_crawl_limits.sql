-- ============================================================
-- Migration: Add Monthly Crawl Limit Tracking
-- Date: 2026-02-26
-- ============================================================

-- Add monthly crawl tracking columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS monthly_pages_crawled INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pages_crawled_reset_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient reset date lookups
CREATE INDEX IF NOT EXISTS idx_users_pages_crawled_reset 
ON public.users(pages_crawled_reset_at) 
WHERE pages_crawled_reset_at IS NOT NULL;

-- Create helper function to increment monthly crawl counter
CREATE OR REPLACE FUNCTION increment_monthly_pages_crawled(
  user_id uuid,
  pages integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users
  SET monthly_pages_crawled = COALESCE(monthly_pages_crawled, 0) + pages
  WHERE id = user_id;
END;
$$;

-- Add comment documenting the columns
COMMENT ON COLUMN public.users.monthly_pages_crawled IS 'Total pages crawled this month across all sites';
COMMENT ON COLUMN public.users.pages_crawled_reset_at IS 'Timestamp when monthly_pages_crawled was last reset';
