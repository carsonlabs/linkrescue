-- Users table (managed by Supabase Auth)
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
    domain text NOT NULL,
    sitemap_url text,
    verify_token text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, domain)
);
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own sites." ON public.sites FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_sites_user_id ON public.sites(user_id);

-- Pages table
CREATE TABLE public.pages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    url text NOT NULL,
    last_fetched_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(site_id, url)
);
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage pages on their own sites." ON public.pages
  FOR ALL USING (auth.uid() = (SELECT user_id FROM public.sites WHERE id = site_id));
CREATE INDEX idx_pages_site_id ON public.pages(site_id);

-- Links table
CREATE TABLE public.links (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    href text NOT NULL,
    is_affiliate boolean DEFAULT false NOT NULL,
    first_seen_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(page_id, href)
);
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage links on their own sites." ON public.links
  FOR ALL USING (auth.uid() = (SELECT user_id FROM public.sites WHERE id = site_id));
CREATE INDEX idx_links_page_id ON public.links(page_id);
CREATE INDEX idx_links_site_id ON public.links(site_id);

-- Scans table
CREATE TYPE scan_status AS ENUM ('pending', 'running', 'completed', 'failed');
CREATE TABLE public.scans (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    status scan_status DEFAULT 'pending' NOT NULL,
    started_at timestamp with time zone,
    finished_at timestamp with time zone,
    pages_scanned integer DEFAULT 0 NOT NULL,
    links_checked integer DEFAULT 0 NOT NULL,
    error_message text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view scans for their own sites." ON public.scans
  FOR ALL USING (auth.uid() = (SELECT user_id FROM public.sites WHERE id = site_id));
CREATE INDEX idx_scans_site_id ON public.scans(site_id);

-- Scan Results table
CREATE TYPE issue_type AS ENUM ('OK', 'BROKEN_4XX', 'SERVER_5XX', 'TIMEOUT', 'REDIRECT_TO_HOME', 'LOST_PARAMS');
CREATE TABLE public.scan_results (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    scan_id uuid NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
    link_id uuid NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
    status_code integer,
    final_url text,
    redirect_hops integer DEFAULT 0 NOT NULL,
    issue_type issue_type DEFAULT 'OK' NOT NULL,
    checked_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.scan_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view scan results for their own sites." ON public.scan_results
  FOR ALL USING (auth.uid() = (
    SELECT s.user_id FROM public.sites s
    JOIN public.scans sc ON sc.site_id = s.id
    WHERE sc.id = scan_id
  ));
CREATE INDEX idx_scan_results_scan_id ON public.scan_results(scan_id);
CREATE INDEX idx_scan_results_link_id ON public.scan_results(link_id);
CREATE INDEX idx_scan_results_issue_type ON public.scan_results(issue_type);

-- Scan Events/Logs table
CREATE TABLE public.scan_events (
    id bigserial PRIMARY KEY,
    scan_id uuid NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
    level text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.scan_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view scan events for their own sites." ON public.scan_events
  FOR ALL USING (auth.uid() = (
    SELECT s.user_id FROM public.sites s
    JOIN public.scans sc ON sc.site_id = s.id
    WHERE sc.id = scan_id
  ));
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
