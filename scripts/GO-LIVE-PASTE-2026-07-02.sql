-- ============================================================================
-- LinkRescue GO-LIVE PASTE — 2026-07-02
-- Target: LinkRescue Supabase project skclpvjkvlqwvkmffemy -> SQL Editor
-- One paste, run once. Everything is idempotent (IF NOT EXISTS / ON CONFLICT).
-- Contents: 013 RLS fix, 014 SEO pages, 015 enum bugfix, 016 blog_posts CMS,
--           June Link Rot Index post, 2 agency posts.
-- ============================================================================

-- ────────────────────────── packages/database/migrations/013_free_scan_results_tighten_rls.sql ──────────────────────────
-- Tighten RLS on free_scan_results.
--
-- Current state (migration 012): `USING (true)` SELECT policy means anyone
-- with the anon Supabase key (which is public, embedded in every browser) can
-- enumerate every free-scan row via a bare REST request:
--     GET /rest/v1/free_scan_results?select=*
-- → leaks every scanned domain + broken-link detail ever submitted.
--
-- Actual usage: inserts and share-page reads both go through the service-role
-- admin client (apps/web/src/app/api/free-scan/route.ts,
-- apps/web/src/app/scan/[id]/page.tsx), so anon access isn't needed.
--
-- This migration swaps the policy: only service_role can read. Existing
-- shareable URLs keep working because the page reads server-side with admin.

DROP POLICY IF EXISTS "Anyone can view scan results" ON free_scan_results;
DROP POLICY IF EXISTS "free_scan_results_service_role" ON free_scan_results;

CREATE POLICY "free_scan_results_service_role"
  ON free_scan_results
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- (No anon/authenticated policies — anon reads are denied by default.)

-- ────────────────────────── packages/database/migrations/014_seed_seo_pages_competitors.sql ──────────────────────────
-- 014_seed_seo_pages_competitors.sql
-- Programmatic SEO: Phase 2 (Sprint 1, June 2026)
-- 4 high-intent competitor comparison pages + 2 missing major-network pages.
-- Competitor facts current as of June 2026 research; phrased defensively in copy.

---------------------------------------------------------------------
-- COMPARISON PAGES
---------------------------------------------------------------------

INSERT INTO public.seo_pages (
  slug, page_type, status, title, meta_description,
  og_title, og_description, canonical_url,
  hero_headline, hero_subheadline,
  content, faq,
  competitor_name, competitor_url, comparison_features,
  published_at
) VALUES

-- 1. LinkRescue vs AMZ Watcher
(
  'amz-watcher',
  'comparison',
  'published',
  'LinkRescue vs AMZ Watcher - Affiliate Link Monitoring Compared | LinkRescue',
  'AMZ Watcher checks Amazon affiliate links. LinkRescue monitors every affiliate network plus your direct partnerships. See the full comparison for multi-network publishers.',
  'LinkRescue vs AMZ Watcher',
  'Amazon-only checking vs full-network affiliate link monitoring.',
  '/vs/amz-watcher',
  'LinkRescue vs AMZ Watcher',
  'AMZ Watcher is a solid tool if every link on your site points at Amazon. Most publishers in 2026 are not that site anymore. Here''s how the two tools compare for a diversified affiliate business.',
  '[
    {"type": "heading", "heading": "The Core Difference: One Network vs All of Them"},
    {"type": "paragraph", "body": "AMZ Watcher was built around the Amazon Associates program: it finds broken Amazon product links, missing affiliate tags, and out-of-stock products, and can suggest matching products on other networks. LinkRescue monitors every monetized outbound link on your site - Amazon, ShareASale, CJ, Awin, Impact, ClickBank, and the direct partnerships that never touch a network."},
    {"type": "paragraph", "body": "That difference matters more every year. After the traffic shake-ups of 2024-2025, surviving publishers diversified hard: the same site now earns from three or four networks plus direct deals, and links live in newsletters and video descriptions as well as blog posts. A checker that only understands Amazon leaves most of that revenue unwatched."},
    {"type": "heading", "heading": "When AMZ Watcher Is the Right Choice"},
    {"type": "list", "items": [
      "Your site is overwhelmingly monetized through Amazon Associates",
      "You want Amazon-specific extras like out-of-stock detection and product availability data",
      "You run a portfolio of pure Amazon affiliate sites and price per page-check works for you"
    ]},
    {"type": "heading", "heading": "When LinkRescue Is the Right Choice"},
    {"type": "list", "items": [
      "You earn from two or more networks (or any direct affiliate partnerships)",
      "You want tracking-parameter verification on every network''s links, not just the Amazon tag",
      "You want revenue-impact estimates so you fix the expensive breaks first",
      "You manage client sites and need white-label reports, an API, and Slack alerts",
      "You want a free tier that monitors a full site weekly without a credit card"
    ]},
    {"type": "callout", "body": "Our June 2026 scan of 50 well-known affiliate sites found broken outbound links on the large majority of them - and most of the broken links were NOT Amazon links. Amazon-only checking catches a shrinking slice of the problem.", "variant": "warning"},
    {"type": "heading", "heading": "Pricing Compared"},
    {"type": "paragraph", "body": "As of mid-2026, AMZ Watcher starts around $19.95/month for 5,000 page checks across 3 sites, with higher tiers around $49.95/month for 20,000 checks. LinkRescue is free for 1 site (200 pages, weekly scans), $29/month for Pro (5 sites, 2,000 pages, daily scans, revenue estimates), and $79/month for Agency (25 sites, hourly scans, API, white-label reports). If your revenue is spread across networks, you get full coverage for a comparable price."}
  ]'::jsonb,
  '[
    {"q": "Does AMZ Watcher check non-Amazon affiliate links?", "a": "AMZ Watcher is built around Amazon Associates. It can suggest replacement products on other networks, but its link checking focuses on Amazon links. LinkRescue checks every outbound affiliate link regardless of network."},
    {"q": "Does LinkRescue verify Amazon affiliate tags like AMZ Watcher does?", "a": "Yes. LinkRescue follows every redirect chain and verifies your Amazon associate tag survives to the final URL, exactly as it does for ShareASale, CJ, Awin, and Impact tracking parameters."},
    {"q": "I only do Amazon. Is AMZ Watcher better for me?", "a": "If you are 100% Amazon and want product-availability extras, AMZ Watcher is a reasonable specialist choice. If there is any chance you diversify networks in the next year - which most surviving publishers are doing - LinkRescue means you will not need a second tool."},
    {"q": "Which tool is better for agencies?", "a": "LinkRescue''s Agency plan includes API access, webhooks, Slack alerts, and white-label client reports at $79/month. AMZ Watcher is priced per page-check volume and does not offer white-label reporting."},
    {"q": "Can I try LinkRescue without a credit card?", "a": "Yes. The free Starter plan monitors one site with weekly scans, no card required, and the free scan tool at linkrescue.io gives you instant results on any URL."}
  ]'::jsonb,
  'AMZ Watcher',
  'https://amzwatcher.com',
  '[
    {"feature": "Amazon Associates link checking", "linkrescue": true, "competitor": true},
    {"feature": "ShareASale / CJ / Awin / Impact checking", "linkrescue": true, "competitor": false},
    {"feature": "Direct-partnership link checking", "linkrescue": true, "competitor": false},
    {"feature": "Tracking-parameter verification on all networks", "linkrescue": true, "competitor": false},
    {"feature": "Amazon out-of-stock detection", "linkrescue": false, "competitor": true},
    {"feature": "Revenue impact estimation", "linkrescue": true, "competitor": false},
    {"feature": "Automated scheduled scans", "linkrescue": true, "competitor": true},
    {"feature": "Site health score and trends", "linkrescue": true, "competitor": false},
    {"feature": "AI-powered fix suggestions", "linkrescue": true, "competitor": false},
    {"feature": "White-label client reports", "linkrescue": "Agency plan", "competitor": false},
    {"feature": "API + webhooks + Slack", "linkrescue": "Agency plan", "competitor": false},
    {"feature": "Free tier", "linkrescue": "1 site, weekly", "competitor": false},
    {"feature": "Starting price", "linkrescue": "Free / $29/mo", "competitor": "~$19.95/mo"}
  ]'::jsonb,
  now()
),

-- 2. LinkRescue vs Affilimate
(
  'affilimate',
  'comparison',
  'published',
  'LinkRescue vs Affilimate - Link Integrity vs Revenue Analytics | LinkRescue',
  'Affilimate is revenue analytics for large publishers. LinkRescue is link integrity monitoring priced for independents and agencies. See which fits your affiliate business.',
  'LinkRescue vs Affilimate',
  'Revenue analytics platform vs link integrity monitor - different jobs, different prices.',
  '/vs/affilimate',
  'LinkRescue vs Affilimate',
  'Affilimate tells you which content earns. LinkRescue makes sure the links inside that content still pay. Here''s how to decide which job you need done - and why many publishers eventually want both.',
  '[
    {"type": "heading", "heading": "Two Different Jobs"},
    {"type": "paragraph", "body": "Affilimate is a commerce analytics platform: it aggregates earnings across networks, attributes revenue to specific pages and links, and powers content optimization for large publishing operations - it is trusted by major media publishers. LinkRescue is an integrity monitor: it crawls your content on a schedule, finds the links that are broken, redirecting wrong, or silently dropping your tracking parameters, and tells you what each issue is likely costing."},
    {"type": "paragraph", "body": "Put simply: Affilimate answers ''what is earning?'' LinkRescue answers ''what is leaking?'' Analytics cannot see the commission you never received because the link 404''d or the SubID got stripped - that revenue simply never appears in any dashboard."},
    {"type": "heading", "heading": "When Affilimate Is the Right Choice"},
    {"type": "list", "items": [
      "You are a large publisher with significant monthly affiliate revenue to optimize",
      "You need cross-network revenue attribution down to the page and link level",
      "You have the budget for a platform that starts around $49-99/month and scales into the hundreds"
    ]},
    {"type": "heading", "heading": "When LinkRescue Is the Right Choice"},
    {"type": "list", "items": [
      "You want every monetized link checked automatically, with alerts when something breaks",
      "You care about attribution integrity: redirect drift, stripped parameters, soft 404s",
      "You are an independent publisher or agency and want to start free or at $29/month",
      "You manage client sites and need white-label link-health reports"
    ]},
    {"type": "callout", "body": "Industry research has found link-rot issues in roughly 40% of affiliate URLs, and affiliate links break at roughly 23% per year. Analytics platforms measure the revenue that arrives - an integrity monitor protects the revenue that never gets the chance.", "variant": "tip"},
    {"type": "heading", "heading": "Pricing Compared"},
    {"type": "paragraph", "body": "As of mid-2026, Affilimate''s published plans start around $49-99/month with higher tiers into the hundreds, aimed at established publishers. LinkRescue is free for one site, $29/month for Pro, and $79/month for Agency. They are priced for different buyers because they do different jobs."}
  ]'::jsonb,
  '[
    {"q": "Is LinkRescue a replacement for Affilimate?", "a": "No - they solve different problems. Affilimate is revenue analytics and attribution. LinkRescue is link integrity monitoring. A large publisher might run both: Affilimate to optimize earning content, LinkRescue to make sure those earnings never silently leak."},
    {"q": "Can Affilimate detect broken affiliate links?", "a": "Affilimate''s focus is revenue tracking and attribution analytics, not scheduled link-integrity crawling. LinkRescue''s entire job is finding broken links, redirect drift, stripped parameters, and soft 404s before they cost you commissions."},
    {"q": "Which is better for a site earning under $10k/month?", "a": "LinkRescue, in most cases. At that revenue level, plugging leaks usually pays back faster than attribution analytics, and the price difference is significant. As you scale, adding analytics makes sense."},
    {"q": "Which is better for agencies?", "a": "LinkRescue Agency includes white-label link-health reports your clients can read in one glance, plus API, webhooks, and Slack alerts at $79/month. Affilimate is aimed at publishers optimizing their own portfolios."},
    {"q": "Do I need either if I have Google Analytics?", "a": "GA shows traffic and outbound clicks, but it cannot tell you a link 404''d, redirected to a homepage, or dropped your affiliate tag - and it certainly cannot estimate the commission impact. That is the integrity gap both of these tools exist to fill, in different ways."}
  ]'::jsonb,
  'Affilimate',
  'https://affilimate.com',
  '[
    {"feature": "Scheduled link integrity scans", "linkrescue": true, "competitor": false},
    {"feature": "Broken link + soft-404 detection", "linkrescue": true, "competitor": false},
    {"feature": "Tracking-parameter verification", "linkrescue": true, "competitor": false},
    {"feature": "Cross-network revenue attribution", "linkrescue": false, "competitor": true},
    {"feature": "Page-level earnings analytics", "linkrescue": false, "competitor": true},
    {"feature": "Revenue impact estimates for broken links", "linkrescue": true, "competitor": false},
    {"feature": "Email alerts on link breakage", "linkrescue": true, "competitor": false},
    {"feature": "White-label client reports", "linkrescue": "Agency plan", "competitor": false},
    {"feature": "API access", "linkrescue": "Agency plan", "competitor": true},
    {"feature": "Free tier", "linkrescue": "1 site, weekly scans", "competitor": false},
    {"feature": "Starting price", "linkrescue": "Free / $29/mo", "competitor": "~$49-99/mo"}
  ]'::jsonb,
  now()
),

-- 3. LinkRescue vs Lasso
(
  'lasso',
  'comparison',
  'published',
  'LinkRescue vs Lasso - Link Monitoring vs Link Display | LinkRescue',
  'Lasso is a WordPress plugin for displaying and managing affiliate links. LinkRescue monitors link health on any platform. Compare features, pricing, and when to use each.',
  'LinkRescue vs Lasso',
  'WordPress link display plugin vs platform-agnostic link health monitoring.',
  '/vs/lasso',
  'LinkRescue vs Lasso',
  'Lasso makes your affiliate links look great inside WordPress. LinkRescue makes sure they still pay - on WordPress, Shopify, Ghost, Webflow, your newsletter, or your YouTube descriptions. Here''s the honest comparison.',
  '[
    {"type": "heading", "heading": "Display Management vs Health Monitoring"},
    {"type": "paragraph", "body": "Lasso is a WordPress plugin for managing how affiliate links appear: product display boxes, comparison tables, link cloaking, and automatic Amazon product data. It is a content presentation tool, and a good one. LinkRescue is a monitoring service: it crawls your published content from the outside, checks every monetized link''s real-world behavior, and alerts you when something breaks or stops attributing."},
    {"type": "paragraph", "body": "Because LinkRescue works from the outside, it is platform-agnostic. Shopify blog, Ghost newsletter, Webflow site, a YouTube channel''s description links - if it is reachable by URL, it can be monitored. A WordPress plugin can only see WordPress."},
    {"type": "heading", "heading": "When Lasso Is the Right Choice"},
    {"type": "list", "items": [
      "You run WordPress and want beautiful product boxes and comparison tables",
      "You want centralized link management and cloaking inside wp-admin",
      "You want Amazon product data (prices, images) pulled into your displays automatically"
    ]},
    {"type": "heading", "heading": "When LinkRescue Is the Right Choice"},
    {"type": "list", "items": [
      "You publish anywhere besides (or in addition to) WordPress",
      "You want scheduled, automated link health checks with alerts - not just management",
      "You want redirect-chain and tracking-parameter verification on every network",
      "You want an outside-in view: what do your links actually do when a reader clicks them today?",
      "You manage multiple sites or clients and need consolidated reporting"
    ]},
    {"type": "callout", "body": "Plugin-based link management and outside-in link monitoring are complementary. Several LinkRescue users run Lasso for display and LinkRescue as the watchdog that catches what changed since publication.", "variant": "tip"},
    {"type": "heading", "heading": "Pricing Compared"},
    {"type": "paragraph", "body": "As of mid-2026, Lasso is sold as an annual WordPress plugin subscription (roughly $299/year and up depending on plan and sites). LinkRescue is free for one site, $29/month for Pro (5 sites), and $79/month for Agency (25 sites) - billed monthly, cancel anytime."}
  ]'::jsonb,
  '[
    {"q": "Does Lasso check for broken affiliate links?", "a": "Lasso includes basic link health features for the links it manages inside WordPress. It cannot monitor links on non-WordPress platforms, verify tracking parameters through full redirect chains from the outside, or estimate revenue impact the way a dedicated monitor does."},
    {"q": "Does LinkRescue work on WordPress?", "a": "Yes - LinkRescue monitors any publicly reachable site, WordPress included. It does not require a plugin; it crawls your site the way a visitor (or a search engine) reaches it."},
    {"q": "I publish on Ghost / Shopify / Webflow. Which tool works?", "a": "LinkRescue. Lasso is WordPress-only. LinkRescue is platform-agnostic because it monitors from the outside."},
    {"q": "Can I use Lasso and LinkRescue together?", "a": "Yes, and it is a sensible combination: Lasso manages how links display in WordPress, LinkRescue independently verifies that every link still resolves and attributes correctly, and alerts you when something changes."},
    {"q": "Which is cheaper?", "a": "LinkRescue''s free tier covers one site with weekly scans. Paid plans are $29/month (Pro) and $79/month (Agency), billed monthly. Lasso is an annual subscription starting around $299/year as of mid-2026."}
  ]'::jsonb,
  'Lasso',
  'https://getlasso.co',
  '[
    {"feature": "Works outside WordPress (any platform)", "linkrescue": true, "competitor": false},
    {"feature": "Product display boxes and tables", "linkrescue": false, "competitor": true},
    {"feature": "Link cloaking / pretty links", "linkrescue": false, "competitor": true},
    {"feature": "Scheduled outside-in link health scans", "linkrescue": true, "competitor": false},
    {"feature": "Redirect-chain + parameter verification", "linkrescue": true, "competitor": false},
    {"feature": "Revenue impact estimation", "linkrescue": true, "competitor": false},
    {"feature": "Amazon product data in displays", "linkrescue": false, "competitor": true},
    {"feature": "Email alerts on breakage", "linkrescue": true, "competitor": false},
    {"feature": "Multi-site / client reporting", "linkrescue": "Agency plan", "competitor": "Higher plans"},
    {"feature": "Monthly billing", "linkrescue": true, "competitor": false},
    {"feature": "Free tier", "linkrescue": "1 site, weekly scans", "competitor": false},
    {"feature": "Starting price", "linkrescue": "Free / $29/mo", "competitor": "~$299/yr"}
  ]'::jsonb,
  now()
),

-- 4. LinkRescue vs Dr. Link Check
(
  'dr-link-check',
  'comparison',
  'published',
  'LinkRescue vs Dr. Link Check - Affiliate-Aware vs Generic Link Checking | LinkRescue',
  'Dr. Link Check finds broken links. LinkRescue finds broken REVENUE: affiliate-aware checking, parameter verification, and dollar impact estimates. Full comparison.',
  'LinkRescue vs Dr. Link Check',
  'Generic broken-link checking vs affiliate revenue protection.',
  '/vs/dr-link-check',
  'LinkRescue vs Dr. Link Check',
  'Dr. Link Check is a capable general-purpose broken link checker. LinkRescue exists because affiliate links fail in ways a generic checker reports as ''working fine.'' Here''s the difference.',
  '[
    {"type": "heading", "heading": "A 200 Status Code Can Still Cost You Money"},
    {"type": "paragraph", "body": "Generic link checkers like Dr. Link Check test whether a URL responds. That catches 404s and server errors - genuinely useful. But the most expensive affiliate link failures return a perfectly healthy 200: the redirect that lands on the merchant''s homepage instead of the product, the chain that silently drops your ?tag= or SubID parameter, the page that says ''this product is no longer available'' with a smile. Your tracking is gone, your commission is gone, and your link checker says everything is fine."},
    {"type": "paragraph", "body": "LinkRescue classifies every monetized link''s real outcome: broken (4xx/5xx), redirect-to-home, lost parameters, soft 404, and content changes - and estimates what each issue costs you per month so you fix the expensive ones first."},
    {"type": "heading", "heading": "When Dr. Link Check Is Enough"},
    {"type": "list", "items": [
      "You run a non-monetized site and just want 404s cleaned up",
      "You need an occasional one-off audit rather than continuous monitoring",
      "Your outbound links carry no tracking parameters worth protecting"
    ]},
    {"type": "heading", "heading": "When You Need LinkRescue"},
    {"type": "list", "items": [
      "Your outbound links earn commissions and carry tracking parameters",
      "You want redirect chains followed to the final destination with parameters verified",
      "You want soft-404 detection (the ''product unavailable'' pages that return 200)",
      "You want automated scheduled scans with alerts, plus dollar-impact prioritization",
      "You report to clients and need white-label link health reports"
    ]},
    {"type": "callout", "body": "In our June 2026 study of 50 popular affiliate sites, a meaningful share of revenue-affecting issues were NOT simple 404s - they were redirect-to-home and stripped-parameter failures that generic checkers pass as healthy.", "variant": "warning"},
    {"type": "heading", "heading": "Pricing Compared"},
    {"type": "paragraph", "body": "Dr. Link Check offers a free tier for small checks with paid plans for larger sites. LinkRescue is free for one site (200 pages, weekly), $29/month for Pro, $79/month for Agency. If your links earn money, the question is not the tool price - it is the cost of the week you spend not knowing a top link is broken."}
  ]'::jsonb,
  '[
    {"q": "What does LinkRescue catch that a generic checker misses?", "a": "Redirect-to-homepage failures, stripped tracking parameters (your tag or SubID vanishing mid-redirect), soft 404s that return a 200 status, and content changes on destination pages. Each of these reads as ''healthy'' to a status-code checker."},
    {"q": "Is Dr. Link Check cheaper?", "a": "For small one-off checks, Dr. Link Check''s free tier is genuinely useful. For continuous monitoring of monetized links, LinkRescue''s free tier covers one site weekly, and paid plans start at $29/month with affiliate-specific detection a generic checker does not attempt."},
    {"q": "Can I just run a free checker monthly instead?", "a": "You can, but affiliate links break at roughly 23% per year, and every day a top link is broken is unrecoverable commission. Automated daily or weekly scans with alerts exist precisely because manual checking always slips."},
    {"q": "Does LinkRescue also catch normal broken links?", "a": "Yes - all 4xx/5xx detection is included, on every outbound link. The affiliate-specific checks are added on top, not instead."},
    {"q": "Which is better for agencies?", "a": "LinkRescue Agency: 25 sites, hourly scans, API, webhooks, Slack alerts, and white-label reports built for sending to clients."}
  ]'::jsonb,
  'Dr. Link Check',
  'https://www.drlinkcheck.com',
  '[
    {"feature": "Broken link detection (4xx/5xx)", "linkrescue": true, "competitor": true},
    {"feature": "Affiliate link identification", "linkrescue": true, "competitor": false},
    {"feature": "Tracking-parameter verification", "linkrescue": true, "competitor": false},
    {"feature": "Redirect-to-home detection", "linkrescue": true, "competitor": false},
    {"feature": "Soft-404 detection", "linkrescue": true, "competitor": false},
    {"feature": "Revenue impact estimation", "linkrescue": true, "competitor": false},
    {"feature": "Scheduled automated monitoring", "linkrescue": true, "competitor": true},
    {"feature": "Email alerts", "linkrescue": true, "competitor": true},
    {"feature": "White-label reports", "linkrescue": "Agency plan", "competitor": false},
    {"feature": "API + webhooks", "linkrescue": "Agency plan", "competitor": false},
    {"feature": "Free tier", "linkrescue": "1 site, weekly scans", "competitor": "Limited checks"},
    {"feature": "Starting price", "linkrescue": "Free / $29/mo", "competitor": "Free / paid plans"}
  ]'::jsonb,
  now()
)
ON CONFLICT (page_type, slug) DO NOTHING;

---------------------------------------------------------------------
-- NETWORK CHECK PAGES
---------------------------------------------------------------------

INSERT INTO public.seo_pages (
  slug, page_type, status, title, meta_description,
  og_title, og_description, canonical_url,
  hero_headline, hero_subheadline,
  content, faq,
  network_name, network_url, network_commission, network_cookie_days,
  published_at
) VALUES

-- 5. Awin
(
  'awin',
  'network_check',
  'published',
  'Awin Affiliate Link Checker | LinkRescue',
  'Free tool to check your Awin affiliate links for broken URLs, expired advertiser programs, and stripped click references. Protect your Awin commissions automatically.',
  'Awin Affiliate Link Checker',
  'Scan your Awin affiliate links for broken URLs, dead advertiser programs, and lost tracking.',
  '/check/awin',
  'Check Your Awin Affiliate Links',
  'Awin connects you to thousands of advertisers - and every advertiser that leaves, migrates platforms, or restructures its catalog quietly kills the links in your back catalog. Scan your site to find them.',
  '[
    {"type": "heading", "heading": "Why Awin Links Break"},
    {"type": "paragraph", "body": "Awin (which also operates ShareASale) hosts a huge and constantly changing advertiser base, and it has become the network of choice for many content creators - creator revenue share on the network has been growing fast. The flip side of a dynamic network: advertisers join, leave, merge, and migrate constantly. When an advertiser exits the network, every awin1.com link you ever published for them dies or redirects somewhere useless - and nothing notifies you."},
    {"type": "heading", "heading": "Common Awin Link Issues"},
    {"type": "list", "items": [
      "Advertiser left the network - deep links 404 or bounce to an error page",
      "Destination product or category page removed - link resolves but the offer is gone",
      "Redirect chains that drop your clickref / SubID values, breaking your reporting",
      "Cross-device or geo redirects that land on a homepage instead of the product",
      "Old campaign URLs from expired promotions still embedded in evergreen content"
    ]},
    {"type": "callout", "body": "Industry research has found link-rot issues in roughly 40% of affiliate URLs. Back-catalog content with Awin deep links is especially exposed because advertiser churn compounds year over year.", "variant": "warning"},
    {"type": "heading", "heading": "How LinkRescue Monitors Awin Links"},
    {"type": "paragraph", "body": "LinkRescue identifies Awin tracking domains and deep-link formats, follows every redirect to the final destination, and verifies the destination is a real offer page - not a 404, a soft 404, or the advertiser''s homepage. It also checks that your clickref parameters survive the journey, so your sub-tracking keeps working."},
    {"type": "list", "items": [
      "Detects dead deep links from departed advertisers",
      "Flags redirect-to-home failures that quietly zero your conversion rate",
      "Verifies clickref / SubID parameters survive the full redirect chain",
      "Estimates monthly revenue at risk per broken link so you fix the worst first",
      "Alerts you by email (and Slack on Agency) when something breaks"
    ]},
    {"type": "heading", "heading": "Getting Started"},
    {"type": "paragraph", "body": "Run a free scan at linkrescue.io - paste your site URL and get results in about a minute. The free Starter plan then monitors one site weekly so future advertiser departures get caught automatically."}
  ]'::jsonb,
  '[
    {"q": "Does LinkRescue detect when an advertiser leaves Awin?", "a": "LinkRescue detects the symptom that matters: your links to that advertiser stop resolving to valid offer pages. Whether the advertiser left, migrated, or restructured, you get an alert with the affected pages listed."},
    {"q": "Does it check ShareASale links too?", "a": "Yes - ShareASale (an Awin company) has its own dedicated checker page and full support. All major networks are covered in every scan."},
    {"q": "Will my clickref values be verified?", "a": "Yes. LinkRescue follows the full redirect chain and confirms your tracking parameters are present at the destination. Stripped parameters are flagged as LOST_PARAMS issues."},
    {"q": "How often should I scan?", "a": "Weekly minimum (free plan). Sites with large back catalogs or active Awin campaigns should scan daily (Pro), because advertiser churn is continuous."},
    {"q": "Is there a free way to check right now?", "a": "Yes - the free scan at linkrescue.io checks your site instantly, no signup required for results."}
  ]'::jsonb,
  'Awin',
  'https://www.awin.com',
  'Varies by advertiser (typically 3-12%)',
  30,
  now()
),

-- 6. Rakuten Advertising
(
  'rakuten-advertising',
  'network_check',
  'published',
  'Rakuten Advertising Affiliate Link Checker | LinkRescue',
  'Check your Rakuten Advertising (LinkShare) affiliate links for broken URLs, dead merchant programs, and lost tracking parameters. Free scan, automatic monitoring.',
  'Rakuten Advertising Affiliate Link Checker',
  'Scan your Rakuten affiliate links for broken URLs, departed merchants, and tracking loss.',
  '/check/rakuten-advertising',
  'Check Your Rakuten Advertising Affiliate Links',
  'Rakuten Advertising powers affiliate programs for major retail brands. Big brands restructure constantly - seasonal catalogs, replatforms, agency changes - and each one can orphan the deep links in your content.',
  '[
    {"type": "heading", "heading": "Why Rakuten Links Break"},
    {"type": "paragraph", "body": "Rakuten Advertising (formerly LinkShare) specializes in large retail brands. That is great for commission quality and brand trust - and risky for link longevity. Enterprise retailers replatform their e-commerce stacks, prune product catalogs seasonally, and run frequent URL restructures. Every one of those events can break the deep links sitting in your published content, while the tracking redirect still happily fires."},
    {"type": "heading", "heading": "Common Rakuten Link Issues"},
    {"type": "list", "items": [
      "Deep link resolves through tracking but lands on a 404 at the merchant",
      "Product discontinued - destination redirects to a category page or homepage",
      "Merchant left the network - links die network-wide overnight",
      "U1/SubID tracking values dropped during redirect chains",
      "Seasonal campaign URLs that expire while your content keeps sending clicks"
    ]},
    {"type": "callout", "body": "The nastiest failure mode: the Rakuten redirect works (so the click registers) but the merchant page is dead (so the conversion is impossible). Your reports show clicks with zero conversions and you blame the content. It is the link.", "variant": "warning"},
    {"type": "heading", "heading": "How LinkRescue Monitors Rakuten Links"},
    {"type": "paragraph", "body": "LinkRescue recognizes Rakuten tracking domains and deep-link structures, follows the full chain to the merchant''s final page, and validates that page is a live offer - catching 404s, soft 404s, and redirect-to-home failures that click reports never reveal. Your U1/SubID parameters are verified end to end."},
    {"type": "list", "items": [
      "Follows tracking redirects to the true merchant destination",
      "Detects dead product pages behind working tracking links",
      "Flags redirect-to-home and soft-404 failures",
      "Verifies U1 / SubID parameter survival",
      "Estimates revenue at risk and alerts you when issues appear"
    ]},
    {"type": "heading", "heading": "Getting Started"},
    {"type": "paragraph", "body": "Run a free scan at linkrescue.io to see your Rakuten link health in about a minute. Add your site to the free plan for weekly automated monitoring, or Pro for daily scans across up to five sites."}
  ]'::jsonb,
  '[
    {"q": "My Rakuten clicks show fine but conversions dropped. Could links be the cause?", "a": "Very possibly. The tracking redirect can succeed (registering the click) while the merchant destination is dead or redirected to a homepage (making conversion impossible). That exact pattern is what LinkRescue''s redirect-to-home and soft-404 detection exists for."},
    {"q": "Does LinkRescue support LinkShare legacy URLs?", "a": "Yes - older LinkShare-era tracking domains and formats are recognized and followed to their final destinations."},
    {"q": "Are U1 / SubID parameters checked?", "a": "Yes. LinkRescue verifies your tracking and sub-tracking parameters survive every hop of the redirect chain."},
    {"q": "What happens when a merchant leaves Rakuten?", "a": "All your links for that merchant break at once. With scheduled scans, LinkRescue catches the wave on the next scan and emails you the full list of affected pages so you can re-link or remove."},
    {"q": "Can I check a site for free?", "a": "Yes - the free scan at linkrescue.io gives instant results, and the free Starter plan monitors one site weekly, no credit card required."}
  ]'::jsonb,
  'Rakuten Advertising',
  'https://rakutenadvertising.com',
  'Varies by merchant (typically 2-10%)',
  30,
  now()
)
ON CONFLICT (page_type, slug) DO NOTHING;

-- ────────────────────────── packages/database/migrations/015_issue_type_enum_additions.sql ──────────────────────────
-- 015: Bring the issue_type enum up to date with the application code.
--
-- Two problems fixed:
--
-- 1. LATENT BUG: the crawler has written 'SOFT_404' and 'CONTENT_CHANGED'
--    since Phase 3, but migration 001's enum never included them. Those
--    scan_results inserts fail silently (the insert error is unchecked in
--    runScan), so soft-404 and content-change detections have been dropped
--    in production this whole time.
--
-- 2. NEW VALUE: 'BLOCKED' — destinations that refuse automated checks
--    (403 / 405 / 429 even after a GET retry). The scanner currently
--    persists these as 'OK' so dashboards don't report false positives;
--    adding the enum value now prepares the schema for first-class
--    blocked-link visibility once the dashboard query audit is done.
--
-- ALTER TYPE ... ADD VALUE IF NOT EXISTS is safe to re-run.

ALTER TYPE issue_type ADD VALUE IF NOT EXISTS 'SOFT_404';
ALTER TYPE issue_type ADD VALUE IF NOT EXISTS 'CONTENT_CHANGED';
ALTER TYPE issue_type ADD VALUE IF NOT EXISTS 'BLOCKED';

-- ────────────────────────── packages/database/migrations/016_blog_posts_cms.sql ──────────────────────────
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

-- ────────────────────────── scripts/insert-june-index.sql ──────────────────────────
-- LinkRescue CMS — publish the June 2026 Link Rot Index
-- Target: LinkRescue Supabase project skclpvjkvlqwvkmffemy (CMS home moved here by migration 016)
-- Safe to re-run: ON CONFLICT (slug) DO UPDATE. Generated by scripts/generate-index-insert.js
-- Source: content/blog/link-rot-index-june-2026.md (H1 + authoring comments stripped)

INSERT INTO blog_posts (
  slug, title, author, tags, category, seo_title, meta_description, content, status, sites, published_at
) VALUES (
  'link-rot-index-june-2026',
  'The Link Rot Index — June 2026',
  'Carson Roell',
  ARRAY['link rot','affiliate links','data study','link rot index','affiliate marketing'],
  'data',
  'The Link Rot Index — June 2026: 6,550 Affiliate Links Audited',
  'We scanned 50 well-known affiliate sites (683 pages, 6,550 outbound links): 9.1% had broken affiliate attribution, 5.8% were dead or timed out, and 4.7% were bot-blocked. The first monthly public dataset on affiliate link health.',
  $lrindex$> **The first monthly public dataset on affiliate link health.** Every month we scan 50 well-known affiliate sites with the same crawler that powers LinkRescue, and publish exactly what we find. No estimates, no vendor hand-waving — counted links, stated methodology, repeatable next month.

Affiliate links fail silently. The page still loads, the post still ranks, the click still happens — and the commission never arrives. Nobody publishes real numbers on how often this happens, so we started counting.

This month's scan covers household names of affiliate publishing — the travel bloggers, finance sites, and gear reviewers everyone in this industry has read. If it's happening to them, it's happening to you.


## The June 2026 numbers

We scanned **50 well-known affiliate sites** (683 pages, **6,550 outbound links checked**) on June 11, 2026.

| What we found | Links | % of checked |
|---|---|---|
| Broken links (4xx - page gone or invalid) | 171 | 2.6% |
| Server errors (5xx) | 82 | 1.3% |
| Timeouts (no answer in 10s) | 127 | 1.9% |
| **Affiliate tracking stripped (params lost)** | **569** | **8.7%** |
| Redirects to homepage (offer gone) | 28 | 0.4% |
| Bot-blocked / unverifiable by automated checkers (403/405/429) | 308 | 4.7% |

**Attribution failures alone (stripped params + homepage redirects): 597 links - 9.1% of every link checked.** These return healthy status codes. No generic link checker flags them. The commission just quietly stops.

### Per-site reality

- Median issues per site: **27** (across the 34 sites that returned substantive data)
- Sites with zero broken links: **3 of 34**
- Worst site we scanned: **31 broken links** (theplanetd.com)

### By niche (issue rate on checked links)

| Niche | Sites | Links checked | Issues | Rate |
|---|---|---|---|---|
| misc | 6 | 627 | 157 | 25.0% |
| travel | 8 | 1,062 | 222 | 20.9% |
| finance | 6 | 514 | 84 | 16.3% |
| marketing | 5 | 568 | 88 | 15.5% |
| pet | 2 | 375 | 57 | 15.2% |
| food | 5 | 759 | 106 | 14.0% |
| tech | 5 | 798 | 109 | 13.7% |
| outdoor | 5 | 906 | 92 | 10.2% |
| home | 5 | 585 | 54 | 9.2% |
| fitness | 3 | 356 | 8 | 2.2% |

### The ten leakiest sites this month

| Site | Links checked | HTTP broken | Attribution issues |
|---|---|---|---|
| gardeningknowhow.com | 203 | 1 | 66 |
| expertvagabond.com | 288 | 30 | 31 |
| travelfreak.com | 225 | 4 | 54 |
| makeuseof.com | 323 | 16 | 37 |
| smartpassiveincome.com | 308 | 15 | 37 |
| thephoblographer.com | 166 | 14 | 37 |
| millennialmoney.com | 214 | 16 | 33 |
| howtogeek.com | 301 | 10 | 39 |
| theplanetd.com | 225 | 31 | 15 |
| cleverhiker.com | 204 | 5 | 41 |

### Methodology

- 50/50 target sites scanned (23 returned partial results under a 100-second per-site budget).
- 16 of 50 panel sites returned little or no crawlable data this month (bot walls, dead domains, or crawl limits). Per-site stats cover the 34 sites with 3+ pages — we publish this number every month.
- 11,676 outbound links found; 6,550 checked within budget. All rates are computed on checked links only.
- Every link was requested with HEAD, retried with GET on suspicious responses, redirects followed up to 5 hops, and tracking parameters compared on the final URL.
- Bot-blocked responses (403/405/429 after a GET retry) are reported separately and are NOT counted as broken.
- Scanner: the same open crawler that powers LinkRescue (npx linkrescue).


## The stat nobody else can show you

Look at that bold row again: **stripped tracking parameters**. These links work. A reader clicks, lands on the right product, maybe even buys. The status code says 200. Every generic link checker on earth calls this link healthy.

But somewhere in the redirect chain — a merchant replatform, a link shortener update, an http-to-https hop — the `?tag=`, `clickref`, or SubID that attributes the sale to *you* fell off. The merchant gets the sale. You get nothing. Forever, on every click, until someone notices.

There is no dashboard where this shows up. Your analytics show outbound clicks. The network shows no conversions. You conclude the content "doesn't convert" and move on, while a perfectly good link donates your commissions to the void.

That's the failure mode we built LinkRescue around, and it's why this index exists.

## The finding that should worry everyone: the bot-block number

A meaningful share of outbound links in our scan couldn't be verified by an automated checker at all — the destination servers block or refuse non-human requests (403s, refused HEAD requests, rate limits).

Here's why that matters beyond methodology: **AI shopping assistants are automated requesters too.** Buyers are already completing purchases inside ChatGPT and Gemini. When an assistant evaluates whether to recommend a product behind one of your links, a destination that stonewalls automated traffic is a destination that may simply not exist as far as the agent is concerned. The same wall that blocks our checker blocks the agent economy.

We'll be tracking this number every month. Our bet: the publishers who win the next five years are the ones whose monetized links are verifiable — by checkers, by crawlers, and by the shopping agents that increasingly stand between buyers and products.

## Three fixes you can make this week

1. **Re-check your top 10 earning pages first.** Link failures follow traffic. The median site in our scan had multiple issues; yours likely concentrates where the money is. Fix order: highest-traffic page, oldest links first.
2. **Stop trusting status codes.** A 200 with stripped parameters earns you nothing, and a redirect to the merchant's homepage converts at approximately zero. Click your top affiliate links and look at the *final URL* — is your tag still in it? Is it still the product page?
3. **Put monitoring on a schedule.** Links break continuously — merchants leave networks, products sunset, URL structures change. A one-time cleanup decays immediately. Weekly automated checking is the minimum viable defense.

Or let us do all three: **[run the free scan](https://www.linkrescue.io/free-scan)** — it checks your site against every failure mode in this index in about a minute. No email required to see results.

## About this index

The Link Rot Index is published monthly by [LinkRescue](https://www.linkrescue.io), the link integrity monitor for affiliate publishers and agencies. Same 50-site panel, same methodology, every month — so the trend lines mean something. July's edition will add month-over-month deltas.

Want your niche included in next month's panel, or want to challenge a number? Email hello@linkrescue.io — methodology disputes make the index better.
$lrindex$,
  'published',
  ARRAY['linkrescue'],
  '2026-06-15T13:00:00Z'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  tags = EXCLUDED.tags,
  category = EXCLUDED.category,
  seo_title = EXCLUDED.seo_title,
  meta_description = EXCLUDED.meta_description,
  content = EXCLUDED.content,
  status = EXCLUDED.status,
  sites = EXCLUDED.sites,
  published_at = EXCLUDED.published_at;

-- Verify
SELECT slug, title, status, sites, published_at
FROM blog_posts
WHERE slug = 'link-rot-index-june-2026';

-- ────────────────────────── scripts/insert-agency-posts.sql ──────────────────────────
-- LinkRescue CMS — insert 2 agency-ICP blog posts
-- Target: LinkRescue Supabase project skclpvjkvlqwvkmffemy (CMS home moved here by migration 016)
-- Run in the Supabase SQL Editor. Safe to re-run: ON CONFLICT DO UPDATE.
--
-- Source markdown (for reference):
--   C:/DEV/linkrescue/content/blog/affiliate-agency-client-audit-playbook.md
--   C:/DEV/linkrescue/content/blog/white-label-link-monitoring-agencies.md

-- =============================================================
-- Post 1: The Affiliate Agency Playbook — Auditing 25 Client Sites in One Afternoon
-- =============================================================
INSERT INTO blog_posts (
  slug,
  title,
  author,
  tags,
  category,
  seo_title,
  meta_description,
  content,
  status,
  sites,
  published_at
) VALUES (
  'affiliate-agency-client-audit-playbook',
  'The Affiliate Agency Playbook: Auditing 25 Client Sites in One Afternoon (2026)',
  'Carson Roell',
  ARRAY['affiliate agency', 'client audit', 'link rot', 'agency workflow', 'monitoring'],
  'agency',
  'Affiliate Agency Playbook: Audit 25 Client Sites in One Afternoon',
  'A step-by-step playbook for affiliate agencies managing multiple client sites. How to audit 25 client sites in one afternoon, turn the findings into recurring revenue, and never get caught off-guard by a broken link again.',
  $content1$# The Affiliate Agency Playbook: Auditing 25 Client Sites in One Afternoon

If you run an affiliate agency — the kind that manages 5, 10, or 25 client sites — link rot is a problem you cannot outrun manually. Every client's content compounds. Every month, more links, more pages, more ways for revenue to quietly leak out.

The agencies we've talked to fall into one of three camps:

1. **The "we'll check if a client asks" agency.** Never audits proactively. Gets blindsided once or twice a year when a client notices their earnings dropped.
2. **The "we spot-check manually" agency.** A few hours per client per quarter. Misses 80% of breakage between audits.
3. **The monitored agency.** Knows the health of every client site at any moment. Bills for it.

This post is a practical playbook for becoming the third kind.

---

## Why Agencies Lose More to Link Rot Than Solo Creators

A solo affiliate with 50 pages can sort of get by with a manual check every few months. The math changes completely when you manage 25 clients with 500 pages each.

**At 25 clients × 500 pages = 12,500 pages to audit.** If you manually check one page per minute (optimistic), that's 208 hours — five full work weeks — to audit everything once. By the time you're done, the pages you checked first are already stale.

Worse, the blast radius of a missed broken link scales with client size. A broken Amazon link on a small solo site loses $30/month. The same broken link on an agency-managed authority site can lose **$2,000+/month** before anyone notices.

Agencies that monetize on a percentage-of-client-revenue or retainer + bonus model are directly losing their own income every hour those links stay broken.

---

## The 4-Hour Agency Audit — Step by Step

Here's the exact process for getting from "no idea what's broken" to "complete visibility across all 25 client sites" in one focused afternoon.

### Hour 1: Import + Baseline Scan

Add every client site to LinkRescue Agency ($79/mo — 25 sites, unlimited pages, hourly scans). The initial scan runs in parallel, so all 25 sites start checking at once.

While the scan runs:

- **Tag every site** with the client name, their affiliate network (Amazon Associates, ShareASale, CJ, Impact, custom), and their retainer tier.
- **Set priority levels.** High-revenue clients should scan hourly. Lower-revenue can run daily. Free clients on your newsletter list can run weekly.
- **Add webhook endpoints** for your Slack workspace. Every broken link posts to a channel by client tag.

Most 500-page client sites complete the first scan in 15-25 minutes on the Agency tier. Don't stare at the progress bar — go to hour 2.

### Hour 2: Triage the First Wave

By the end of hour 1, you'll have a list of broken links per client. Sort by **estimated revenue impact,** not count. One broken Amazon link on a top-ranking page beats 50 broken links on archived content.

A useful triage matrix:

| Priority | Criteria | Action |
|---|---|---|
| **P0 — Fix today** | Top-10 traffic page, high-commission product, currently earning | Personally fix or hand to the client as a "we found this" win |
| **P1 — Fix this week** | Mid-traffic page, active affiliate, recoverable with a replacement link | Add to the weekly client report |
| **P2 — Monitor** | Low-traffic page, seasonal product, niche network | Let the monitoring system watch it |
| **P3 — Archive** | No traffic, outdated content, deprecated program | Flag for client to decide: fix or remove |

For each P0 you find on day one, **screenshot it for your next client review.** "We caught 4 broken links on your top-earning review page this morning — here's what they were and what we replaced them with" is worth more than any dashboard you could show them.

### Hour 3: Set Up Recurring Intelligence

This is the part most agencies skip. Finding broken links once is not a service — it's a one-time audit. The recurring value is the monitoring infrastructure on top.

Configure for each client:

- **Hourly scans** on their top 50 revenue pages (use page tags to bucket these).
- **Daily full-site scans** on the remaining pages.
- **Slack alerts** for any broken link on a tagged revenue page (skip the low-priority noise).
- **Monthly white-label health report** auto-emailed to the client with your agency logo, sent on the 1st.
- **Quarterly health score trend** — is their link rot getting better or worse over time?

If a client has a CMS you can access (WordPress, Webflow), also set up a scheduled monthly "fix sweep" where you batch-replace known broken links during a 2-hour block. Charge for this as a line item or roll it into the retainer.

### Hour 4: Write the Client-Facing Playbook

The audit is worthless if clients don't know what you did. In your final hour, write a one-page doc for each tier of client:

- **For high-touch retainer clients:** "We now monitor your site hourly. Here's the dashboard link, the health score as of today, and the 3 things we fixed this week."
- **For lower-tier clients:** Monthly white-label report explaining what was scanned, what was found, what was fixed, estimated revenue protected.
- **For prospects:** "Free site health audit" — run a single scan, turn the output into a branded PDF, use it as a lead magnet for your next sales conversation.

You now have the monitoring infrastructure, the client-facing deliverable, and the recurring deliverable that justifies a higher retainer.

---

## What Agencies Actually Charge for This

Agencies that bolt monitoring onto an existing retainer typically add **$200-500/month per client** for "link health monitoring + monthly report + priority fix window."

Run that math on 10 clients:

- 10 clients × $300/month = **$3,000/month recurring**
- Your cost on the Agency tier: **$79/month**
- Net margin: **$2,921/month** for something that runs automatically

Even at 5 clients you're 3x'ing the tool cost every month, with a deliverable that genuinely protects client revenue.

[See what's included on the Agency plan →](https://linkrescue.io/pricing)

---

## The Specific Features That Matter for Agencies

A lot of link checkers exist. Most of them are built for solo bloggers scanning one site at a time. The pieces that actually matter when you're running an agency:

### Unlimited pages per scan

Solo tools often cap pages (200, 500, 1000). Agency sites can exceed this on a single category. If you're scanning a 2,000-page authority site, you need no cap.

### Hourly scan frequency

Weekly scanning is fine for a solo affiliate. For an agency managing clients whose revenue peaks during seasonal campaigns (Black Friday, holiday, back-to-school), you need hourly visibility. A broken link on December 1st shouldn't wait until December 8th to get caught.

### White-label monthly reports

Clients don't want to log into someone else's dashboard. They want a PDF with your agency logo on it, sent to their inbox on the 1st of every month, showing the work you did.

### API + webhooks

You will want to pipe broken link events into whatever internal tooling you already have — project management (Asana, Linear, ClickUp), Slack, your own client reporting dashboard. The API and webhook endpoints make this straightforward.

### Revenue impact estimates

Clients care about dollars, not link counts. A tool that says "3 broken links" isn't useful. A tool that says "3 broken links, estimated $420/month in recoverable commissions" justifies your retainer.

---

## The One-Page Sales Talking Point

When a prospect asks "what do I get for the retainer," here's the line:

> "We monitor every affiliate link on your site every hour, catch issues within minutes of them breaking, and fix them during our weekly fix windows. Last month we caught X broken links across Y pages and protected an estimated $Z in monthly commissions. You get a white-label health report on the 1st of every month."

That's a real service, not a vague "we manage your affiliate stuff."

---

## Who Should Run This Playbook

This workflow pays for itself at **3 clients or more.** If you manage 10+, it's negligent not to have something like this running.

If you manage a single site (your own), the Pro tier is enough. If you manage 5-25 clients, this is what the Agency tier was built for.

[Start a free Agency trial →](https://linkrescue.io/pricing)

---

## Further Reading

- [The Silent Revenue Killer](/blog/silent-revenue-killer) — the foundation for why link rot matters in the first place
- [25 Affiliate Sites Scanned: 27% Broken Link Rate](/blog/50-affiliate-sites-link-rot-study) — the data study behind the "it's worse than you think" claim
- [Case Study: Recovering $2,400/Year from Broken Links](/blog/case-study-revenue-recovery) — what a single site audit recovers; multiply by your client count
$content1$,
  'published',
  ARRAY['linkrescue'],
  '2026-04-21T12:00:00Z'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  tags = EXCLUDED.tags,
  category = EXCLUDED.category,
  seo_title = EXCLUDED.seo_title,
  meta_description = EXCLUDED.meta_description,
  content = EXCLUDED.content,
  status = EXCLUDED.status,
  sites = EXCLUDED.sites,
  published_at = EXCLUDED.published_at;

-- =============================================================
-- Post 2: White-Label Link Monitoring for Affiliate Agencies
-- =============================================================
INSERT INTO blog_posts (
  slug,
  title,
  author,
  tags,
  category,
  seo_title,
  meta_description,
  content,
  status,
  sites,
  published_at
) VALUES (
  'white-label-link-monitoring-agencies',
  'White-Label Link Monitoring: What Every Affiliate Agency Should Be Sending Clients',
  'Carson Roell',
  ARRAY['white label', 'affiliate agency', 'client reporting', 'agency tools', 'monitoring'],
  'agency',
  'White-Label Link Monitoring Reports for Affiliate Agencies (2026)',
  'Your clients don''t want to log into another dashboard. They want a branded report in their inbox. Here''s what a good white-label link health report looks like — and why it''s the easiest retainer upsell you''ll ever make.',
  $content2$# White-Label Link Monitoring: What Every Affiliate Agency Should Be Sending Clients

Here's a quiet truth about agency-client relationships: **clients don't want another dashboard.**

They don't want to log into yet another SaaS tool to check if their site is healthy. They don't want to learn your stack. They don't want to bookmark yet another URL. What they want is for you — the agency they are paying — to just tell them it's being handled.

This post is about one specific tool in the agency toolkit that nails this: **the white-label monthly link health report.**

---

## What It Is

A white-label link health report is a branded PDF (or email, or both) that you send to each client once a month, showing:

- How many pages on their site were scanned
- How many total affiliate links are being monitored
- Their site health score (0-100) and the trend
- Any broken links caught and fixed during the period
- Estimated monthly commissions protected
- What's scheduled for next month

It is **stamped with your agency's logo, colors, and contact info** — not LinkRescue's, not anyone else's. As far as the client is concerned, you built this entire monitoring system in-house.

That framing matters. It is the difference between "my agency uses a tool" and "my agency is a tool."

---

## Why Clients Love It

Three reasons, in order of how much they actually matter:

### 1. It's proactive proof of work

Every agency struggles to make their work visible between major deliverables. Clients don't see the 40 small fixes, the weekly crawls, the monitoring setup. A monthly report is a recurring, tangible artifact that says "here is what I did for you this month."

It's the agency equivalent of a mechanic photographing the brake pads before they replace them. The work was going to happen either way. The photo is what makes it real.

### 2. It puts numbers on something abstract

"Your site is healthy" is vague. "Your site scored 92/100 this month, up from 87 last month, with 4 broken links caught and an estimated $380 in monthly commissions protected" is **quantified.** Clients can forward that number to their bookkeeper, their spouse, their board.

It also gives you a number to refer back to when they ask "what am I paying you for?" You don't have to be defensive. The number is right there.

### 3. It justifies the retainer

The single hardest conversation in an agency's life is the retainer review conversation. "Is the agency still earning its fee?" Clients ask this every 3-6 months.

A monthly white-label report that shows the value delivered — in dollars, in health scores, in broken links fixed — kills this conversation before it starts. Renewal becomes automatic.

---

## What a Good Report Actually Includes

Here's a template that works. The specifics should match your brand voice, but the shape should look something like this:

### Section 1: Executive Summary (1 paragraph, top of page 1)

> *"In April 2026, we scanned 1,847 pages across yourclientsite.com and monitored 12,430 outbound affiliate links across 14 networks. We detected 7 broken links on high-traffic pages and replaced them within 4 hours of detection. Estimated monthly commission protected: $640. Your site health score is 94/100, up from 91 last month."*

One paragraph. Skimmable. Numbers front and center.

### Section 2: Health Score Trend

A simple line chart showing the health score over the last 6 months. Upward trend = client feels good. Flat trend = system is working. Downward trend = flag it and explain (new content, network issue, seasonal traffic).

### Section 3: Issues Found + Resolved

A short table:

| Date | Page | Issue | Resolution |
|---|---|---|---|
| Apr 3 | /best-hiking-boots | Amazon ASIN returning 404 | Replaced with equivalent product, saved $85/mo |
| Apr 12 | /camping-gear-2026 | ShareASale redirect loop | Regenerated tracking link |
| Apr 18 | /tent-reviews | Affiliate program discontinued | Replaced with competing program |

Only show real items. If there were no issues this month, say so — a "0 issues" report is still a useful report because it proves you're watching.

### Section 4: Revenue Impact

The dollars. "Estimated monthly commission protected: $X." "Cumulative protected since monitoring began: $Y." This is the number that justifies your retainer.

### Section 5: What's Scheduled Next Month

Forward-looking. Sets expectations:

- Hourly scans continuing on top 50 pages
- Full-site scan weekly
- Deep audit planned for Week 3
- New affiliate network being added to monitoring

### Section 6: Footer with Contact Info

Your agency logo. Your agency contact. Your agency's URL. Not LinkRescue's.

---

## How to Actually Produce These Reports

Three options, in order of effort:

### Option 1: Auto-generated (easiest)

The LinkRescue Agency tier ($79/mo) generates white-label monthly reports automatically. You upload your agency logo, set your brand colors, pick the send date, and reports ship to every tagged client on the 1st of each month.

You can stop reading here if this is all you need. Total setup time: ~15 minutes for all clients, forever.

### Option 2: Auto-generated + manual commentary (better)

Same as above, but you add a one-paragraph human note at the top of each report: "Hey [Client Name], quick note — we noticed your holiday content is starting to drive traffic already, we'll tighten the scan frequency starting next week."

Takes an extra 5 minutes per client per month. Dramatically increases retention because it proves there's a human in the loop.

### Option 3: Hand-built (best for top clients)

For your highest-tier clients, take the auto-generated data and drop it into your agency's own deck template. Add screenshots of specific fixes, commentary, next-month strategy. Turns a $300/mo retainer client into a $1,000/mo retainer client.

Pick one option per client tier.

---

## The Sales Script That Sells the Upsell

When you go back to existing clients to add monitoring + reporting to their retainer, this works:

> *"We've started offering monthly link health monitoring to our retainer clients. It's an extra $[200-500]/month and you'll get a report on the 1st of every month showing exactly what was monitored, what was fixed, and how much commission we protected. Most of our clients are recovering 3-5x the cost from broken links alone. Want me to set it up?"*

Close rate on this pitch, from agencies we've talked to, runs 40-60% on existing retainer clients. Because the pitch is: "I'll protect money you're already losing, and send you proof every month."

---

## The Tool Decision

You don't need white-label link monitoring from LinkRescue specifically. You need it from *someone.*

But here's the practical checklist of what to look for:

- **Unlimited pages** on scan (most competitors cap at 500-1000)
- **Custom branding** on reports (logo + colors, not just a small "powered by" label)
- **API access** so you can pipe into your existing agency tools
- **Hourly scan** option for high-priority clients
- **Revenue impact estimates** baked into the reports
- **Flat-rate pricing** that scales to 25+ client sites without per-site fees

LinkRescue's Agency tier hits all six at $79/month flat. If you're comparing vendors, make sure whatever you pick hits at least four of these.

[See the Agency plan details →](https://linkrescue.io/pricing)

---

## The Honest Summary

White-label monthly reports are not a new idea. They've been standard in SEO agencies for 15 years and PPC agencies for a decade. Affiliate agencies are late to adopt them, which means **there's still an edge for the agencies that move first.**

If you're running 5+ client sites and not sending monthly health reports, you're leaving retention money on the table. The clients who cancel next quarter cancel because they forgot what you were doing for them. A report every 30 days is the cheapest retention insurance in the industry.

---

## Related Reading

- [The Agency Playbook: Auditing 25 Client Sites in One Afternoon](/blog/affiliate-agency-client-audit-playbook) — the operational side
- [The Silent Revenue Killer](/blog/silent-revenue-killer) — the foundation for why link rot matters
- [Case Study: Recovering $2,400/Year from Broken Links](/blog/case-study-revenue-recovery) — single-site numbers; multiply by your client count
$content2$,
  'published',
  ARRAY['linkrescue'],
  '2026-04-21T12:30:00Z'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  tags = EXCLUDED.tags,
  category = EXCLUDED.category,
  seo_title = EXCLUDED.seo_title,
  meta_description = EXCLUDED.meta_description,
  content = EXCLUDED.content,
  status = EXCLUDED.status,
  sites = EXCLUDED.sites,
  published_at = EXCLUDED.published_at;

-- =============================================================
-- Verify
-- =============================================================
SELECT slug, title, published_at, status, sites
FROM blog_posts
WHERE slug IN (
  'affiliate-agency-client-audit-playbook',
  'white-label-link-monitoring-agencies'
)
ORDER BY published_at DESC;
