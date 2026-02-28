-- Seed known affiliate programs for network intelligence
-- Run after 003_health_scores_and_trends.sql

INSERT INTO public.affiliate_programs (name, domain, url_patterns, category) VALUES
  ('Amazon Associates', 'amazon.com', ARRAY['amzn.to', 'amazon.com/dp/', 'amazon.com/gp/'], 'marketplace'),
  ('ShareASale', 'shareasale.com', ARRAY['shareasale.com/r.cfm', 'shareasale.com/u.cfm'], 'network'),
  ('CJ Affiliate', 'cj.com', ARRAY['anrdoezrs.net', 'dpbolvw.net', 'jdoqocy.com', 'kqzyfj.com', 'tkqlhce.com'], 'network'),
  ('Impact', 'impact.com', ARRAY['sjv.io', 'pntra.com', 'pntrs.com', 'pntrac.com'], 'network'),
  ('Rakuten', 'rakuten.com', ARRAY['click.linksynergy.com', 'rakuten.com/shop/'], 'network'),
  ('ClickBank', 'clickbank.com', ARRAY['hop.clickbank.net', 'clickbank.net'], 'network'),
  ('Awin', 'awin.com', ARRAY['awin1.com', 'zenaps.com'], 'network'),
  ('FlexOffers', 'flexoffers.com', ARRAY['track.flexlinkspro.com'], 'network'),
  ('Partnerize', 'partnerize.com', ARRAY['prf.hn'], 'network'),
  ('eBay Partner Network', 'ebay.com', ARRAY['rover.ebay.com', 'ebay.us'], 'marketplace'),
  ('Walmart', 'walmart.com', ARRAY['goto.walmart.com'], 'marketplace'),
  ('Target', 'target.com', ARRAY['goto.target.com'], 'marketplace'),
  ('Shopify', 'shopify.com', ARRAY['shopify.pxf.io'], 'saas'),
  ('Bluehost', 'bluehost.com', ARRAY['bluehost.com/track/'], 'hosting'),
  ('SiteGround', 'siteground.com', ARRAY['siteground.com/go/'], 'hosting'),
  ('Hostinger', 'hostinger.com', ARRAY['hostinger.com?REFERRALCODE='], 'hosting'),
  ('NordVPN', 'nordvpn.com', ARRAY['go.nordvpn.net'], 'vpn'),
  ('ExpressVPN', 'expressvpn.com', ARRAY['expressvpn.com/order'], 'vpn'),
  ('Semrush', 'semrush.com', ARRAY['semrush.sjv.io', 'semrush.com/lp/'], 'seo'),
  ('Ahrefs', 'ahrefs.com', ARRAY['ahrefs.com/signup'], 'seo')
ON CONFLICT (domain) DO NOTHING;
