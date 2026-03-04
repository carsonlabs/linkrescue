# LinkRescue Marketing Strategy

> Comprehensive go-to-market plan for LinkRescue.io — broken affiliate link monitoring SaaS.
> Last updated: March 2026

---

## Table of Contents

1. [Launch Strategy](#1-launch-strategy)
2. [Content Marketing & SEO](#2-content-marketing--seo)
3. [Email Marketing Sequences](#3-email-marketing-sequences)
4. [Community & Distribution Channels](#4-community--distribution-channels)
5. [Pricing & Conversion](#5-pricing--conversion)
6. [Affiliate Program Activation](#6-affiliate-program-activation)
7. [Metrics & KPIs](#7-metrics--kpis)

---

## 1. Launch Strategy

### Pre-Launch Checklist

- [ ] **Domain & DNS** — Verify linkrescue.io DNS, SSL, www redirect, email SPF/DKIM/DMARC
- [ ] **Email warmup** — Send test emails from `RESEND_FROM_EMAIL` to 50+ seed addresses over 2 weeks. Verify deliverability via mail-tester.com (target 9+/10)
- [ ] **Stripe live mode** — Switch from test keys to production. Create Pro Monthly ($29), Pro Annual ($290), Agency Monthly ($79), Agency Annual ($790) products. Verify webhook endpoint works in live mode
- [ ] **Sentry alerts** — Set up Sentry alert rules: error spike >5 in 5 min, new unhandled exception, transaction latency p95 >3s
- [ ] **Monitoring** — Verify cron jobs (scheduled scans, monthly digest) are running. Set up uptime monitoring (UptimeRobot or Better Stack)
- [ ] **Legal** — Privacy policy, terms of service, cookie consent banner
- [ ] **Analytics** — Plausible or PostHog (privacy-friendly) for traffic. UTM tracking for all campaign links
- [ ] **Social accounts** — @LinkRescue_io on Twitter/X, LinkedIn company page, Reddit account (aged, some karma)
- [ ] **Og images** — Generate unique OG images for homepage, pricing, /check/*, /vs/*, /guides/* using Vercel OG

### Soft Launch (Weeks 1-2)

**Goal:** 50 beta users, fix bugs, collect testimonials.

1. **Personal network** — Email 20 affiliate marketers you know. Offer free Pro for 3 months in exchange for feedback + testimonial
2. **Indie Hacker communities** — Post a "Show IH" on IndieHackers.com with your building story. Share revenue goals
3. **Twitter build-in-public** — Thread: "I built a tool that finds broken affiliate links costing bloggers $5K+/year. Here's what I found scanning 10 real sites." Include screenshots of scan results
4. **Beta feedback loop** — Add in-app feedback widget (Canny or simple form). Daily check-ins with beta users via email/DM

### Launch Week (Week 3)

| Day | Channel | Action |
|-----|---------|--------|
| Mon | Twitter | Launch thread with product demo GIF, tag affiliate marketing influencers |
| Tue | Product Hunt | Submit with 5+ hunter upvotes lined up. "Maker comment" with backstory |
| Wed | Reddit | r/juststart, r/affiliatemarketing, r/blogging — value-first posts about link rot stats (not promotional) |
| Thu | Hacker News | "Show HN: LinkRescue — Find broken affiliate links before they cost you commissions" |
| Fri | Email | Send launch announcement to all beta users + waitlist. Ask for Product Hunt upvotes |
| Sat | Content | Publish "The Hidden Cost of Broken Affiliate Links" guide |
| Sun | Recap | Twitter recap thread with Day 1-7 metrics (signups, scans run, issues found) |

### Post-Launch (Weeks 4-8)

- Respond to every Product Hunt comment within 2 hours
- DM every new signup asking what brought them and what they want most
- Weekly Twitter updates with real metrics ("This week LinkRescue found 847 broken links across 32 sites")
- Submit to 20+ SaaS directories (see Channel List below)

---

## 2. Content Marketing & SEO

### Keyword Strategy

LinkRescue's SEO infrastructure supports three programmatic route types. Target keywords mapped to existing routes:

#### `/check/[network]` — Network-Specific Pages

| Network | Target Keyword | Monthly Volume (est.) |
|---------|---------------|----------------------|
| Amazon Associates | amazon affiliate link checker | 1,200 |
| ShareASale | shareasale link checker | 400 |
| CJ Affiliate | cj affiliate broken links | 300 |
| Impact | impact radius link checker | 200 |
| Awin | awin affiliate link checker | 200 |
| Rakuten | rakuten advertising link checker | 150 |
| PartnerStack | partnerstack link validation | 100 |
| FlexOffers | flexoffers link monitor | 80 |
| ClickBank | clickbank affiliate link checker | 350 |
| Partnerize | partnerize link checker | 80 |
| Skimlinks | skimlinks broken link checker | 120 |
| Refersion | refersion link validator | 60 |
| AvantLink | avantlink affiliate link check | 50 |
| Pepperjam | pepperjam link checker | 50 |
| Admitad | admitad link checker | 80 |
| TradeDoubler | tradedoubler affiliate checker | 60 |
| Webgains | webgains link monitor | 40 |
| Tapfiliate | tapfiliate link validation | 40 |
| Post Affiliate Pro | post affiliate pro link checker | 60 |
| HasOffers/TUNE | tune affiliate link checker | 50 |

**Priority:** Create Amazon, ShareASale, CJ, ClickBank, Impact first (highest volume).

#### `/vs/[competitor]` — Comparison Pages

| Competitor | Target Keyword |
|------------|---------------|
| Screaming Frog | linkrescue vs screaming frog |
| Ahrefs | linkrescue vs ahrefs broken link checker |
| SEMrush | semrush vs linkrescue affiliate links |
| Dead Link Checker | dead link checker alternative |
| Broken Link Check | broken link check alternative |

**Angle:** Position LinkRescue as the purpose-built affiliate solution vs generic SEO tools that don't understand affiliate parameters, tracking codes, or revenue impact.

#### `/guides/[slug]` — Long-Form Guides

Target informational intent keywords that pull affiliate marketers into the funnel.

### 12-Week Content Calendar

| Week | Content | Type | Target Keyword |
|------|---------|------|---------------|
| 1 | "Amazon Affiliate Link Rot: The 2026 Survival Guide" | Guide | amazon affiliate link rot |
| 2 | "How Often Should You Audit Your Affiliate Links?" | Guide | affiliate link audit frequency |
| 3 | "Amazon Associates Link Checker" | SEO Page | amazon affiliate link checker |
| 4 | "LinkRescue vs Screaming Frog for Affiliate Sites" | Comparison | screaming frog affiliate links |
| 5 | "ShareASale Link Checker" | SEO Page | shareasale link checker |
| 6 | "5 Signs Your Affiliate Site Has a Link Rot Problem" | Guide | broken affiliate links signs |
| 7 | "CJ Affiliate Link Checker" | SEO Page | cj affiliate broken links |
| 8 | "Why Generic Broken Link Checkers Miss Affiliate Issues" | Guide | affiliate link checker vs broken link checker |
| 9 | "LinkRescue vs Ahrefs for Affiliate Link Monitoring" | Comparison | ahrefs affiliate link audit |
| 10 | "The Complete Guide to Affiliate Link Parameters" | Guide | affiliate link parameters tracking |
| 11 | "ClickBank Link Checker" | SEO Page | clickbank link checker |
| 12 | "How to Automate Affiliate Link Monitoring (Save 10+ Hours/Month)" | Guide | automate affiliate link monitoring |

### Programmatic SEO Content Plan

**Database seeding priority** (populate `seo_pages` table):

**Phase 1 (Weeks 1-4):** Top 5 networks + top 2 competitors
- `/check/amazon-associates`
- `/check/shareasale`
- `/check/cj-affiliate`
- `/check/clickbank`
- `/check/impact`
- `/vs/screaming-frog`
- `/vs/ahrefs`

**Phase 2 (Weeks 5-8):** Next 5 networks + 3 competitors + 4 guides
- `/check/rakuten`, `/check/awin`, `/check/skimlinks`, `/check/partnerstack`, `/check/flexoffers`
- `/vs/semrush`, `/vs/dead-link-checker`, `/vs/broken-link-check`
- 4 guides from calendar

**Phase 3 (Weeks 9-12):** Remaining 10 networks + remaining guides
- All remaining `/check/` pages
- Remaining guides from calendar

### Link Building Strategy

1. **SaaS directories** (submit within first month):
   - Product Hunt, AlternativeTo, G2, Capterra, GetApp, SaaSHub, SaaSWorthy
   - ToolFinder, StartupStash, BetaList, Launching Next, SideProjectors
   - There's An AI For That (position AI fix suggestions), Uneed, MicroLaunch

2. **Affiliate marketing blogs** — Guest post or get listed on:
   - AuthorityHacker (roundup posts)
   - Niche Pursuits (tool reviews)
   - Affiliate Marketing Blog by Geno Prussakov
   - Charles Ngo's blog
   - Matthew Woodward's blog
   - Shout Me Loud

3. **HARO/Connectively** — Monitor for affiliate marketing, link building, and SEO tool queries. Respond as founder with data insights from aggregate scans

4. **Data-driven content** — Publish annual "State of Affiliate Link Health" report using anonymized, aggregated scan data. Pitch to affiliate marketing publications for coverage

---

## 3. Email Marketing Sequences

### 3.1 Welcome/Onboarding Sequence (5 emails, 14 days)

**Trigger:** User signs up (free or paid)

**Email 1 — Welcome (Immediate)**
- Subject: "Welcome to LinkRescue — let's find your broken links"
- Body: Quick start guide. Add your first site in 60 seconds. Link to dashboard
- CTA: "Add Your First Site"

**Email 2 — First Scan Complete (Triggered by scan.completed, or Day 1 if no scan)**
- Subject: "Your scan results are in — [X] issues found"
- Body: Summary of scan results. Highlight top 3 issues with estimated revenue impact (if Pro/Agency). Explain issue types
- CTA: "View Full Report"
- Fallback (no scan): "You haven't added a site yet — here's why you should"

**Email 3 — Tips & Quick Wins (Day 3)**
- Subject: "3 quick fixes that save most affiliate revenue"
- Body: Teach the three most common issues: (1) out-of-stock product links, (2) lost tracking parameters after redirects, (3) merchant program changes. Show how to fix each
- CTA: "Check Your Site for These Issues"

**Email 4 — Health Score Explainer (Day 7)**
- Subject: "What your Site Health Score means (and how to improve it)"
- Body: Explain the 0-100 health score formula. Show what good (80+), okay (60-80), and at-risk (<60) look like. Introduce historical trends
- CTA: "View Your Health Score Trend"

**Email 5 — What's Next (Day 14)**
- Subject: "You've been monitoring for 2 weeks — here's your progress"
- Body: Recap: sites added, scans completed, issues found, issues resolved. Compare to average user. If free tier: mention daily scans, revenue estimates, multi-site monitoring available on Pro
- CTA (Free): "Upgrade to Pro — first month 20% off" | CTA (Paid): "Explore Advanced Features"

### 3.2 Free-to-Pro Upgrade Nurture (Triggered by usage milestones)

**Trigger A — User hits weekly scan limit**
- Subject: "Your weekly scan found [X] issues — want daily monitoring?"
- Body: "Free scans run weekly. Since your last scan, [network] links can change daily. Pro scans daily so you catch issues in hours, not weeks."
- CTA: "Upgrade to Daily Scans — $29/mo"

**Trigger B — User tries to add second site**
- Subject: "Want to monitor [domain2]? Here's how"
- Body: "The Starter plan monitors 1 site. Pro gives you 5 sites with deeper scanning (2,000 pages vs 200)."
- CTA: "Unlock 5 Sites with Pro"

**Trigger C — User views revenue estimates (gated feature)**
- Subject: "Curious how much broken links are costing you?"
- Body: Tease the revenue estimation feature. Show a blurred/sample report. "Pro users discovered an average of $[X]/month in at-risk affiliate revenue."
- CTA: "See Your Revenue at Risk"

**Trigger D — 30 days on free tier, active user (3+ logins)**
- Subject: "You're serious about your affiliate links — here's a Pro offer"
- Body: Personal note from Carson. "You've logged in [X] times and fixed [Y] issues. Power users like you get the most from Pro's daily scans and revenue estimates. Here's 20% off your first 3 months."
- CTA: "Claim Your 20% Discount"

### 3.3 Win-Back Sequence (Churned Users)

**Trigger:** Subscription cancelled or expired

**Email 1 — Day 1 after churn**
- Subject: "We'll miss you — here's what happens next"
- Body: Acknowledge cancellation gracefully. Explain what they lose (daily scans revert to weekly, revenue estimates disabled). Mention data is kept for 90 days
- CTA: "Changed your mind? Reactivate instantly"

**Email 2 — Day 7**
- Subject: "Your site health dropped since you left"
- Body: If they had active sites, run a final scan and report any new issues found. "Since your last Pro scan, we detected [X] new issues on [domain]. Without daily monitoring, these go unnoticed."
- CTA: "Reactivate and Fix These Issues"

**Email 3 — Day 30**
- Subject: "[Name], your affiliate links need attention"
- Body: Share aggregate industry data. "In the past 30 days, LinkRescue users caught an average of 47 broken links per site. How many has your site accumulated?"
- CTA: "Come back — first month 50% off" (use Stripe coupon code)

### 3.4 Monthly Digest Optimization

The monthly health report email (already built) is the strongest retention tool. Strategy to maximize impact:

1. **Send timing** — Test Tuesday 9am vs Thursday 10am (affiliate marketers check stats mid-week). A/B test with Resend
2. **Subject line rotation:**
   - "[Site] Health Score: [XX]/100 — [trend] from last month"
   - "Your monthly link health report: [X] issues need attention"
   - "[Site]: [X] broken links found, ~$[Y] revenue at risk"
3. **Free tier upsell placement** — Already implemented. Ensure the upsell section highlights the single most relevant Pro feature based on their usage pattern
4. **Reply encouragement** — Add "Reply to this email if you need help fixing any issues" footer to build sender reputation and collect feedback
5. **Re-engagement trigger** — If a user hasn't logged in for 14+ days but opens the digest email, trigger an in-app notification on their next visit: "Welcome back! Here's what's changed since your last visit"

---

## 4. Community & Distribution Channels

### Reddit Strategy

**Target subreddits:**
- r/juststart (25K+ — niche site builders, affiliate-first)
- r/affiliatemarketing (80K+ — broad affiliate community)
- r/blogging (400K+ — content creators, many with affiliate income)
- r/SEO (150K+ — technical audience, link-aware)
- r/Entrepreneur (2M+ — broad, use sparingly)
- r/SaaS (30K+ — founder/builder community)

**Approach:**
- **Never self-promote directly.** Build reputation first (2+ weeks of genuine commenting)
- Post value-first content: "I analyzed 500 affiliate sites and here's the average link rot rate by network" (use aggregate data)
- Answer questions about broken links, affiliate tracking issues, link management
- When relevant (someone asks "how do I check for broken affiliate links?"), mention LinkRescue as one option among several
- Weekly time investment: 3 hours (30 min/day, 4 days/week)

### Twitter/X Strategy

**Content pillars (3-4 tweets/day):**
1. **Data insights** (2x/week): "LinkRescue scanned 10,000 affiliate links this week. 12% were broken. Amazon Associates had the highest rot rate at 18%."
2. **Building in public** (2x/week): Revenue updates, feature launches, user milestones
3. **Affiliate marketing tips** (2x/week): Quick tips about link management, tracking parameters, common mistakes
4. **User wins** (1x/week): "A user just discovered $340/month in broken Amazon links. Fixed them in 20 minutes."

**Growth tactics:**
- Engage daily with: @nichepursuits, @authorityhacker, @aaborji, @maboroshi_a, @fattmerchant
- Join Twitter Spaces about affiliate marketing and SEO
- Create a weekly thread: "#AffiliateLinksMonday — share your link health score"

### LinkedIn Strategy

**Audience:** Agency owners, marketing directors, content team leads

**Content (2x/week):**
- Case studies positioned for business impact: "How a 200-page content site recovered $54K/year by auditing affiliate links"
- Agency-tier use cases: "Why affiliate marketing agencies need automated link monitoring"
- Thought leadership: "The invisible revenue leak in affiliate programs"

### Product Hunt Launch Playbook

**Preparation (2 weeks before):**
1. Recruit 5 hunters (ideally with 100+ followers). Ask the top one to submit
2. Prepare assets: logo (240x240), gallery images (5-6 screenshots), tagline (60 chars max), description
3. Line up 20+ people to leave genuine comments and upvotes on launch day
4. Prepare maker comment with backstory, why you built it, and an offer (extended free trial or discount)

**Launch day:**
- Submit at 12:01 AM PT (Product Hunt resets daily)
- Respond to every comment within 1 hour
- Share on Twitter, LinkedIn, email list immediately
- Post in relevant Slack/Discord communities

**Tagline options:**
- "Stop losing commissions to broken affiliate links"
- "Your affiliate links are rotting. We catch them before they cost you."
- "Automated broken affiliate link monitoring for content creators"

### Indie Hackers / Hacker News

**Indie Hackers:**
- Post monthly revenue updates in the "Revenue" section
- Write a detailed "How I built it" product page
- Engage in the affiliate marketing and SaaS groups
- AMA after reaching $1K MRR milestone

**Hacker News:**
- "Show HN" post on launch day (technical angle: "We scan X pages/day for affiliate link rot using Y approach")
- Follow up with "Ask HN: What tools do affiliate marketers actually need?" (research disguised as engagement)
- Share the annual "State of Affiliate Link Health" data report

### Partnership Opportunities

1. **Affiliate networks** — Reach out to partner managers at Amazon Associates, ShareASale, CJ, Impact. Pitch: "We help your publishers maintain healthy links, which means more conversions for your advertisers." Ask for newsletter mention or co-marketing
2. **WordPress plugin directories** — If you build a WP plugin for link scanning, submit to wordpress.org repository. This is a massive distribution channel for bloggers
3. **Hosting companies** — Partner with affiliate-friendly hosts (Cloudways, Kinsta, WP Engine) for cross-promotion
4. **Email newsletter sponsors** — Sponsor newsletters read by affiliate marketers: The Affiliate Marketing Newsletter, Niche Pursuits Weekly, Authority Hacker Digest

---

## 5. Pricing & Conversion

### Free Trial Optimization

**What free users see:**
- Full scan results with all issue types
- Health score (visible but updates weekly, not daily)
- Gated features show a blurred preview + upgrade CTA:
  - Revenue estimates: "Estimated revenue at risk: $XXX/mo" (blurred number)
  - Fix suggestions: "AI-powered fix suggestion available" (locked)
  - Historical trends: Chart visible for 2 weeks, then "Upgrade for full history"

**Upgrade trigger points (in order of effectiveness):**
1. When scan finds 5+ broken links — "You have $X at risk. Pro catches these daily."
2. When user tries to add 2nd site — Hard gate with upgrade CTA
3. Day 7 of free usage — In-app banner: "Your scan runs weekly. Broken links can appear any day."
4. When viewing revenue estimates — Blurred numbers with "Unlock with Pro"
5. After 3rd manual login in a week — "You check often. Let Pro's daily scans do it for you."

### Annual Billing Push Strategy

**Goal:** Increase annual plan adoption to 40%+ of paid users (industry average: 20-30%).

**Tactics:**
1. **Pricing page default** — Show annual pricing by default. Monthly shows as "+17% vs annual" instead of annual showing as "save 17%." Reframe monthly as the premium choice
2. **Checkout nudge** — On monthly checkout: "Switch to annual and save $58/year. That's 2 months free." Show the math
3. **Month 3 email** — "You've been on Pro for 3 months ($87 spent). Switch to annual and save $58 this year." Include one-click switch link
4. **Black Friday/Year-end offer** — Annual plan discount (40% off first year) to drive a burst of annual conversions
5. **Annual-only perks** — Consider: annual Pro users get "priority scan queue" or "early access to new features"

### Agency Tier Outreach Playbook

**Target:** Affiliate marketing agencies managing 10+ client sites.

**Identification:**
- Search LinkedIn for "affiliate marketing agency" + "founder/CEO/director"
- Look at agencies on Clutch.co under "affiliate marketing"
- Monitor r/affiliatemarketing for agency owners asking about tools
- Check affiliate network partner directories

**Outreach template:**
```
Subject: Managing affiliate links across [X] client sites?

Hi [Name],

I noticed [Agency] manages affiliate programs for [client type].

Quick question: how do you currently monitor for broken affiliate links across your client sites?

We built LinkRescue specifically for this — it scans daily across unlimited pages, catches broken links before they hurt client revenue, and generates white-label reports you can share with clients.

Our Agency plan ($79/mo) monitors 25 sites. Would you be open to a 15-minute walkthrough?

— Carson
```

**Sales process:**
1. LinkedIn connection + personalized note
2. If accepted, send brief message (not a pitch deck)
3. Offer free Agency trial (30 days) to scan their top 3 client sites
4. Follow up with scan results showing real issues found
5. Close on ROI: "If we catch even one $50/month revenue leak per client, LinkRescue pays for itself"

---

## 6. Affiliate Program Activation

### Leveraging Existing Rewardful Setup

The Rewardful integration is built into the codebase (tracking script in layout, affiliate tracking through Stripe checkout). Activation requires:

1. **Create Rewardful account** at rewardful.com
2. **Set up campaign** with these parameters:
   - Commission: 30% recurring
   - Duration: 12 months
   - Cookie window: 90 days
   - Minimum payout: $50
   - Payment method: PayPal / Wise
3. **Add API key** to `NEXT_PUBLIC_REWARDFUL_API_KEY`
4. **Set signup URL** in `NEXT_PUBLIC_REWARDFUL_SIGNUP_URL`
5. **Connect Stripe** in Rewardful dashboard to automatically track conversions

### Affiliate Recruitment Targets

**Tier 1 — High-Value Partners (recruit first 10)**
- Affiliate marketing bloggers with 10K+ monthly readers
- YouTube creators covering affiliate marketing (channels like Income School, Niche Pursuits, Authority Hacker)
- Newsletter writers in the affiliate/SEO space
- Approach: Personal email, offer early access + higher commission (35% for first 6 months)

**Tier 2 — Mid-Tier Partners (recruit 50 over 3 months)**
- Bloggers reviewing SaaS tools, SEO tools, marketing tools
- WordPress tutorial creators who cover affiliate plugins
- Indie hackers / build-in-public creators with audiences
- Approach: Affiliate page + outreach template

**Tier 3 — Long-Tail Partners (self-serve, ongoing)**
- Any LinkRescue user who wants to refer others
- Micro-influencers in niche site building communities
- Approach: In-app "Refer & Earn" prompt after 30 days of active use

### Commission Structure Rationale

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Commission rate | 30% recurring | Industry standard for SaaS affiliate programs is 20-30%. 30% is competitive and attracts quality affiliates. On Pro ($29/mo), affiliate earns $8.70/mo per referral — meaningful but sustainable |
| Duration | 12 months | Longer than most (typical: 3-6 months). Creates real passive income for affiliates, increasing motivation. LTV math works: if avg customer stays 18+ months, 12 months of 30% commission is ~20% of LTV |
| Cookie window | 90 days | Generous vs industry standard (30-60 days). Affiliate marketing audiences have long consideration cycles. 90 days captures users who research, forget, then come back |
| Minimum payout | $50 | Low enough to be achievable (6 Pro referrals), high enough to reduce payment processing overhead |

### Swipe Copy and Creative Assets List

**Assets to create:**

1. **Banner ads** (sizes: 728x90, 300x250, 160x600, 320x50 mobile)
   - Design A: "Your affiliate links are breaking. Find out which ones." + CTA
   - Design B: Health score gauge showing 62/100 + "How healthy are your links?"
   - Design C: Dollar amount ($2,400/year) + "This is what broken links cost the average affiliate site"

2. **Email swipe copy** (3 versions):
   - Newsletter sponsor format (100 words)
   - Dedicated send format (300 words)
   - P.S. mention format (50 words)

3. **Social media posts** (ready to copy-paste):
   - Twitter (5 tweet variations)
   - LinkedIn (2 post variations)
   - Facebook group post format

4. **Video talking points** — For YouTube creators:
   - 60-second feature walkthrough script
   - "How I found $X in broken links" testimonial format
   - Comparison demo vs manual checking

5. **Blog post template** — 1,500-word review template affiliates can customize:
   - "LinkRescue Review: Is It Worth $29/Month for Affiliate Link Monitoring?"
   - Pre-filled with features, pricing, pros/cons, screenshots

---

## 7. Metrics & KPIs

### North Star Metric

**Weekly Active Scans (WAS)** — Number of unique sites scanned per week (automated + manual).

*Rationale:* Scans are the core value delivery. A user whose site is being scanned is getting value, is seeing results, and is unlikely to churn. WAS correlates with retention, expansion (add more sites), and revenue better than signups or MAU.

### Supporting Metrics

| Category | Metric | Target (Month 3) | Target (Month 6) | Target (Month 12) |
|----------|--------|-------------------|-------------------|---------------------|
| **Acquisition** | Monthly signups | 200 | 500 | 1,500 |
| **Acquisition** | Organic traffic (monthly) | 2,000 | 8,000 | 25,000 |
| **Acquisition** | Product Hunt launch upvotes | 300+ (one-time) | — | — |
| **Activation** | Signup-to-first-scan rate | 60% | 70% | 75% |
| **Activation** | Time to first scan | < 5 min | < 3 min | < 3 min |
| **Revenue** | MRR | $1,500 | $5,000 | $15,000 |
| **Revenue** | Annual plan % of paid | 25% | 35% | 45% |
| **Revenue** | ARPU (monthly) | $35 | $38 | $42 |
| **Retention** | Monthly churn rate | 8% | 6% | 4% |
| **Retention** | Monthly digest open rate | 45% | 50% | 50% |
| **Retention** | 30-day retention (free) | 30% | 40% | 45% |
| **Expansion** | Free-to-paid conversion | 5% | 8% | 10% |
| **Expansion** | Pro-to-Agency upgrade rate | 3% | 5% | 7% |
| **Affiliate** | Active affiliates | 10 | 50 | 150 |
| **Affiliate** | Affiliate-sourced revenue % | 5% | 15% | 25% |

### Funnel Benchmarks

```
Visitor → Signup:           3-5%  (landing page conversion)
Signup → Email Verified:    70-80%
Verified → First Site Added: 60-70%
Site Added → First Scan:    90%+ (automated)
First Scan → Day 7 Active:  40-50%
Day 7 Active → Day 30 Active: 50-60%
Free → Paid (lifetime):     8-12%
Trial → Paid (if trial):    25-35%
```

### Weekly Tracking Dashboard

Recommended setup using **PostHog** (free tier) or **Plausible + custom dashboard**:

**Weekly review (every Monday):**
- New signups (by source/UTM)
- Weekly Active Scans
- Free-to-paid conversions
- Churn events
- Support tickets / feedback themes
- Top performing content (by signups driven)

**Monthly review (first Monday):**
- MRR and MRR growth rate
- Cohort retention curves (Month 0, 1, 2, 3...)
- Channel performance (which channels drive highest-LTV users)
- Affiliate program performance
- Content ROI (content piece → signups → revenue)
- NPS or satisfaction survey results

**Quarterly review:**
- CAC by channel
- LTV:CAC ratio (target: 3:1+)
- Annual plan adoption trend
- Agency tier pipeline
- Competitive landscape changes

---

## Appendix: SaaS Directory Submission List

Submit LinkRescue to these directories within the first month:

| Directory | URL | Priority |
|-----------|-----|----------|
| Product Hunt | producthunt.com | High |
| AlternativeTo | alternativeto.net | High |
| G2 | g2.com | High |
| Capterra | capterra.com | High |
| GetApp | getapp.com | Medium |
| SaaSHub | saashub.com | Medium |
| SaaSWorthy | saasworthy.com | Medium |
| ToolFinder | toolfinder.co | Medium |
| StartupStash | startupstash.com | Medium |
| BetaList | betalist.com | Medium |
| Launching Next | launchingnext.com | Low |
| SideProjectors | sideprojectors.com | Low |
| MicroLaunch | microlaunch.net | Low |
| Uneed | uneed.best | Low |
| There's An AI For That | theresanaiforthat.com | Low |
| AppSumo Marketplace | appsumo.com | Medium (consider lifetime deal) |

---

## Appendix: Competitive Positioning

| Feature | LinkRescue | Screaming Frog | Ahrefs | Dead Link Checker |
|---------|-----------|---------------|--------|-------------------|
| Purpose-built for affiliates | Yes | No | No | No |
| Affiliate parameter checking | Yes | No | No | No |
| Revenue impact estimates | Yes | No | No | No |
| Automated daily scans | Yes | Manual only | Weekly (site audit) | Manual only |
| Health score trends | Yes | No | No | No |
| Fix suggestions (AI) | Yes | No | No | No |
| Slack alerts | Yes (Agency) | No | Yes | No |
| API access | Yes (Agency) | No | Yes | No |
| Starting price | Free / $29/mo | Free / $259/yr | $99/mo | Free |

**Key differentiator:** LinkRescue is the only tool that understands affiliate links are different from regular links — it checks tracking parameters, detects program changes, estimates revenue impact, and runs on autopilot.
