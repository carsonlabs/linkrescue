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
);

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
);
