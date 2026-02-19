export interface Link {
  id: string;
  site_id: string;
  page_id: string;
  href: string;
  is_affiliate: boolean;
  first_seen_at: string;
}

export interface Page {
  id: string;
  site_id: string;
  url: string;
  last_fetched_at: string | null;
  created_at: string;
}
