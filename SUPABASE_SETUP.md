# Supabase Setup Guide for LinkRescue

## 1. Create Supabase Project

1. Go to https://supabase.com and sign up/login
2. Click "New Project"
3. Name: `linkrescue` (or whatever you prefer)
4. Choose region closest to your users
5. Database password: Generate a strong password (save this!)
6. Click "Create new project"

## 2. Get Your API Keys

Once the project is created:

1. Go to **Project Settings** → **API**
2. Copy these values for your `.env` file:
   - `NEXT_PUBLIC_SUPABASE_URL`: The "URL" value
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The "anon public" key
   - `SUPABASE_SERVICE_ROLE_KEY`: The "service_role secret" key (⚠️ Keep this secret!)

## 3. Set Up Database Schema

Go to the **SQL Editor** in Supabase dashboard and run these commands:

### Create Tables

```sql
-- Users table (extends Supabase auth.users)
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  stripe_price_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sites table
create table if not exists public.sites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  domain text not null,
  sitemap_url text,
  verified boolean default false,
  verification_token text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, domain)
);

-- Scans table
create table if not exists public.scans (
  id uuid default gen_random_uuid() primary key,
  site_id uuid references public.sites(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  pages_scanned integer default 0,
  links_checked integer default 0,
  broken_links integer default 0,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Pages table (stores crawled pages)
create table if not exists public.pages (
  id uuid default gen_random_uuid() primary key,
  site_id uuid references public.sites(id) on delete cascade not null,
  url text not null,
  last_fetched_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(site_id, url)
);

-- Links table (stores outbound links found on pages)
create table if not exists public.links (
  id uuid default gen_random_uuid() primary key,
  page_id uuid references public.pages(id) on delete cascade not null,
  site_id uuid references public.sites(id) on delete cascade not null,
  href text not null,
  is_affiliate boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(page_id, href)
);

-- Scan results table (detailed results for each link checked)
create table if not exists public.scan_results (
  id uuid default gen_random_uuid() primary key,
  scan_id uuid references public.scans(id) on delete cascade not null,
  link_id uuid references public.links(id) on delete cascade not null,
  issue_type text check (issue_type in ('OK', 'BROKEN', 'TIMEOUT', 'REDIRECT', 'LOST_PARAMS')),
  status_code integer,
  final_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Matches table (AI-generated replacement offers for broken links)
create table if not exists public.matches (
  id uuid default gen_random_uuid() primary key,
  scan_result_id uuid references public.scan_results(id) on delete cascade not null,
  offer_id uuid references public.offers(id) on delete cascade not null,
  match_score integer,
  match_reason text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected', 'applied')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(scan_result_id, offer_id)
);

-- Offers table (affiliate offers for replacement suggestions)
create table if not exists public.offers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  url text not null,
  topic text,
  tags text[],
  affiliate_network text,
  commission_rate decimal(5,2),
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Redirect rules table (user-defined redirect mappings)
create table if not exists public.redirect_rules (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  from_url text not null,
  to_url text not null,
  status text default 'draft' check (status in ('draft', 'pending_approval', 'approved', 'deployed', 'archived')),
  http_status integer default 301,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Guardian settings table (monitoring configuration)
create table if not exists public.guardian_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  enabled boolean default true,
  notify_email boolean default true,
  notify_webhook boolean default false,
  webhook_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

-- Monitoring sources table (external monitoring integrations)
create table if not exists public.monitoring_sources (
  id uuid default gen_random_uuid() primary key,
  site_id uuid references public.sites(id) on delete cascade not null,
  type text not null check (type in ('ga4', 'search_console', 'amazon_api')),
  name text not null,
  credentials jsonb,
  connected boolean default false,
  last_sync_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Scan schedules table (for custom scan frequencies)
create table if not exists public.scan_schedules (
  id uuid default gen_random_uuid() primary key,
  site_id uuid references public.sites(id) on delete cascade not null,
  frequency text not null check (frequency in ('hourly', 'daily', 'weekly', 'monthly')),
  next_run_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(site_id)
);

-- Stripe events table (for webhook idempotency)
create table if not exists public.stripe_events (
  id uuid default gen_random_uuid() primary key,
  stripe_event_id text unique not null,
  event_type text not null,
  processed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Scan events table (for logging scan progress)
create table if not exists public.scan_events (
  id uuid default gen_random_uuid() primary key,
  scan_id uuid references public.scans(id) on delete cascade not null,
  level text not null check (level in ('info', 'warn', 'error')),
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Organizations table
create table if not exists public.organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  stripe_customer_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Organization members table
create table if not exists public.organization_members (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  role text default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(organization_id, user_id)
);

-- Revenue history table
create table if not exists public.revenue_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  date date not null,
  clicks integer default 0,
  conversions integer default 0,
  revenue decimal(10,2) default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date)
);
```

### Create Indexes for Performance

```sql
-- User lookups
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);

-- Site queries
CREATE INDEX idx_sites_user_id ON sites(user_id);
CREATE INDEX idx_sites_verified ON sites(verified_at) WHERE verified_at IS NOT NULL;

-- Page queries
CREATE INDEX idx_pages_site_id ON pages(site_id);
CREATE INDEX idx_pages_last_fetched ON pages(last_fetched_at);

-- Link queries
CREATE INDEX idx_links_page_id ON links(page_id);
CREATE INDEX idx_links_affiliate ON links(is_affiliate) WHERE is_affiliate = true;

-- Scan queries
CREATE INDEX idx_scans_site_id ON scans(site_id);
CREATE INDEX idx_scans_status ON scans(status);
CREATE INDEX idx_scans_created ON scans(created_at DESC);

-- Scan results queries
CREATE INDEX idx_scan_results_scan_id ON scan_results(scan_id);
CREATE INDEX idx_scan_results_issue ON scan_results(issue_type) WHERE issue_type != 'OK';
CREATE INDEX idx_scan_results_link ON scan_results(link_id);

-- Offer queries
CREATE INDEX idx_offers_user_id ON offers(user_id);
CREATE INDEX idx_offers_active ON offers(active) WHERE active = true;

-- Match queries
CREATE INDEX idx_matches_scan_result ON matches(scan_result_id);
CREATE INDEX idx_matches_offer ON matches(offer_id);
CREATE INDEX idx_matches_status ON matches(status);

-- Redirect rule queries
CREATE INDEX idx_redirect_rules_user ON redirect_rules(user_id);
CREATE INDEX idx_redirect_rules_status ON redirect_rules(status);

-- Organization queries
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_org ON organization_members(organization_id);

-- Monitoring queries
CREATE INDEX idx_monitoring_sources_site ON monitoring_sources(site_id);
CREATE INDEX idx_scan_schedules_next_run ON scan_schedules(next_run_at);
```

## 4. Set Up Row Level Security (RLS)

Enable RLS on all tables:

```sql
-- Enable RLS
alter table public.users enable row level security;
alter table public.sites enable row level security;
alter table public.pages enable row level security;
alter table public.links enable row level security;
alter table public.scans enable row level security;
alter table public.scan_results enable row level security;
alter table public.offers enable row level security;
alter table public.matches enable row level security;
alter table public.redirect_rules enable row level security;
alter table public.guardian_settings enable row level security;
alter table public.monitoring_sources enable row level security;
alter table public.scan_schedules enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.revenue_history enable row level security;
alter table public.stripe_events enable row level security;
```

## 5. Create RLS Policies

```sql
-- Users: Users can only read/update their own record
create policy "Users can view own record"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own record"
  on public.users for update
  using (auth.uid() = id);

-- Sites: Users can only CRUD their own sites
create policy "Users can view own sites"
  on public.sites for select
  using (auth.uid() = user_id);

create policy "Users can create sites"
  on public.sites for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sites"
  on public.sites for update
  using (auth.uid() = user_id);

create policy "Users can delete own sites"
  on public.sites for delete
  using (auth.uid() = user_id);

-- Scans: Users can view scans for their sites
create policy "Users can view scans for own sites"
  on public.scans for select
  using (
    site_id in (
      select id from public.sites where user_id = auth.uid()
    )
  );

create policy "Users can create scans for own sites"
  on public.scans for insert
  with check (
    site_id in (
      select id from public.sites where user_id = auth.uid()
    )
  );

-- Scan issues: Users can view issues for their scans
create policy "Users can view issues for own scans"
  on public.scan_issues for select
  using (
    scan_id in (
      select s.id from public.scans s
      join public.sites si on s.site_id = si.id
      where si.user_id = auth.uid()
    )
  );

-- Organizations: Members can view their orgs
create policy "Members can view their organizations"
  on public.organizations for select
  using (
    id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

-- Organization members: Users can view their memberships
create policy "Users can view org memberships"
  on public.organization_members for select
  using (user_id = auth.uid());

-- Revenue history: Users can view their own revenue data
create policy "Users can view own revenue"
  on public.revenue_history for select
  using (user_id = auth.uid());

-- Pages: Users can CRUD pages for their sites
create policy "Users can view pages for own sites"
  on public.pages for select
  using (site_id in (select id from public.sites where user_id = auth.uid()));

create policy "Users can create pages for own sites"
  on public.pages for insert
  with check (site_id in (select id from public.sites where user_id = auth.uid()));

-- Links: Users can CRUD links for their pages
create policy "Users can view links for own sites"
  on public.links for select
  using (page_id in (select p.id from public.pages p join public.sites s on p.site_id = s.id where s.user_id = auth.uid()));

create policy "Users can create links for own sites"
  on public.links for insert
  with check (page_id in (select p.id from public.pages p join public.sites s on p.site_id = s.id where s.user_id = auth.uid()));

-- Scan results: Users can view results for their scans
create policy "Users can view scan results for own sites"
  on public.scan_results for select
  using (scan_id in (select sc.id from public.scans sc join public.sites s on sc.site_id = s.id where s.user_id = auth.uid()));

create policy "Users can create scan results for own sites"
  on public.scan_results for insert
  with check (scan_id in (select sc.id from public.scans sc join public.sites s on sc.site_id = s.id where s.user_id = auth.uid()));

-- Offers: Users can CRUD their own offers
create policy "Users can view own offers"
  on public.offers for select
  using (user_id = auth.uid());

create policy "Users can create offers"
  on public.offers for insert
  with check (user_id = auth.uid());

create policy "Users can update own offers"
  on public.offers for update
  using (user_id = auth.uid());

create policy "Users can delete own offers"
  on public.offers for delete
  using (user_id = auth.uid());

-- Matches: Users can view matches for their scan results
create policy "Users can view matches for own sites"
  on public.matches for select
  using (scan_result_id in (select sr.id from public.scan_results sr join public.scans sc on sr.scan_id = sc.id join public.sites s on sc.site_id = s.id where s.user_id = auth.uid()));

create policy "Users can create matches for own sites"
  on public.matches for insert
  with check (scan_result_id in (select sr.id from public.scan_results sr join public.scans sc on sr.scan_id = sc.id join public.sites s on sc.site_id = s.id where s.user_id = auth.uid()));

create policy "Users can update matches for own sites"
  on public.matches for update
  using (scan_result_id in (select sr.id from public.scan_results sr join public.scans sc on sr.scan_id = sc.id join public.sites s on sc.site_id = s.id where s.user_id = auth.uid()));

-- Redirect rules: Users can CRUD their own redirect rules
create policy "Users can view own redirect rules"
  on public.redirect_rules for select
  using (user_id = auth.uid());

create policy "Users can create redirect rules"
  on public.redirect_rules for insert
  with check (user_id = auth.uid());

create policy "Users can update own redirect rules"
  on public.redirect_rules for update
  using (user_id = auth.uid());

create policy "Users can delete own redirect rules"
  on public.redirect_rules for delete
  using (user_id = auth.uid());

-- Guardian settings: Users can CRUD their own settings
create policy "Users can view own guardian settings"
  on public.guardian_settings for select
  using (user_id = auth.uid());

create policy "Users can create guardian settings"
  on public.guardian_settings for insert
  with check (user_id = auth.uid());

create policy "Users can update own guardian settings"
  on public.guardian_settings for update
  using (user_id = auth.uid());

-- Monitoring sources: Users can CRUD sources for their sites
create policy "Users can view monitoring sources for own sites"
  on public.monitoring_sources for select
  using (site_id in (select id from public.sites where user_id = auth.uid()));

create policy "Users can create monitoring sources"
  on public.monitoring_sources for insert
  with check (site_id in (select id from public.sites where user_id = auth.uid()));

create policy "Users can update monitoring sources for own sites"
  on public.monitoring_sources for update
  using (site_id in (select id from public.sites where user_id = auth.uid()));

-- Scan schedules: Users can CRUD schedules for their sites
create policy "Users can view scan schedules for own sites"
  on public.scan_schedules for select
  using (site_id in (select id from public.sites where user_id = auth.uid()));

create policy "Users can create scan schedules"
  on public.scan_schedules for insert
  with check (site_id in (select id from public.sites where user_id = auth.uid()));

create policy "Users can update scan schedules for own sites"
  on public.scan_schedules for update
  using (site_id in (select id from public.sites where user_id = auth.uid()));

-- Stripe events: Service role only (users can't access)
create policy "Service role can manage stripe events"
  on public.stripe_events for all
  using (false)
  with check (false);

-- Scan events: Users can view events for their scans
create policy "Users can view scan events for own sites"
  on public.scan_events for select
  using (scan_id in (select sc.id from public.scans sc join public.sites s on sc.site_id = s.id where s.user_id = auth.uid()));

create policy "Users can create scan events for own sites"
  on public.scan_events for insert
  with check (scan_id in (select sc.id from public.scans sc join public.sites s on sc.site_id = s.id where s.user_id = auth.uid()));
```

## 6. Create Database Function for New Users

This automatically creates a user record when someone signs up:

```sql
-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call function on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## 7. Enable Email Auth

Go to **Authentication** → **Providers** → **Email**:
- Enable "Email" provider
- Disable "Confirm email" (optional — enables magic links)
- Site URL: `https://your-domain.com` (your production URL)

## 8. Test the Connection

Add the env vars to Vercel and deploy. The test script will verify everything is working.

## Troubleshooting

- **500 errors on API routes**: Check env vars are set correctly
- "**User not found**": The trigger might not be firing — manually create a user record
- "**RLS violation**": Make sure policies are created correctly
- "**Table doesn't exist**": Run the schema SQL again
