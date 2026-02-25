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

-- Scan issues table
create table if not exists public.scan_issues (
  id uuid default gen_random_uuid() primary key,
  scan_id uuid references public.scans(id) on delete cascade not null,
  page_url text not null,
  link_url text not null,
  issue_type text not null check (issue_type in ('broken', 'redirect', 'timeout', 'lost_params')),
  http_status integer,
  affiliate_network text,
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

## 4. Set Up Row Level Security (RLS)

Enable RLS on all tables:

```sql
-- Enable RLS
alter table public.users enable row level security;
alter table public.sites enable row level security;
alter table public.scans enable row level security;
alter table public.scan_issues enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.revenue_history enable row level security;
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
