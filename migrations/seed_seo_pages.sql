-- Seed SEO pages for programmatic content
-- Run this after the seo_pages table exists

-- ══════════════════════════════════════════════════════════════════════
-- Network Check Pages (/check/[network])
-- ══════════════════════════════════════════════════════════════════════

INSERT INTO seo_pages (slug, page_type, status, title, meta_description, hero_headline, hero_subheadline, network_name, network_url, network_commission, network_cookie_days, content, faq, published_at) VALUES

('amazon', 'network_check', 'published',
 'Amazon Affiliate Link Checker — Detect Broken Links & Lost Tags | LinkRescue',
 'Free tool to check your Amazon affiliate links for broken URLs, stripped tracking tags, and redirect issues. Catch revenue leaks before they cost you.',
 'Amazon Affiliate Link Checker',
 'Detect broken Amazon links, stripped tracking tags, and redirect-to-homepage issues before they cost you commissions.',
 'Amazon Associates', 'https://affiliate-program.amazon.com', '1-10%', 24,
 '[{"type":"text","body":"Amazon affiliate links are notoriously fragile. Product pages get discontinued, ASINs change, and redirect chains can strip your tracking tag. A single broken link on a high-traffic review page can silently leak hundreds of dollars in commissions per month."},{"type":"text","body":"LinkRescue monitors your Amazon affiliate links continuously — detecting broken product pages, stripped ?tag= parameters, and suspicious redirect-to-homepage patterns that other link checkers miss."},{"type":"heading","body":"Common Amazon Link Issues"},{"type":"list","items":["Product discontinued (404) — the ASIN no longer exists","Redirect to homepage — Amazon sends you to amazon.com instead of the product","Tag parameter stripped — your ?tag=yourtag gets removed during redirects","Geo-redirect issues — links break for international visitors","Shortened links expiring — amzn.to links can stop resolving"]}]'::jsonb,
 '[{"q":"How often should I check my Amazon affiliate links?","a":"We recommend daily checks for sites with 50+ affiliate links. Amazon product pages change frequently — products go out of stock, get discontinued, or change ASINs. LinkRescue Pro runs daily automated scans."},{"q":"Can LinkRescue detect if my Amazon tag is being stripped?","a":"Yes. LinkRescue follows the full redirect chain and checks if your ?tag= parameter survives all hops. This is a common issue with Amazon links that most generic link checkers miss."},{"q":"Does this work with Amazon international stores?","a":"Yes. LinkRescue checks links to all Amazon domains (amazon.com, amazon.co.uk, amazon.de, etc.) and detects geo-redirect issues."}]'::jsonb,
 now()),

('shareasale', 'network_check', 'published',
 'ShareASale Link Checker — Monitor Affiliate Links for Breakage | LinkRescue',
 'Check your ShareASale affiliate links for broken merchants, expired deals, and stripped tracking parameters. Automated monitoring.',
 'ShareASale Affiliate Link Checker',
 'Monitor your ShareASale links for broken merchants, expired offers, and tracking parameter issues.',
 'ShareASale', 'https://www.shareasale.com', '5-50%', 30,
 '[{"type":"text","body":"ShareASale merchants come and go — when a merchant leaves the network or changes their program, your affiliate links break silently. LinkRescue catches these before your readers hit dead pages."},{"type":"heading","body":"Common ShareASale Link Issues"},{"type":"list","items":["Merchant left the network — links redirect to ShareASale error page","Program terms changed — commission structure or cookie duration modified","Deep links broken — specific product pages moved or removed","Tracking parameters stripped during redirect chain"]}]'::jsonb,
 '[{"q":"What happens when a ShareASale merchant leaves the network?","a":"The links typically redirect to a generic ShareASale page or return a 404. LinkRescue detects both scenarios and alerts you immediately."},{"q":"Can I monitor deep links to specific products?","a":"Yes. LinkRescue checks the full URL including deep link paths and query parameters, not just the root domain."}]'::jsonb,
 now()),

('cj', 'network_check', 'published',
 'CJ Affiliate Link Checker — Detect Broken Commission Junction Links | LinkRescue',
 'Monitor your CJ (Commission Junction) affiliate links for broken advertisers, expired campaigns, and tracking issues.',
 'CJ Affiliate Link Checker',
 'Detect broken CJ affiliate links, expired advertisers, and commission-killing redirect issues.',
 'CJ Affiliate', 'https://www.cj.com', '5-30%', 45,
 '[{"type":"text","body":"CJ Affiliate (formerly Commission Junction) links use complex redirect chains through multiple domains (jdoqocy.com, tkqlhce.com, dpbolvw.net). These multi-hop redirects are especially prone to parameter stripping and breakage."},{"type":"heading","body":"Why CJ Links Break"},{"type":"list","items":["Advertiser paused or left the program","Campaign expired or seasonal offer ended","Redirect domain changes (CJ rotates tracking domains)","Deep link path changed on advertiser site","SID/PID parameters stripped during redirects"]}]'::jsonb,
 '[{"q":"Does LinkRescue understand CJ redirect domains?","a":"Yes. We recognize all CJ tracking domains (jdoqocy.com, tkqlhce.com, dpbolvw.net, anrdoezrs.net, kqzyfj.com) and follow the full redirect chain through to the advertiser."}]'::jsonb,
 now()),

('impact', 'network_check', 'published',
 'Impact Affiliate Link Checker — Monitor Impact.com Partner Links | LinkRescue',
 'Check your Impact.com affiliate and partner links for broken URLs, expired campaigns, and tracking issues.',
 'Impact.com Link Checker',
 'Monitor your Impact partner links for broken URLs, tracking issues, and expired campaigns.',
 'Impact', 'https://impact.com', '5-50%', 30,
 '[{"type":"text","body":"Impact.com powers affiliate programs for major brands like Uber, Airbnb, and thousands of DTC companies. Their tracking links use sophisticated redirect chains that can break when campaigns end or advertisers update their sites."},{"type":"heading","body":"Common Impact Link Issues"},{"type":"list","items":["Campaign ended — partner link returns error","Brand left Impact platform","Click tracking URL expired","Deep link destination moved or removed","irclickid parameter stripped during redirects"]}]'::jsonb,
 '[{"q":"How do Impact tracking links work?","a":"Impact uses click tracking URLs that redirect through their servers before landing on the advertiser site. LinkRescue follows the full chain and verifies the final destination is working."}]'::jsonb,
 now()),

('awin', 'network_check', 'published',
 'Awin Affiliate Link Checker — Monitor Awin Partner Links | LinkRescue',
 'Check your Awin affiliate links for broken advertisers, expired programs, and tracking parameter issues.',
 'Awin Affiliate Link Checker',
 'Detect broken Awin links, expired advertisers, and stripped tracking parameters.',
 'Awin', 'https://www.awin.com', '5-50%', 30,
 '[{"type":"text","body":"Awin is one of the largest affiliate networks globally, with thousands of advertisers across every vertical. Their tracking links route through awin1.com, and breakage typically happens when advertisers change their website structure or leave the network."},{"type":"heading","body":"Common Awin Issues"},{"type":"list","items":["Advertiser left Awin network","Deep link destination removed","Tracking parameters lost during redirect chain","Geo-targeting issues for international traffic","awc parameter stripped by advertiser redirects"]}]'::jsonb,
 '[{"q":"Does LinkRescue detect Awin advertiser departures?","a":"Yes. When an Awin advertiser leaves the network, their tracking links typically return an error or redirect to a generic page. LinkRescue detects this and flags it immediately."}]'::jsonb,
 now()),

('rakuten', 'network_check', 'published',
 'Rakuten Advertising Link Checker — Monitor Affiliate Links | LinkRescue',
 'Check your Rakuten Advertising (formerly LinkShare) affiliate links for broken merchants and tracking issues.',
 'Rakuten Advertising Link Checker',
 'Monitor your Rakuten affiliate links for broken merchants, expired campaigns, and parameter stripping.',
 'Rakuten Advertising', 'https://rakutenadvertising.com', '5-50%', 30,
 '[{"type":"text","body":"Rakuten Advertising (formerly LinkShare) powers affiliate programs for major retailers. Their links route through linksynergy.com and click.linksynergy.com, which creates multi-hop redirect chains vulnerable to breakage."},{"type":"heading","body":"Common Rakuten Issues"},{"type":"list","items":["Merchant removed from network","LinkShare tracking domain changes","Deep link path no longer valid","Mid parameter stripped during redirects","Seasonal campaigns expired"]}]'::jsonb,
 '[{"q":"Does LinkRescue work with Rakuten deep links?","a":"Yes. We follow the full redirect chain through linksynergy.com to the final merchant page and verify it resolves correctly."}]'::jsonb,
 now()),

('clickbank', 'network_check', 'published',
 'ClickBank Link Checker — Monitor ClickBank Affiliate Links | LinkRescue',
 'Check your ClickBank affiliate links for broken vendor pages, expired products, and tracking issues.',
 'ClickBank Affiliate Link Checker',
 'Detect broken ClickBank links, removed products, and commission-killing redirect issues.',
 'ClickBank', 'https://www.clickbank.com', '50-75%', 60,
 '[{"type":"text","body":"ClickBank digital products have high turnover — vendors frequently remove products, change sales pages, or rebrand. A broken ClickBank link means losing some of the highest commissions in affiliate marketing (50-75%)."},{"type":"heading","body":"Common ClickBank Issues"},{"type":"list","items":["Vendor removed product from marketplace","Sales page redesigned and old URL broke","Hoplink tracking parameter stripped","Vendor account suspended or closed","Product rebranded with new URL structure"]}]'::jsonb,
 '[{"q":"How often do ClickBank product pages change?","a":"Frequently. ClickBank vendors often A/B test sales pages, rebrand products, or remove them entirely. We recommend daily monitoring for sites with significant ClickBank revenue."}]'::jsonb,
 now())

ON CONFLICT (page_type, slug) DO UPDATE SET
  title = EXCLUDED.title,
  meta_description = EXCLUDED.meta_description,
  hero_headline = EXCLUDED.hero_headline,
  hero_subheadline = EXCLUDED.hero_subheadline,
  content = EXCLUDED.content,
  faq = EXCLUDED.faq,
  status = 'published',
  published_at = COALESCE(seo_pages.published_at, now());

-- ══════════════════════════════════════════════════════════════════════
-- Competitor Comparison Pages (/vs/[competitor])
-- ══════════════════════════════════════════════════════════════════════

INSERT INTO seo_pages (slug, page_type, status, title, meta_description, hero_headline, hero_subheadline, competitor_name, competitor_url, comparison_features, content, faq, published_at) VALUES

('ahrefs', 'comparison', 'published',
 'LinkRescue vs Ahrefs — Dedicated Link Monitoring vs SEO Suite | LinkRescue',
 'Compare LinkRescue vs Ahrefs for broken link detection. Purpose-built affiliate link monitoring at $29/mo vs $129+/mo SEO suite.',
 'LinkRescue vs Ahrefs',
 'Purpose-built affiliate link monitoring vs a full SEO suite. Pay for what you actually need.',
 'Ahrefs', 'https://ahrefs.com',
 '[{"feature":"Broken link detection","linkrescue":"Core feature with affiliate awareness","competitor":"Part of Site Audit tool"},{"feature":"Affiliate parameter tracking","linkrescue":"30+ networks, auto-detection","competitor":"Not available"},{"feature":"API access","linkrescue":"$29/mo (Pro)","competitor":"$1,499/mo (Enterprise)"},{"feature":"Fix suggestions","linkrescue":"AI-powered replacement offers","competitor":"Not available"},{"feature":"Continuous monitoring","linkrescue":"Hourly to weekly","competitor":"Manual re-crawl required"},{"feature":"Starting price","linkrescue":"Free (1 site)","competitor":"$129/mo"}]'::jsonb,
 '[{"type":"text","body":"Ahrefs is a powerful all-in-one SEO suite — but if your primary need is monitoring affiliate links for breakage and revenue leaks, you''re paying for 95% of features you don''t need."},{"type":"text","body":"LinkRescue is purpose-built for affiliate link health. We detect issues Ahrefs can''t: stripped tracking parameters, affiliate network departures, soft-404 pages, and content changes on linked pages. And our API starts at $29/mo, not $1,499/mo."},{"type":"heading","body":"When to choose Ahrefs"},{"type":"text","body":"Choose Ahrefs if you need keyword research, backlink analysis, rank tracking, and competitive intelligence alongside link checking. It''s a complete SEO toolkit."},{"type":"heading","body":"When to choose LinkRescue"},{"type":"text","body":"Choose LinkRescue if you''re an affiliate publisher who needs dedicated, continuous link monitoring with affiliate-aware detection, API access, and automated fix suggestions — at a fraction of the cost."}]'::jsonb,
 '[{"q":"Can I use both LinkRescue and Ahrefs?","a":"Absolutely. Many publishers use Ahrefs for SEO research and LinkRescue for dedicated affiliate link monitoring. They complement each other well."},{"q":"Does Ahrefs detect stripped affiliate parameters?","a":"No. Ahrefs Site Audit checks for HTTP status codes and basic redirect issues, but doesn''t track affiliate-specific parameters through redirect chains."},{"q":"Is LinkRescue''s API comparable to Ahrefs?","a":"For broken link detection, yes. LinkRescue''s API is purpose-built for link checking at $29/mo. Ahrefs API requires a $1,499/mo Enterprise plan and covers many other endpoints."}]'::jsonb,
 now()),

('screaming-frog', 'comparison', 'published',
 'LinkRescue vs Screaming Frog — Cloud Monitoring vs Desktop Crawler | LinkRescue',
 'Compare LinkRescue vs Screaming Frog SEO Spider. Always-on cloud monitoring vs manual desktop crawls for broken link detection.',
 'LinkRescue vs Screaming Frog',
 'Always-on cloud monitoring with affiliate intelligence vs manual desktop crawls.',
 'Screaming Frog', 'https://www.screamingfrog.co.uk',
 '[{"feature":"Deployment","linkrescue":"Cloud SaaS (nothing to install)","competitor":"Desktop app (Windows/Mac/Linux)"},{"feature":"Monitoring","linkrescue":"Continuous (hourly to weekly)","competitor":"Manual runs only"},{"feature":"API access","linkrescue":"REST API from $29/mo","competitor":"No API"},{"feature":"Affiliate detection","linkrescue":"30+ networks, param tracking","competitor":"Not available"},{"feature":"Alerts","linkrescue":"Email, Slack, webhooks","competitor":"None (desktop app)"},{"feature":"Fix suggestions","linkrescue":"AI-powered","competitor":"Not available"},{"feature":"Pricing","linkrescue":"Free / $29 / $79 per month","competitor":"Free (500 URLs) / $259/year"}]'::jsonb,
 '[{"type":"text","body":"Screaming Frog is the gold standard for technical SEO crawling — it''s incredibly powerful for site audits. But it''s a desktop application that requires manual runs, has no API, and doesn''t understand affiliate links."},{"type":"text","body":"LinkRescue runs in the cloud, checks your links continuously, and understands affiliate networks. You get alerts the moment something breaks — no need to remember to run a crawl."},{"type":"heading","body":"When to choose Screaming Frog"},{"type":"text","body":"Choose Screaming Frog for deep technical SEO audits, JavaScript rendering analysis, and one-time site migrations. It''s unmatched for manual analysis."},{"type":"heading","body":"When to choose LinkRescue"},{"type":"text","body":"Choose LinkRescue for continuous affiliate link monitoring, API integration into your workflow, and automated detection of revenue-impacting issues."}]'::jsonb,
 '[{"q":"Is Screaming Frog free?","a":"Screaming Frog has a free version limited to 500 URLs. The paid version is $259/year for unlimited URLs. LinkRescue has a free tier (1 site, 200 pages) with paid plans at $29/mo and $79/mo."},{"q":"Can Screaming Frog monitor links continuously?","a":"No. Screaming Frog is a desktop application that runs manual crawls. There''s no scheduled monitoring or alerting built in. LinkRescue runs continuous scans from hourly to weekly."}]'::jsonb,
 now()),

('dead-link-checker', 'comparison', 'published',
 'LinkRescue vs Dead Link Checker — Continuous Monitoring vs One-Time Scans | LinkRescue',
 'Compare LinkRescue vs free dead link checkers. Continuous affiliate-aware monitoring vs basic one-time HTTP checks.',
 'LinkRescue vs Dead Link Checker',
 'Continuous, affiliate-aware link monitoring vs basic one-time HTTP status checks.',
 'Dead Link Checker', 'https://www.deadlinkchecker.com',
 '[{"feature":"Scan type","linkrescue":"Continuous monitoring","competitor":"One-time scan"},{"feature":"Affiliate awareness","linkrescue":"30+ networks, param tracking","competitor":"Not available"},{"feature":"Fix suggestions","linkrescue":"AI-powered replacement offers","competitor":"Not available"},{"feature":"Soft-404 detection","linkrescue":"Content analysis for fake 200s","competitor":"HTTP status only"},{"feature":"API access","linkrescue":"REST API from $29/mo","competitor":"Basic API via RapidAPI"},{"feature":"Alerts","linkrescue":"Email, Slack, webhooks","competitor":"None"},{"feature":"Pricing","linkrescue":"Free / $29 / $79 per month","competitor":"Free"}]'::jsonb,
 '[{"type":"text","body":"Free dead link checkers are great for a quick one-time scan — but they only check HTTP status codes. They miss soft-404s, stripped affiliate parameters, content changes, and expired offers. And they don''t monitor continuously."},{"type":"text","body":"LinkRescue goes beyond HTTP status codes. We detect affiliate parameter stripping, soft-404 pages that return 200 but show error content, and content changes on linked pages. Plus continuous monitoring means you catch issues in hours, not weeks."}]'::jsonb,
 '[{"q":"Why not just use a free dead link checker?","a":"Free tools only check HTTP status codes once. They miss soft-404s (pages that return 200 but show ''not found'' content), stripped affiliate parameters, and content changes. And they don''t monitor continuously — you have to remember to re-check manually."},{"q":"Is LinkRescue worth paying for over free tools?","a":"If you earn affiliate revenue, yes. A single broken affiliate link on a popular page can lose you $50-500+/month in commissions. LinkRescue pays for itself by catching these issues before they compound."}]'::jsonb,
 now())

ON CONFLICT (page_type, slug) DO UPDATE SET
  title = EXCLUDED.title,
  meta_description = EXCLUDED.meta_description,
  hero_headline = EXCLUDED.hero_headline,
  hero_subheadline = EXCLUDED.hero_subheadline,
  content = EXCLUDED.content,
  faq = EXCLUDED.faq,
  comparison_features = EXCLUDED.comparison_features,
  competitor_name = EXCLUDED.competitor_name,
  competitor_url = EXCLUDED.competitor_url,
  status = 'published',
  published_at = COALESCE(seo_pages.published_at, now());

-- ══════════════════════════════════════════════════════════════════════
-- Guide Pages (/guides/[slug])
-- ══════════════════════════════════════════════════════════════════════

INSERT INTO seo_pages (slug, page_type, status, title, meta_description, hero_headline, hero_subheadline, content, faq, published_at) VALUES

('affiliate-link-monitoring-api', 'guide', 'published',
 'How to Monitor Affiliate Links with an API — Developer Guide | LinkRescue',
 'Complete guide to monitoring affiliate links programmatically. REST API examples in cURL, Python, Node.js, and Go. Detect broken links and lost revenue automatically.',
 'How to Monitor Affiliate Links with an API',
 'A developer''s guide to automating broken link detection with the LinkRescue REST API.',
 '[{"type":"text","body":"If you manage affiliate links at scale — across multiple sites, thousands of pages, or in a content management system — manual checking doesn''t cut it. You need an API."},{"type":"text","body":"The LinkRescue API lets you check URLs for broken links, stripped affiliate parameters, and redirect chain issues with a single POST request. Here''s how to integrate it."},{"type":"heading","body":"Quick Start: Check a Link"},{"type":"code","language":"bash","body":"curl -X POST https://app.linkrescue.io/api/v1/check-links \\\n  -H \"Authorization: Bearer lr_your_api_key\" \\\n  -H \"Content-Type: application/json\" \\\n  -d ''{ \"urls\": [\"https://amzn.to/abc123\"] }''"},{"type":"heading","body":"What the API Returns"},{"type":"text","body":"For each URL, you get: HTTP status code, final URL after redirects, redirect count, whether it''s an affiliate link, whether affiliate parameters survived the redirect chain, and any issues detected."},{"type":"heading","body":"Batch Checking"},{"type":"text","body":"Pass up to 20 URLs in a single request. The API checks them in parallel and returns results for all URLs. For larger batches, our SDK auto-batches for you."},{"type":"heading","body":"Continuous Monitoring with Cron"},{"type":"text","body":"Set up a daily cron job that reads your affiliate URLs from a file or database, checks them via the API, and alerts you when issues are found. Our GitHub Action makes this even easier for sites in git repos."},{"type":"heading","body":"Pricing"},{"type":"text","body":"API access starts at $29/mo (Pro plan) with 100 requests/hour. Agency plan ($79/mo) gets 1,000 requests/hour plus async site scans and webhooks."}]'::jsonb,
 '[{"q":"How many URLs can I check per request?","a":"Up to 20 URLs per request. For larger batches, send multiple requests. Our SDK handles batching automatically."},{"q":"How fast is the API?","a":"Single URL checks typically complete in 2-5 seconds. Batch requests (20 URLs) take 5-15 seconds depending on target server response times."},{"q":"Do I need to be on a paid plan?","a":"Yes. API access requires Pro ($29/mo) or Agency ($79/mo). The free tier is dashboard-only."}]'::jsonb,
 now()),

('broken-link-checker-ci-cd', 'guide', 'published',
 'How to Add Broken Link Checking to Your CI/CD Pipeline | LinkRescue',
 'Add automated broken link detection to your GitHub Actions, GitLab CI, or Jenkins pipeline. Catch dead links before they reach production.',
 'Broken Link Checking in CI/CD',
 'Catch dead links and broken affiliate URLs before they reach production. Set up in 5 minutes.',
 '[{"type":"text","body":"Broken links in production cost you traffic, SEO rankings, and affiliate revenue. The best time to catch them is before deployment — in your CI/CD pipeline."},{"type":"heading","body":"GitHub Actions"},{"type":"text","body":"The LinkRescue GitHub Action checks your affiliate links on every push or on a schedule. It creates annotations for broken links and fails the build if issues are found."},{"type":"code","language":"yaml","body":"name: Check Links\non: [push]\njobs:\n  check-links:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: linkrescue/check-links@v1\n        with:\n          api-key: ${{ secrets.LINKRESCUE_API_KEY }}\n          urls-file: affiliate-links.txt\n          fail-on-broken: true"},{"type":"heading","body":"Scheduled Checks"},{"type":"text","body":"Links break over time — products get discontinued, merchants leave affiliate networks, pages move. Set up a weekly schedule to catch these even when you''re not deploying."},{"type":"code","language":"yaml","body":"on:\n  schedule:\n    - cron: ''0 8 * * 1''  # Every Monday at 8am"},{"type":"heading","body":"Custom Integration"},{"type":"text","body":"For GitLab CI, Jenkins, or other systems, use the REST API directly with curl or our SDK. The API returns structured JSON that''s easy to parse and act on."}]'::jsonb,
 '[{"q":"Does the GitHub Action support monorepos?","a":"Yes. Point it at a file containing your URLs, regardless of repo structure."},{"q":"How long do checks take?","a":"Typically 5-30 seconds for a batch of 20 URLs. The action handles batching automatically."},{"q":"Will this slow down my deploys?","a":"Minimally. Link checks run in parallel and most complete in under 30 seconds. You can also run them as a non-blocking check."}]'::jsonb,
 now()),

('why-affiliate-links-break', 'guide', 'published',
 'Why Your Affiliate Links Are Silently Losing Money | LinkRescue',
 'Discover the 7 ways affiliate links break without warning — and how to catch them before they cost you commissions.',
 'Why Your Affiliate Links Are Silently Losing Money',
 'The 7 ways affiliate links break — and how to detect each one automatically.',
 '[{"type":"text","body":"Every affiliate publisher has the same blind spot: links that break silently. The page still loads, your analytics still show clicks, but the commission never arrives. Here are the 7 most common ways this happens."},{"type":"heading","body":"1. Product Discontinued (404)"},{"type":"text","body":"The most obvious failure. The product page returns a 404. Simple to detect with any link checker — but only if you check regularly."},{"type":"heading","body":"2. Redirect to Homepage"},{"type":"text","body":"Sneakier than a 404. The product is gone but the retailer redirects to their homepage instead of returning an error. HTTP status: 200. Your link checker says ''OK''. But the visitor never sees the product, and you never get the commission."},{"type":"heading","body":"3. Tracking Parameters Stripped"},{"type":"text","body":"Your affiliate tag (e.g., ?tag=yourtag on Amazon) gets stripped during a redirect chain. The visitor reaches the product, they buy it, but the sale isn''t attributed to you. This is invisible unless you specifically check parameter survival."},{"type":"heading","body":"4. Soft-404 Pages"},{"type":"text","body":"The page returns HTTP 200 but shows ''This product is no longer available'' or ''Page not found'' in the body. Standard link checkers only look at status codes — they miss this entirely."},{"type":"heading","body":"5. Content Changed"},{"type":"text","body":"The page still works, but the content changed dramatically. That fitness supplement review you linked to? It''s now a page about pet food. The link isn''t ''broken'' technically, but it''s useless for your readers."},{"type":"heading","body":"6. Merchant Left the Network"},{"type":"text","body":"The affiliate program shut down or the merchant left the network. Their tracking links now redirect to the network''s error page. This can affect dozens of links overnight."},{"type":"heading","body":"7. Geo-Redirect Issues"},{"type":"text","body":"The link works fine from your location but breaks for international visitors. Common with Amazon and large retailers that redirect based on IP geolocation."},{"type":"heading","body":"How LinkRescue Catches All 7"},{"type":"text","body":"LinkRescue is built specifically to detect every one of these issues. We check HTTP status codes, follow full redirect chains, verify affiliate parameter survival, detect soft-404 content, track content changes over time, and monitor affiliate network health. Start for free at linkrescue.io."}]'::jsonb,
 '[{"q":"How much revenue do broken affiliate links cost?","a":"It depends on your traffic and commission rates, but a single broken link on a popular page can lose $50-500+/month. Across a portfolio of content, that adds up fast."},{"q":"How often should I check my affiliate links?","a":"At minimum weekly, ideally daily. Products get discontinued, merchants change URLs, and affiliate programs end without warning. The sooner you catch it, the less revenue you lose."},{"q":"Can I check for these issues for free?","a":"LinkRescue has a free tier that monitors 1 site with weekly scans. For daily monitoring and API access, Pro starts at $29/mo."}]'::jsonb,
 now())

ON CONFLICT (page_type, slug) DO UPDATE SET
  title = EXCLUDED.title,
  meta_description = EXCLUDED.meta_description,
  hero_headline = EXCLUDED.hero_headline,
  hero_subheadline = EXCLUDED.hero_subheadline,
  content = EXCLUDED.content,
  faq = EXCLUDED.faq,
  status = 'published',
  published_at = COALESCE(seo_pages.published_at, now());
