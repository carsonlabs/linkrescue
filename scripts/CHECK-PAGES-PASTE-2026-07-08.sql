-- CHECK-PAGES-PASTE-2026-07-08.sql
-- Two new /check network pages: Amazon Associates (highest keyword volume:
-- "amazon affiliate link checker" ~1,200/mo) + ShareASale (~400/mo, plus the
-- Awin-consolidation hook). Format matches migration 014; facts phrased
-- defensively; study stats from the committed June dataset only.
-- Safe to re-run: ON CONFLICT (page_type, slug) DO NOTHING.
-- Paste into the linkrescue Supabase SQL editor (project skclpvjkvlqwvkmffemy).

INSERT INTO public.seo_pages (
  slug, page_type, status, title, meta_description,
  og_title, og_description, canonical_url,
  hero_headline, hero_subheadline,
  content, faq,
  network_name, network_url, network_commission, network_cookie_days,
  published_at
) VALUES

-- Amazon Associates
(
  'amazon-associates',
  'network_check',
  'published',
  'Amazon Affiliate Link Checker | LinkRescue',
  'Free tool to check your Amazon Associates links for dead ASINs, soft-404 "dog pages", and stripped affiliate tags. Scan your whole site in about a minute.',
  'Amazon Affiliate Link Checker',
  'Scan your Amazon Associates links for dead ASINs, soft 404s, and missing tags.',
  '/check/amazon-associates',
  'Check Your Amazon Associates Links',
  'Amazon retires thousands of products every month. When an ASIN dies, your link often keeps returning HTTP 200 - straight onto a "Sorry, we couldn''t find that page" screen that no ordinary link checker flags. Scan your site and find every one.',
  '[
    {"type": "heading", "heading": "Why Amazon Links Break Differently"},
    {"type": "paragraph", "body": "Most affiliate links die loudly - a 404, a dead domain. Amazon links die quietly. A discontinued ASIN frequently resolves with a normal 200 status onto Amazon''s error page (the famous \"dog page\"), so generic broken-link checkers wave it through. Your reader lands on an apology screen, your commission lands nowhere, and your analytics show a healthy outbound click."},
    {"type": "heading", "heading": "Common Amazon Associates Link Issues"},
    {"type": "list", "items": [
      "Discontinued ASINs that soft-404 onto the dog page with a 200 status",
      "Out-of-stock or third-party-only listings that no longer convert",
      "Affiliate tags stripped by URL shorteners, plugins, or redirect chains",
      "Old search-result and category URLs from restructured campaigns",
      "International visitors landing on the wrong marketplace without your tag"
    ]},
    {"type": "callout", "body": "In our June 2026 Link Rot Index (50 established affiliate sites, 6,550 links checked) links that \"work\" but lose their affiliate attribution were 9.1% of all links - outnumbering visibly broken links at 5.8%. Amazon''s soft-404 behavior is a big reason the invisible kind leads.", "variant": "warning"},
    {"type": "heading", "heading": "How LinkRescue Checks Amazon Links"},
    {"type": "paragraph", "body": "LinkRescue crawls your published pages, follows every Amazon link through its full redirect chain, and checks the destination content - not just the status code. Soft 404s and dog pages are detected as SOFT_404 issues even when Amazon returns 200. It also verifies your associate tag is still present at the final URL, so a shortener or plugin that quietly drops it gets caught."},
    {"type": "list", "items": [
      "Detects dog-page soft 404s that status-code checkers miss",
      "Verifies your tag survives every redirect hop to the final URL",
      "Works alongside every other network you use - one scan covers Amazon, ShareASale, CJ, Awin, Impact, and direct partnerships",
      "Estimates revenue at risk per issue so you fix the expensive ones first",
      "Free Starter plan re-scans your site weekly, automatically"
    ]},
    {"type": "heading", "heading": "Getting Started"},
    {"type": "paragraph", "body": "Run a free scan at linkrescue.io - paste your site URL and get results in about a minute, no signup required to see them. The free Starter plan then monitors one site weekly so the next discontinued ASIN gets caught the week it happens, not the year after."}
  ]'::jsonb,
  '[
    {"q": "Can LinkRescue detect Amazon dog pages that return HTTP 200?", "a": "Yes. LinkRescue checks destination content, not just status codes, so discontinued-ASIN pages are flagged as SOFT_404 issues even though Amazon serves them with a 200."},
    {"q": "Does it verify my associate tag is intact?", "a": "Yes. Every Amazon link is followed through its full redirect chain and the associate tag must be present at the final URL. Links that lost their tag are flagged as attribution issues - in our June study that failure mode outnumbered broken links."},
    {"q": "How is this different from AMZ Watcher?", "a": "AMZ Watcher is a good Amazon-only specialist. LinkRescue checks Amazon with comparable depth and every other network in the same scan - see our full comparison at /vs/amz-watcher."},
    {"q": "How often should Amazon links be scanned?", "a": "Daily if Amazon is a large share of your revenue (Pro plan) - ASIN state changes constantly. The free plan''s weekly scan is a solid baseline for smaller sites."},
    {"q": "Is there a free way to check right now?", "a": "Yes - the free scan at linkrescue.io checks your site instantly, no signup required for results."}
  ]'::jsonb,
  'Amazon Associates',
  'https://affiliate-program.amazon.com',
  'Varies by category (typically 1-10%)',
  1,
  now()
),

-- ShareASale
(
  'shareasale',
  'network_check',
  'published',
  'ShareASale Affiliate Link Checker | LinkRescue',
  'Check your ShareASale affiliate links for dead merchants, broken r.cfm redirects, and lost afftrack values - especially urgent as ShareASale consolidates onto the Awin platform.',
  'ShareASale Affiliate Link Checker',
  'Scan your ShareASale links for dead merchants, broken redirects, and lost tracking.',
  '/check/shareasale',
  'Check Your ShareASale Affiliate Links',
  'ShareASale is consolidating onto the Awin platform - and every merchant migration is a moment where legacy shareasale.com links in your back catalog can quietly stop paying. If you''ve published ShareASale links over the years, now is exactly the time to audit them.',
  '[
    {"type": "heading", "heading": "Why ShareASale Links Deserve an Audit Right Now"},
    {"type": "paragraph", "body": "ShareASale (an Awin company) has been consolidating onto Awin''s platform, with merchants migrating over time. Migrations of this scale are where old tracking links go to die: a merchant''s links may redirect correctly, redirect without your tracking, or stop resolving entirely - and which of those happens to YOUR links depends on the merchant, the migration timing, and how old the link format is. Nothing notifies you either way."},
    {"type": "heading", "heading": "Common ShareASale Link Issues"},
    {"type": "list", "items": [
      "Legacy r.cfm links from merchants that migrated, merged, or left",
      "Redirect chains that drop afftrack / SubID values, breaking your reporting",
      "Deep links that resolve to the merchant''s homepage instead of the product",
      "Merchants that paused or closed their program - links die network-wide overnight",
      "Seasonal campaign URLs from expired promotions still live in evergreen posts"
    ]},
    {"type": "callout", "body": "In our June 2026 Link Rot Index (50 established affiliate sites, 6,550 links), lost tracking parameters were 58% of all issues found - the single biggest failure mode, ahead of every kind of visible breakage. Platform migrations are exactly how parameters get lost.", "variant": "warning"},
    {"type": "heading", "heading": "How LinkRescue Monitors ShareASale Links"},
    {"type": "paragraph", "body": "LinkRescue recognizes ShareASale''s tracking domains and link formats, follows every redirect to the final destination, and verifies two things: the destination is a real offer page (not a 404, soft 404, or homepage bounce), and your afftrack / SubID values survived the journey. Issues come with an estimated monthly revenue impact so you fix the worst first."},
    {"type": "list", "items": [
      "Detects dead links from departed or migrated merchants",
      "Flags redirect-to-home failures that quietly zero your conversion rate",
      "Verifies afftrack / SubID parameters survive the full redirect chain",
      "Covers your Awin links in the same scan - one audit spans the whole consolidation",
      "Alerts you by email (and Slack on Agency) when something breaks"
    ]},
    {"type": "heading", "heading": "Getting Started"},
    {"type": "paragraph", "body": "Run a free scan at linkrescue.io - paste your site URL and get results in about a minute. If the migration has already cost you links, you''ll see exactly which pages to fix; the free Starter plan then watches for the next wave automatically."}
  ]'::jsonb,
  '[
    {"q": "Will my ShareASale links break when a merchant moves to Awin?", "a": "It depends on the merchant and migration - some links redirect cleanly, some lose tracking, some die. That uncertainty is the point: scan, don''t assume. LinkRescue flags exactly which of your links still resolve to valid offer pages with tracking intact."},
    {"q": "Does LinkRescue check Awin links too?", "a": "Yes - Awin has its own checker page (/check/awin) and full support. One scan covers ShareASale, Awin, Amazon, CJ, Impact, and direct partnerships together, which matters mid-consolidation."},
    {"q": "Are my afftrack values verified?", "a": "Yes. LinkRescue follows the full redirect chain and confirms your tracking parameters are present at the destination. Stripped parameters are flagged as LOST_PARAMS issues - the most common failure type in our June study."},
    {"q": "How often should I scan?", "a": "During an active platform consolidation, daily (Pro) if ShareASale merchants are meaningful revenue. Weekly (free plan) at minimum."},
    {"q": "Is there a free way to check right now?", "a": "Yes - the free scan at linkrescue.io checks your site instantly, no signup required for results."}
  ]'::jsonb,
  'ShareASale',
  'https://www.shareasale.com',
  'Varies by merchant',
  30,
  now()
)

ON CONFLICT (page_type, slug) DO NOTHING;

-- Verify
SELECT slug, page_type, status FROM public.seo_pages
WHERE slug IN ('amazon-associates','shareasale');
