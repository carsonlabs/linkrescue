# LinkRescue Code Stubs

This document contains the initial code scaffolding for key files in the LinkRescue monorepo.


---

## `packages/database/migrations/001_initial_schema.sql`

```sql
-- Users table (managed by Supabase Auth)
-- Note: This references the auth.users table, we add a public.users table for public profile data.
CREATE TABLE public.users (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    avatar_url text,
    billing_address jsonb,
    payment_method jsonb,
    stripe_customer_id text UNIQUE,
    stripe_subscription_id text UNIQUE,
    stripe_price_id text,
    stripe_current_period_end timestamp with time zone
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.users FOR UPDATE USING (auth.uid() = id);

-- Sites table
CREATE TABLE public.sites (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    domain text NOT NULL UNIQUE,
    ownership_verified boolean DEFAULT false NOT NULL,
    verification_token text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own sites." ON public.sites FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_sites_user_id ON public.sites(user_id);

-- Pages table
CREATE TABLE public.pages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    url text NOT NULL,
    last_crawled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(site_id, url)
);
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage pages on their own sites." ON public.pages
  FOR ALL USING (auth.uid() = (SELECT user_id FROM public.sites WHERE id = site_id));
CREATE INDEX idx_pages_site_id ON public.pages(site_id);

-- Links table
CREATE TYPE link_status AS ENUM ('ok', 'broken', 'redirected', 'unknown');
CREATE TABLE public.links (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    url text NOT NULL,
    status link_status DEFAULT 'unknown' NOT NULL,
    http_code integer,
    redirect_url text,
    last_checked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(page_id, url)
);
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage links on their own sites." ON public.links
  FOR ALL USING (auth.uid() = (SELECT user_id FROM public.sites WHERE id = (SELECT site_id FROM public.pages WHERE id = page_id)));
CREATE INDEX idx_links_page_id ON public.links(page_id);
CREATE INDEX idx_links_status ON public.links(status);

-- Scans table
CREATE TYPE scan_status AS ENUM ('pending', 'running', 'completed', 'failed');
CREATE TABLE public.scans (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    status scan_status DEFAULT 'pending' NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    error_message text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view scans for their own sites." ON public.scans
  FOR ALL USING (auth.uid() = (SELECT user_id FROM public.sites WHERE id = site_id));
CREATE INDEX idx_scans_site_id ON public.scans(site_id);

-- Scan Events/Logs table
CREATE TABLE public.scan_events (
    id bigserial PRIMARY KEY,
    scan_id uuid NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
    level text NOT NULL, -- e.g., 'info', 'warn', 'error'
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.scan_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view scan events for their own sites." ON public.scan_events
  FOR ALL USING (auth.uid() = (SELECT user_id FROM public.sites WHERE id = (SELECT site_id FROM public.scans WHERE id = scan_id)));
CREATE INDEX idx_scan_events_scan_id ON public.scan_events(scan_id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```


---

## `packages/crawler/src/index.ts`

```typescript
import { crawlSite } from './crawl';
import { fetchSitemap } from './sitemap';
import { checkLinks } from './link-checker';
import type { Site } from '@linkrescue/types';

// Main entry point for the crawler package
export async function runScan(site: Site) {
  console.log(`Starting scan for ${site.domain}...`);

  // 1. Get pages to scan
  let urls: string[] = [];
  try {
    const sitemapUrls = await fetchSitemap(`${site.domain}/sitemap.xml`);
    urls = sitemapUrls.slice(0, 100); // Limit for MVP
    console.log(`Found ${urls.length} URLs in sitemap.`);
  } catch (error) {
    console.warn(`Sitemap not found for ${site.domain}, falling back to crawl.`);
    const crawledUrls = await crawlSite(site.domain, 2); // Depth 2
    urls = crawledUrls.slice(0, 100); // Limit for MVP
    console.log(`Crawled ${urls.length} URLs.`);
  }

  // 2. Check links on each page
  const results = await checkLinks(urls, site.domain);
  console.log(`Scan complete. Found ${results.length} total links.`);

  // 3. TODO: Store results in Supabase
  // - Create a `scan` record
  // - For each URL, create/update a `page` record
  // - For each link found, create/update a `link` record with its status

  return results;
}
```

---

## `apps/web/src/app/api/cron/scan/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runScan } from '@linkrescue/crawler';

// This endpoint is triggered by Vercel Cron
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient();

  // 1. Get all verified sites
  const { data: sites, error } = await supabase
    .from('sites')
    .select('*')
    .eq('ownership_verified', true);

  if (error) {
    console.error('Error fetching sites:', error);
    return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 });
  }

  // 2. Trigger a scan for each site
  // In production, this should be a background job system (e.g., Inngest, Vercel Functions)
  // For MVP, we run them sequentially with a timeout.
  for (const site of sites) {
    try {
      // We don't await this to avoid Vercel function timeouts
      // This is NOT robust. A real queue is needed for production.
      runScan(site as any);
    } catch (scanError) {
      console.error(`Failed to scan site ${site.domain}:`, scanError);
    }
  }

  return NextResponse.json({ message: `Triggered scans for ${sites.length} sites.` });
}
```

---

## `apps/web/src/app/(dashboard)/sites/[id]/page.tsx`

```tsx
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { IssuesTable } from '@/components/dashboard/issues-table';

export default async function SiteDetailsPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: site } = await supabase
    .from('sites')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!site) {
    notFound();
  }

  // TODO: Fetch links for the site with 'broken' or 'redirected' status
  const { data: issues, error } = await supabase
    .from('links')
    .select(`
      *,
      pages (url)
    `)
    .in('status', ['broken', 'redirected'])
    // .eq('pages.site_id', params.id) // This join needs to be done properly
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{site.domain}</h1>
        <p className="text-muted-foreground">Here are the latest issues found on your site.</p>
      </div>
      {/* @ts-ignore TODO: Fix type issues */}
      <IssuesTable issues={issues || []} />
    </div>
  );
}
```
