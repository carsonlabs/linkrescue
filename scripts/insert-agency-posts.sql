-- LinkRescue CMS — insert 2 agency-ICP blog posts
-- Target: AgentReady Supabase project (the CMS home for all marketing sites)
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
