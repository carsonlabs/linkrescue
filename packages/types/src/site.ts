export interface Site {
  id: string;
  user_id: string;
  domain: string;
  sitemap_url: string | null;
  verify_token: string;
  verified_at: string | null;
  created_at: string;
}
