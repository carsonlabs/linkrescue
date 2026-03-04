-- 007_seed_seo_pages.sql
-- Seed programmatic SEO pages: Phase 1
-- 5 network checker pages + 2 competitor comparison pages

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

-- 1. Amazon Associates
(
  'amazon-associates',
  'network_check',
  'published',
  'Amazon Associates Affiliate Link Checker | LinkRescue',
  'Free tool to check your Amazon Associates affiliate links for broken URLs, expired products, lost tracking tags, and redirect issues. Catch problems before they cost you commissions.',
  'Amazon Associates Affiliate Link Checker',
  'Scan your Amazon affiliate links for broken URLs, expired products, and lost tracking tags.',
  '/check/amazon-associates',
  'Check Your Amazon Associates Affiliate Links',
  'Amazon affiliate links break more often than any other network. Products get discontinued, URLs change, and tracking tags get stripped during redirects. Scan your site to find issues before they cost you commissions.',
  '[
    {"type": "heading", "heading": "Why Amazon Affiliate Links Break So Often"},
    {"type": "paragraph", "body": "Amazon Associates is the world''s largest affiliate program, but it also has one of the highest link rot rates. Our data shows that approximately 18% of Amazon affiliate links develop issues within 6 months. This happens because Amazon''s product catalog changes constantly — items get discontinued, listings merge, and URLs restructure during seasonal updates."},
    {"type": "heading", "heading": "Common Amazon Affiliate Link Issues"},
    {"type": "list", "items": [
      "Product discontinued — returns a 404 or redirects to a search results page, earning you zero commission",
      "Out of stock — the product page exists but the item is unavailable, so visitors click away",
      "Lost tracking tag — redirects strip your affiliate tag (e.g., ?tag=yourstore-20), so purchases are not attributed to you",
      "URL structure change — Amazon periodically restructures product URLs, breaking old links",
      "Geographic redirect — visitors in other countries get redirected to their local Amazon store without your tag"
    ]},
    {"type": "callout", "body": "A single high-traffic article with a broken Amazon link can cost you $50-200/month in lost commissions. Sites with 50+ articles often have 5-10 broken Amazon links at any given time.", "variant": "warning"},
    {"type": "heading", "heading": "How LinkRescue Monitors Amazon Links"},
    {"type": "paragraph", "body": "LinkRescue crawls your site on a schedule (daily for Pro, weekly for free) and specifically checks every Amazon affiliate link it finds. Unlike generic broken link checkers, we understand Amazon''s URL structure and verify that your tracking tag (associate ID) is preserved through all redirects."},
    {"type": "list", "items": [
      "Detects broken product pages (404, 503, and soft-404 redirects to search)",
      "Verifies your associate tag is present in the final URL after all redirects",
      "Flags out-of-stock products that hurt conversion rates",
      "Monitors redirect chains that may strip tracking parameters",
      "Estimates revenue impact based on page traffic and historical conversion data"
    ]},
    {"type": "heading", "heading": "Getting Started"},
    {"type": "paragraph", "body": "Add your site to LinkRescue and run your first scan in under 60 seconds. We''ll crawl your pages, identify every Amazon affiliate link, and flag any that are broken, redirecting incorrectly, or missing your tracking tag. Free accounts can scan up to 200 pages weekly."},
    {"type": "callout", "body": "Pro tip: After your first scan, sort results by ''affiliate links'' to see only Amazon-related issues. Focus on fixing broken links on your highest-traffic pages first for maximum revenue recovery.", "variant": "tip"}
  ]'::jsonb,
  '[
    {"q": "How long does an Amazon Associates link scan take?", "a": "A typical scan of 200 pages takes 2-5 minutes. Larger sites with 2,000+ pages (Pro plan) take 10-20 minutes. You''ll get an email notification when the scan completes."},
    {"q": "Does LinkRescue check if my Amazon tag is still valid?", "a": "Yes. We verify that your associate tag (the ?tag= parameter) is present in the final destination URL after following all redirects. If a redirect strips your tag, we flag it immediately."},
    {"q": "How often do Amazon affiliate links break?", "a": "Based on our data, approximately 15-20% of Amazon affiliate links develop issues within 6 months. Product discontinuations and URL changes are the most common causes."},
    {"q": "Can I check Amazon OneLink (international) links?", "a": "Yes. LinkRescue checks all Amazon domains and verifies that OneLink tags and geographic redirects preserve your affiliate attribution."},
    {"q": "Is LinkRescue free for Amazon Associates?", "a": "Yes! The free Starter plan lets you monitor 1 site with up to 200 pages scanned weekly. Pro ($29/mo) adds daily scans, 5 sites, and 2,000 pages per scan."}
  ]'::jsonb,
  'Amazon Associates',
  'https://affiliate-program.amazon.com',
  '1-10% (varies by category)',
  1,
  now()
),

-- 2. ShareASale
(
  'shareasale',
  'network_check',
  'published',
  'ShareASale Affiliate Link Checker | LinkRescue',
  'Check your ShareASale affiliate links for broken URLs, expired merchant programs, and tracking issues. Find and fix link rot before it costs you commissions.',
  'ShareASale Affiliate Link Checker',
  'Scan your ShareASale affiliate links for broken URLs and expired programs.',
  '/check/shareasale',
  'Check Your ShareASale Affiliate Links',
  'ShareASale hosts thousands of merchant programs, and links break when merchants leave the network, change their URLs, or update their tracking. Scan your site to catch issues early.',
  '[
    {"type": "heading", "heading": "Why ShareASale Links Break"},
    {"type": "paragraph", "body": "ShareASale is one of the largest affiliate networks with 16,500+ merchant programs. While the network itself is stable, individual merchant programs come and go frequently. When a merchant leaves ShareASale or changes their program structure, every affiliate link pointing to that merchant breaks — and you get no warning."},
    {"type": "heading", "heading": "Common ShareASale Link Issues"},
    {"type": "list", "items": [
      "Merchant program closed — the merchant left ShareASale, so all deep links return errors",
      "Product URL changed — the merchant restructured their site, breaking deep links",
      "Tracking link expired — older ShareASale link formats may stop resolving correctly",
      "Merchant ID mismatch — if a merchant re-joins under a new ID, old links stop working",
      "Landing page removed — the specific product or page you linked to no longer exists"
    ]},
    {"type": "callout", "body": "ShareASale does not proactively notify affiliates when merchant programs close. You could be sending traffic to dead links for weeks before noticing the revenue drop.", "variant": "warning"},
    {"type": "heading", "heading": "How LinkRescue Monitors ShareASale Links"},
    {"type": "paragraph", "body": "LinkRescue identifies ShareASale affiliate links on your site and follows each one through the redirect chain to verify the final destination is a working merchant page. We check for HTTP errors, redirect loops, and landing page issues that generic link checkers miss."},
    {"type": "list", "items": [
      "Detects closed merchant programs before you notice the revenue drop",
      "Follows ShareASale redirect chains to verify the final landing page loads",
      "Flags links where the merchant''s product page returns errors",
      "Monitors for redirect changes that could indicate program restructuring",
      "Alerts you when a merchant''s site goes down or becomes unreachable"
    ]},
    {"type": "heading", "heading": "Getting Started"},
    {"type": "paragraph", "body": "Add your site and run a scan. LinkRescue will automatically detect all ShareASale affiliate links (including custom-domain tracking links) and verify each one. You''ll see a clear report of which links are healthy and which need attention."}
  ]'::jsonb,
  '[
    {"q": "Does LinkRescue work with ShareASale custom tracking links?", "a": "Yes. We detect standard ShareASale links (shareasale.com/r.cfm, shareasale.com/u.cfm) as well as custom tracking domains that merchants may use."},
    {"q": "How will I know when a ShareASale merchant closes?", "a": "LinkRescue checks your links on every scan. If a merchant program closes, the links will start returning errors on the next scan and you''ll be alerted immediately via email."},
    {"q": "Can I monitor links to multiple ShareASale merchants?", "a": "Absolutely. LinkRescue scans all links on your site regardless of which merchant they point to. If you promote 50 different ShareASale merchants, we check all 50."},
    {"q": "What should I do when a ShareASale link breaks?", "a": "Check if the merchant has a new program on ShareASale or another network. If not, replace the link with an alternative product or remove it. LinkRescue''s fix suggestions (Pro) can recommend replacement merchants."}
  ]'::jsonb,
  'ShareASale',
  'https://www.shareasale.com',
  'Varies by merchant (typically 5-30%)',
  30,
  now()
),

-- 3. CJ Affiliate (Commission Junction)
(
  'cj-affiliate',
  'network_check',
  'published',
  'CJ Affiliate Link Checker — Find Broken Commission Junction Links | LinkRescue',
  'Scan your site for broken CJ Affiliate (Commission Junction) links. Detect expired advertiser programs, broken deep links, and tracking issues automatically.',
  'CJ Affiliate Link Checker',
  'Find and fix broken CJ Affiliate links before they cost you commissions.',
  '/check/cj-affiliate',
  'Check Your CJ Affiliate Links',
  'CJ Affiliate (formerly Commission Junction) powers links for major brands like Overstock, GoPro, and Lowes. When advertisers restructure or leave the network, your links break silently. Catch them with automated scanning.',
  '[
    {"type": "heading", "heading": "Why CJ Affiliate Links Break"},
    {"type": "paragraph", "body": "CJ Affiliate connects publishers with enterprise-level advertisers. These brands frequently redesign their websites, restructure URLs, and update their affiliate program terms. Because CJ uses deep linking through their tracking domain, a single URL change on the advertiser''s side can break dozens of your affiliate links overnight."},
    {"type": "heading", "heading": "Common CJ Affiliate Link Issues"},
    {"type": "list", "items": [
      "Advertiser left network — the brand moved to a different affiliate network or ended their program",
      "Deep link destination changed — the product or category page URL was restructured",
      "SID tracking lost — your SubID (SID) parameters are stripped during redirects, making reporting inaccurate",
      "Link format deprecated — older CJ link formats may stop resolving",
      "Advertiser site redesign — complete URL structure change breaks all existing deep links"
    ]},
    {"type": "callout", "body": "CJ Affiliate links pass through multiple redirect hops. Each hop is a point where tracking data can be lost. LinkRescue follows the complete redirect chain and verifies every step.", "variant": "info"},
    {"type": "heading", "heading": "How LinkRescue Monitors CJ Links"},
    {"type": "paragraph", "body": "LinkRescue detects CJ Affiliate links on your pages (including anrdoezrs.net, tkqlhce.com, jdoqocy.com, kqzyfj.com, and dpbolvw.net tracking domains) and follows each through the full redirect chain to the advertiser''s landing page."},
    {"type": "list", "items": [
      "Recognizes all CJ tracking domains and link formats",
      "Follows multi-hop redirects to the final advertiser landing page",
      "Verifies SID and other tracking parameters are preserved",
      "Detects soft-404 pages (pages that load but show ''product not found'' content)",
      "Monitors for advertiser site migrations that break deep links"
    ]},
    {"type": "heading", "heading": "Getting Started"},
    {"type": "paragraph", "body": "Sign up and add your site. LinkRescue automatically identifies CJ Affiliate links across all their tracking domains. Your first scan report will show exactly which CJ links are working, which are broken, and which have tracking issues."}
  ]'::jsonb,
  '[
    {"q": "Which CJ tracking domains does LinkRescue detect?", "a": "We detect all CJ Affiliate tracking domains including anrdoezrs.net, tkqlhce.com, jdoqocy.com, kqzyfj.com, dpbolvw.net, and commission-junction.com links."},
    {"q": "Can LinkRescue detect when a CJ advertiser leaves the network?", "a": "Yes. When an advertiser deactivates their CJ program, their tracking links stop resolving properly. Our next scan will detect this and alert you."},
    {"q": "Does LinkRescue check CJ deep links or just homepage links?", "a": "We check every link on your site, including deep links to specific product pages, category pages, and promotional landing pages."},
    {"q": "How often should I scan my CJ affiliate links?", "a": "We recommend daily scans (Pro plan) for sites with 50+ CJ links. Weekly scans (free plan) work well for smaller sites with fewer CJ partnerships."}
  ]'::jsonb,
  'CJ Affiliate',
  'https://www.cj.com',
  'Varies by advertiser (typically 3-20%)',
  45,
  now()
),

-- 4. ClickBank
(
  'clickbank',
  'network_check',
  'published',
  'ClickBank Affiliate Link Checker | LinkRescue',
  'Check your ClickBank affiliate links for broken hoplinks, inactive products, and tracking issues. Prevent lost commissions from dead digital product links.',
  'ClickBank Affiliate Link Checker',
  'Scan your ClickBank hoplinks for broken or inactive product links.',
  '/check/clickbank',
  'Check Your ClickBank Affiliate Links',
  'ClickBank''s digital product marketplace has high vendor turnover. Products get pulled, vendors abandon accounts, and hoplinks stop working. Scan your site to find dead ClickBank links before visitors do.',
  '[
    {"type": "heading", "heading": "Why ClickBank Links Break"},
    {"type": "paragraph", "body": "ClickBank specializes in digital products — ebooks, courses, and software. The barrier to entry is low, which means vendors frequently launch products, abandon them, or get removed for policy violations. When a vendor''s product goes inactive, your ClickBank hoplink redirects to an error page or a generic marketplace search, earning you nothing."},
    {"type": "heading", "heading": "Common ClickBank Link Issues"},
    {"type": "list", "items": [
      "Product deactivated — the vendor stopped selling or was removed from ClickBank",
      "Vendor account closed — all products from that vendor become unavailable",
      "Hoplink format changed — ClickBank has updated link formats over the years; old formats may not resolve",
      "Sales page removed — the vendor changed their sales page URL or domain",
      "Nickname expired — your ClickBank affiliate nickname was not renewed or was changed"
    ]},
    {"type": "callout", "body": "ClickBank has particularly high product turnover. In competitive niches like health and fitness, up to 25% of products may become inactive within a year. Regular scanning is essential.", "variant": "warning"},
    {"type": "heading", "heading": "How LinkRescue Monitors ClickBank Links"},
    {"type": "paragraph", "body": "LinkRescue identifies ClickBank hoplinks on your pages and verifies that each one resolves to an active product sales page. We check both the old format (VENDOR.AFFILIATE.hop.clickbank.net) and the new format (hop.clickbank.net/?affiliate=X&vendor=Y)."},
    {"type": "list", "items": [
      "Detects both old and new ClickBank hoplink formats",
      "Verifies the product is still active and the sales page loads correctly",
      "Checks that your affiliate nickname is correctly embedded in the link",
      "Flags products where the vendor''s sales page has changed domains",
      "Identifies generic redirect pages that indicate a dead product"
    ]},
    {"type": "heading", "heading": "Getting Started"},
    {"type": "paragraph", "body": "Add your site to LinkRescue and run a scan. We''ll find every ClickBank hoplink and verify each one leads to an active product with your affiliate nickname intact."}
  ]'::jsonb,
  '[
    {"q": "Does LinkRescue support both old and new ClickBank link formats?", "a": "Yes. We detect the legacy format (vendor.affiliate.hop.clickbank.net) and the current format (hop.clickbank.net/?affiliate=X&vendor=Y), plus any custom redirect URLs that point to ClickBank."},
    {"q": "How can I tell if a ClickBank product was deactivated?", "a": "LinkRescue flags hoplinks that redirect to ClickBank''s marketplace search page or return an error. This typically indicates the product has been deactivated or the vendor account was closed."},
    {"q": "Can I monitor ClickBank links on multiple sites?", "a": "Yes. The free plan monitors 1 site. Pro monitors up to 5 sites and Agency monitors up to 25 sites, all with the same ClickBank link detection."},
    {"q": "How often do ClickBank products go inactive?", "a": "Based on our data, ClickBank has higher product turnover than other networks. We recommend at least weekly scans (daily for Pro) if you promote ClickBank products."}
  ]'::jsonb,
  'ClickBank',
  'https://www.clickbank.com',
  '50-75% (digital products)',
  60,
  now()
),

-- 5. Impact (impact.com)
(
  'impact',
  'network_check',
  'published',
  'Impact.com Affiliate Link Checker | LinkRescue',
  'Scan your Impact.com (formerly Impact Radius) affiliate links for broken tracking URLs, expired campaigns, and attribution issues. Keep your Impact partnerships healthy.',
  'Impact.com Affiliate Link Checker',
  'Find broken Impact.com affiliate links and tracking issues on your site.',
  '/check/impact',
  'Check Your Impact.com Affiliate Links',
  'Impact.com powers affiliate programs for brands like Uber, Airbnb, Canva, and Shopify. Their tracking links use unique per-partner domains, making broken links harder to detect with generic tools. LinkRescue identifies and monitors them all.',
  '[
    {"type": "heading", "heading": "Why Impact.com Links Break"},
    {"type": "paragraph", "body": "Impact.com (formerly Impact Radius) is the fastest-growing affiliate platform, used by major brands and DTC companies. Unlike networks with a single tracking domain, Impact assigns unique tracking domains per advertiser — making it challenging for generic link checkers to identify affiliate links. When brands restructure their programs or change tracking URLs, your links can break without any notification."},
    {"type": "heading", "heading": "Common Impact.com Link Issues"},
    {"type": "list", "items": [
      "Campaign ended — the brand paused or terminated their affiliate program on Impact",
      "Tracking domain changed — the advertiser switched their custom tracking domain",
      "Deep link destination moved — the product page was removed or URL changed during a site redesign",
      "Attribution parameters lost — redirect chains strip Impact''s click ID or irclickid parameter",
      "Program migrated — the brand moved from Impact to another platform, breaking all existing links"
    ]},
    {"type": "callout", "body": "Impact.com uses unique tracking domains for each advertiser (e.g., shopify.pxf.io, canva.pxf.io). Generic broken link checkers don''t recognize these as affiliate links and skip them entirely.", "variant": "info"},
    {"type": "heading", "heading": "How LinkRescue Monitors Impact Links"},
    {"type": "paragraph", "body": "LinkRescue maintains a database of known Impact.com tracking domain patterns and detects them across your site. We follow each link through Impact''s redirect chain to the advertiser''s landing page and verify the complete attribution path is working."},
    {"type": "list", "items": [
      "Identifies Impact tracking links across hundreds of custom domains (*.pxf.io, *.sjv.io, and custom domains)",
      "Follows the full redirect chain from Impact tracking URL to advertiser landing page",
      "Verifies click ID and attribution parameters survive all redirects",
      "Detects campaign terminations and program migrations",
      "Monitors for advertiser site changes that break deep links"
    ]},
    {"type": "heading", "heading": "Getting Started"},
    {"type": "paragraph", "body": "Sign up and add your domain. LinkRescue will scan your pages, identify Impact.com affiliate links across all tracking domains, and report any broken or degraded links. No configuration needed — we detect Impact links automatically."}
  ]'::jsonb,
  '[
    {"q": "How does LinkRescue detect Impact.com links if every advertiser has a different domain?", "a": "We maintain a database of known Impact tracking domain patterns (*.pxf.io, *.sjv.io, etc.) and use heuristic detection for custom domains. Our classifier catches Impact links that generic tools miss entirely."},
    {"q": "Can LinkRescue detect Impact links with custom domains?", "a": "Yes. Many Impact advertisers use custom tracking domains (e.g., goto.brand.com). LinkRescue''s affiliate link classifier detects these by analyzing redirect behavior and URL patterns."},
    {"q": "What happens when an Impact advertiser changes their program?", "a": "When a brand restructures their Impact program, old tracking links may stop resolving or redirect to incorrect pages. LinkRescue catches these changes on the next scan and alerts you."},
    {"q": "Does LinkRescue check the irclickid parameter?", "a": "Yes. Impact uses the irclickid parameter for attribution. We verify this parameter is present in the redirect chain and not stripped by intermediate redirects."}
  ]'::jsonb,
  'Impact.com',
  'https://impact.com',
  'Varies by advertiser (typically 5-30%)',
  30,
  now()
)

ON CONFLICT (page_type, slug) DO NOTHING;


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

-- 1. LinkRescue vs Screaming Frog
(
  'screaming-frog',
  'comparison',
  'published',
  'LinkRescue vs Screaming Frog — Affiliate Link Monitoring Compared | LinkRescue',
  'Comparing LinkRescue and Screaming Frog for affiliate link monitoring. See which tool is better for finding broken affiliate links, tracking parameter issues, and revenue protection.',
  'LinkRescue vs Screaming Frog',
  'Which tool is better for monitoring affiliate links?',
  '/vs/screaming-frog',
  'LinkRescue vs Screaming Frog',
  'Screaming Frog is a powerful SEO crawler. LinkRescue is purpose-built for affiliate link monitoring. Here''s how they compare for finding and fixing broken affiliate links.',
  '[
    {"type": "heading", "heading": "Different Tools for Different Jobs"},
    {"type": "paragraph", "body": "Screaming Frog is an excellent general-purpose SEO crawler used by thousands of agencies and in-house SEO teams. It crawls websites and reports on technical SEO issues including broken links, redirect chains, missing meta tags, and more. LinkRescue is a specialized tool built specifically for affiliate marketers who need to monitor their affiliate links for breakage, lost tracking parameters, and revenue impact."},
    {"type": "paragraph", "body": "The key difference: Screaming Frog treats all links equally. It doesn''t know (or care) whether a broken link is a navigation link, an image, or a high-value affiliate link that''s costing you $200/month in lost commissions. LinkRescue understands affiliate links and prioritizes them."},
    {"type": "heading", "heading": "When to Use Screaming Frog"},
    {"type": "list", "items": [
      "Full technical SEO audits (meta tags, canonicals, hreflang, schema)",
      "Site architecture analysis and internal linking optimization",
      "Content audits (word count, duplicate content, thin pages)",
      "One-time site migrations where you need a complete crawl",
      "Large-scale SEO projects where you need raw crawl data"
    ]},
    {"type": "heading", "heading": "When to Use LinkRescue"},
    {"type": "list", "items": [
      "Ongoing affiliate link monitoring (daily/weekly automated scans)",
      "Detecting broken affiliate links specifically (not just any 404)",
      "Verifying tracking parameters survive redirects (affiliate tags, SubIDs)",
      "Estimating revenue impact of broken links to prioritize fixes",
      "Monitoring affiliate network changes (merchant closures, program migrations)",
      "Getting automated alerts when affiliate links break"
    ]},
    {"type": "callout", "body": "Many affiliate marketers use both tools: Screaming Frog for quarterly SEO audits, and LinkRescue for ongoing daily affiliate link monitoring. They solve different problems.", "variant": "tip"},
    {"type": "heading", "heading": "The Affiliate Link Gap"},
    {"type": "paragraph", "body": "Screaming Frog reports a broken link as a 404 status code. LinkRescue reports a broken link as ''Broken Amazon Associates link on your top-earning page — estimated $150/month revenue impact.'' This context makes all the difference when you''re deciding what to fix first."},
    {"type": "paragraph", "body": "Additionally, Screaming Frog requires manual execution — you have to remember to run it, wait for the crawl, and analyze the results. LinkRescue runs automatically on a schedule and emails you when something breaks. For busy affiliate marketers managing multiple sites, this automation is critical."}
  ]'::jsonb,
  '[
    {"q": "Is Screaming Frog free?", "a": "Screaming Frog has a free version limited to 500 URLs. The paid version costs $259/year (approximately $22/month). LinkRescue has a free tier for 1 site with 200 pages, and Pro starts at $29/month with daily automated scans."},
    {"q": "Can Screaming Frog detect affiliate links?", "a": "Screaming Frog can find broken links on your site, but it doesn''t distinguish between affiliate links and regular links. It cannot check if your affiliate tracking parameters are intact or estimate revenue impact."},
    {"q": "Can I use both LinkRescue and Screaming Frog?", "a": "Yes, and many affiliate marketers do. Screaming Frog is great for deep technical SEO audits. LinkRescue handles the ongoing, automated monitoring of your affiliate links specifically."},
    {"q": "Does Screaming Frog run automatically?", "a": "The desktop version requires manual execution. Screaming Frog has a cloud/scheduled option for enterprise users, but it''s significantly more expensive. LinkRescue runs automated scans daily (Pro) or weekly (free) without any manual action."},
    {"q": "Which tool is better for a niche affiliate site?", "a": "For a site where affiliate revenue is the primary income source, LinkRescue provides more actionable value. It monitors the links that directly affect your revenue, runs on autopilot, and tells you exactly which broken links to prioritize based on revenue impact."}
  ]'::jsonb,
  'Screaming Frog',
  'https://www.screamingfrog.co.uk',
  '[
    {"feature": "Purpose-built for affiliate links", "linkrescue": true, "competitor": false},
    {"feature": "Automated daily scans", "linkrescue": true, "competitor": false},
    {"feature": "Affiliate tracking parameter verification", "linkrescue": true, "competitor": false},
    {"feature": "Revenue impact estimation", "linkrescue": true, "competitor": false},
    {"feature": "Email alerts for broken links", "linkrescue": true, "competitor": false},
    {"feature": "Site health score", "linkrescue": true, "competitor": false},
    {"feature": "AI-powered fix suggestions", "linkrescue": true, "competitor": false},
    {"feature": "General technical SEO audit", "linkrescue": false, "competitor": true},
    {"feature": "Internal link analysis", "linkrescue": false, "competitor": true},
    {"feature": "Schema / structured data validation", "linkrescue": false, "competitor": true},
    {"feature": "Broken link detection", "linkrescue": true, "competitor": true},
    {"feature": "Redirect chain analysis", "linkrescue": true, "competitor": true},
    {"feature": "Cloud-based (no install)", "linkrescue": true, "competitor": false},
    {"feature": "Free tier available", "linkrescue": true, "competitor": true},
    {"feature": "Slack integration", "linkrescue": "Agency plan", "competitor": false},
    {"feature": "API access", "linkrescue": "Agency plan", "competitor": false},
    {"feature": "White-label reports", "linkrescue": "Agency plan", "competitor": false},
    {"feature": "Starting price", "linkrescue": "Free / $29/mo", "competitor": "Free / $259/yr"}
  ]'::jsonb,
  now()
),

-- 2. LinkRescue vs Ahrefs
(
  'ahrefs',
  'comparison',
  'published',
  'LinkRescue vs Ahrefs for Affiliate Link Monitoring | LinkRescue',
  'How does LinkRescue compare to Ahrefs for monitoring affiliate links? See the detailed feature comparison for affiliate marketers who need automated link monitoring.',
  'LinkRescue vs Ahrefs for Affiliate Links',
  'Compare LinkRescue and Ahrefs for affiliate link monitoring and broken link detection.',
  '/vs/ahrefs',
  'LinkRescue vs Ahrefs',
  'Ahrefs is a comprehensive SEO platform with backlink analysis, keyword research, and site auditing. LinkRescue focuses exclusively on affiliate link health. Here''s how they compare for affiliate marketers.',
  '[
    {"type": "heading", "heading": "Ahrefs: The SEO Swiss Army Knife"},
    {"type": "paragraph", "body": "Ahrefs is one of the most powerful SEO tools available. Its Site Audit feature can crawl your website and identify broken links, including outbound links to external sites. For many SEO professionals, Ahrefs is an essential part of their toolkit."},
    {"type": "paragraph", "body": "However, Ahrefs is designed for SEO professionals, not specifically for affiliate marketers. Its broken link detection treats all links equally — a broken navigation link gets the same priority as a broken Amazon Associates link that''s costing you $300/month."},
    {"type": "heading", "heading": "Where Ahrefs Falls Short for Affiliate Marketers"},
    {"type": "list", "items": [
      "No affiliate link classification — Ahrefs doesn''t distinguish affiliate links from regular outbound links",
      "No tracking parameter verification — it doesn''t check if your affiliate tags survive redirects",
      "No revenue impact estimation — you can''t prioritize fixes by commission value",
      "Overkill pricing for pure link monitoring — Ahrefs Lite starts at $99/month, and you''re paying for features you may not need (keyword research, backlink analysis, content explorer)",
      "Scan frequency — Site Audit runs are limited and must be manually scheduled or set up",
      "No affiliate-specific alerts — you get a general audit report, not ''your Amazon link on page X broke''"
    ]},
    {"type": "heading", "heading": "Where LinkRescue Excels"},
    {"type": "list", "items": [
      "Identifies affiliate links across 20+ networks (Amazon, ShareASale, CJ, Impact, ClickBank, etc.)",
      "Verifies affiliate tracking parameters survive redirect chains",
      "Estimates revenue impact of each broken link based on page traffic data",
      "Runs daily automated scans with instant email alerts",
      "Provides AI-powered fix suggestions (alternative products, updated URLs)",
      "Purpose-built dashboard showing only what matters: broken affiliate links and their revenue impact",
      "Costs $29/month vs $99+/month — focused tool at a focused price"
    ]},
    {"type": "callout", "body": "If you already pay for Ahrefs for SEO work, LinkRescue complements it perfectly. Use Ahrefs for keyword research and backlink analysis. Use LinkRescue for automated, daily affiliate link monitoring with revenue-aware prioritization.", "variant": "tip"},
    {"type": "heading", "heading": "Cost Comparison"},
    {"type": "paragraph", "body": "Ahrefs Lite starts at $99/month ($83/month annual) for basic site audits with limited crawl credits. LinkRescue Pro is $29/month ($24/month annual) and includes daily automated scans, 5 sites, 2,000 pages per scan, revenue estimates, and fix suggestions. For pure affiliate link monitoring, LinkRescue delivers more relevant value at 70% lower cost."},
    {"type": "paragraph", "body": "For affiliate marketers who don''t need Ahrefs'' full SEO suite, LinkRescue is the clear choice. For those who already use Ahrefs, adding LinkRescue provides the affiliate-specific monitoring layer that Ahrefs lacks."}
  ]'::jsonb,
  '[
    {"q": "Should I cancel Ahrefs and use LinkRescue instead?", "a": "Not necessarily. They serve different purposes. Ahrefs is excellent for keyword research, backlink analysis, and competitive research. LinkRescue is specifically for monitoring affiliate links. If you use Ahrefs for SEO, keep it. Add LinkRescue for affiliate link monitoring."},
    {"q": "Does Ahrefs Site Audit check affiliate links?", "a": "Ahrefs Site Audit can find broken outbound links, but it doesn''t identify which ones are affiliate links, doesn''t check tracking parameters, and doesn''t estimate revenue impact. You''d need to manually cross-reference the results."},
    {"q": "Is LinkRescue cheaper than Ahrefs?", "a": "Yes. LinkRescue Pro is $29/month vs Ahrefs Lite at $99/month. And LinkRescue''s free tier (1 site, weekly scans) has no equivalent in Ahrefs — all Ahrefs plans are paid."},
    {"q": "Can I import Ahrefs broken link data into LinkRescue?", "a": "Currently, there''s no direct import. However, once you add your site to LinkRescue, it will independently scan and find all broken affiliate links. The first scan typically takes just a few minutes."},
    {"q": "Which tool runs more frequent scans?", "a": "LinkRescue Pro scans daily automatically. Ahrefs Site Audit can be scheduled but is limited by your plan''s crawl credits. LinkRescue Agency scans hourly for time-sensitive affiliate sites."}
  ]'::jsonb,
  'Ahrefs',
  'https://ahrefs.com',
  '[
    {"feature": "Purpose-built for affiliate links", "linkrescue": true, "competitor": false},
    {"feature": "Affiliate link classification", "linkrescue": true, "competitor": false},
    {"feature": "Tracking parameter verification", "linkrescue": true, "competitor": false},
    {"feature": "Revenue impact estimation", "linkrescue": true, "competitor": false},
    {"feature": "AI fix suggestions", "linkrescue": true, "competitor": false},
    {"feature": "Automated daily scans", "linkrescue": true, "competitor": "Limited by credits"},
    {"feature": "Email alerts for broken links", "linkrescue": true, "competitor": true},
    {"feature": "Site health score", "linkrescue": true, "competitor": true},
    {"feature": "Keyword research", "linkrescue": false, "competitor": true},
    {"feature": "Backlink analysis", "linkrescue": false, "competitor": true},
    {"feature": "Content explorer", "linkrescue": false, "competitor": true},
    {"feature": "Rank tracking", "linkrescue": false, "competitor": true},
    {"feature": "Broken link detection", "linkrescue": true, "competitor": true},
    {"feature": "Redirect chain analysis", "linkrescue": true, "competitor": true},
    {"feature": "Slack integration", "linkrescue": "Agency plan", "competitor": true},
    {"feature": "API access", "linkrescue": "Agency plan", "competitor": true},
    {"feature": "Free tier", "linkrescue": true, "competitor": false},
    {"feature": "Starting price", "linkrescue": "Free / $29/mo", "competitor": "$99/mo"}
  ]'::jsonb,
  now()
)

ON CONFLICT (page_type, slug) DO NOTHING;
