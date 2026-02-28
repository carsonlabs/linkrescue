# LinkRescue.io — Development Guide

## Project Context
This is LinkRescue.io — a broken affiliate link monitoring SaaS for affiliate marketers.
Stack: Next.js (App Router) + Supabase + Stripe + Vercel
Business context: An independent audit identified critical structural weaknesses in pricing, churn risk, and missing features. The following changes need to be implemented in priority order.
Owner: Carson (solo founder, micro-SaaS studio)

## Phase 0: Full Codebase Audit
Before writing ANY code, complete this audit. Read every file and present your findings.
What to audit:

- **Directory structure** — Map the full project tree. Identify all source directories, config files, and entry points.
- **Database schema** — Find and document all Supabase tables, columns, relationships, and RLS policies. Check for:
  - `supabase/migrations/` directory
  - Any schema files or type definitions
  - The Supabase client setup file
- **Stripe integration** — Find and document:
  - Current products and price IDs (check env files and code)
  - Webhook handler location and events handled
  - Subscription status check logic
  - Checkout flow
- **Auth flow** — Map: signup → verify → onboard → dashboard
- **Crawler engine** — Understand:
  - How site scanning works (job queue, scheduling, link checking logic)
  - Where scan results are stored
  - How scan frequency is controlled per tier
- **Email system** — What provider, what templates, what triggers them
- **Tier/plan gating** — Find every place the app checks the user's plan or enforces limits. Search for hardcoded values like 50, 500, 5 sites, weekly, etc.

**Deliverable:**
Present a summary before proceeding:
- Architecture overview
- Database schema
- Current tier limits and where they're enforced
- Technical debt or bugs spotted
- Any blockers for the changes below

Ask me to confirm before moving to Phase 1.

## Phase 1: Pricing Restructure (HIGHEST PRIORITY)

### 1.1 — New Tier Limits
Create a central config file. Replace ALL hardcoded tier checks with references to this config:

```typescript
// lib/config/tiers.ts
export const TIER_LIMITS = {
  free: {
    name: 'Starter',
    price: 0,
    sites: 1,
    pagesPerScan: 200,
    scanFrequency: 'weekly',
    features: ['basic_alerts', 'monthly_digest']
  },
  pro: {
    name: 'Pro',
    price: 29,
    annualPrice: 290, // 2 months free
    sites: 5,
    pagesPerScan: 2000,
    scanFrequency: 'daily',
    features: ['basic_alerts', 'weekly_digest', 'revenue_estimates', 'fix_suggestions']
  },
  agency: {
    name: 'Agency',
    price: 79,
    annualPrice: 790, // 2 months free
    sites: 25,
    pagesPerScan: Infinity,
    scanFrequency: 'hourly',
    features: [
      'basic_alerts', 'realtime_alerts', 'revenue_estimates', 'fix_suggestions',
      'api_access', 'webhooks', 'whitelabel_reports', 'slack_integration', 'priority_support'
    ]
  }
} as const;

export type TierName = keyof typeof TIER_LIMITS;

export function hasFeature(tier: TierName, feature: string): boolean {
  return TIER_LIMITS[tier].features.includes(feature);
}

export function getTierLimits(tier: TierName) {
  return TIER_LIMITS[tier];
}
```

Search the entire codebase for hardcoded tier values and replace them.

### 1.2 — Stripe Changes
- Note which Stripe products/prices need to be created (I'll create them manually in the Stripe dashboard)
- Add support for monthly AND annual billing in the checkout flow
- Update the webhook handler for upgrades, downgrades, and tier changes
- Update subscription status checks to support three tiers

### 1.3 — Pricing Page Redesign
- Three-column layout, Pro highlighted as "Most Popular"
- Monthly/annual toggle with "Save 17%" badge
- Feature comparison table below the cards
- Social proof near pricing
- FAQ section addressing objections

### 1.4 — Gate Features by Tier
Update all feature gates throughout the app to use the central config. Every check should go through `hasFeature()` or `getTierLimits()`.

**After completing Phase 1:**
- List all new env vars needed
- List exact Stripe products/prices I need to create
- Verify the app runs without errors
- Suggest a commit message

Ask me to confirm before moving to Phase 2.

## Phase 2: Anti-Churn Engine

### 2.1 — Site Health Score
Add a 0–100 health score per site:
- Formula: healthy link ratio (40%) + scan coverage (20%) + days since last critical issue (20%) + affiliate param integrity rate (20%)
- Display as a prominent gauge/ring on the dashboard
- Store daily snapshots in a new `site_health_scores` table
- Show trend arrow (improving/declining)

### 2.2 — Monthly Link Health Report Email
Automated monthly email for ALL users (including free):
- Pages scanned, links checked, issues found/resolved
- Health score + month-over-month comparison
- Estimated revenue protected (Pro/Agency only)
- Soft upsell CTA for free tier users
- "View full report" button driving re-engagement

### 2.3 — Historical Trend Dashboard
New dashboard section:
- Line chart: health score over time (30/60/90 day views)
- Bar chart: broken links per month
- Table: which affiliate programs have the most link rot
- Stat cards: total links monitored, issues caught, revenue saved

Create the necessary database tables and views.

### 2.4 — Network Intelligence Schema (DB only)
Set up tables for future cross-user intelligence:
- `affiliate_programs` — known programs and URL patterns
- `program_health` — aggregated rot rates per program
- `network_alerts` — cross-user early warning alerts

Don't build UI — just schema and a basic aggregation query.

**After completing Phase 2:**
- List new Supabase tables and migration SQL
- Verify app runs without errors
- Suggest a commit message

Ask me to confirm before moving to Phase 3.

## Phase 3: On-Demand Scanning

### 3.1 — Manual Scan Trigger
- "Scan Now" button on each site card
- API endpoint: `POST /api/sites/[siteId]/scan`
- Rate limits: Pro = 1/hour, Agency = 1/15min, Free = none
- Real-time progress indicator (Supabase Realtime or polling)
- Dashboard updates in real-time when scan completes

### 3.2 — Webhook-Triggered Scans (Agency Only)
- Endpoint: `POST /api/webhooks/scan`
- Validates API key against Agency subscription
- Queues scan identical to manual trigger
- Simple API docs page

**After completing Phase 3:**
- Verify app runs without errors
- Suggest a commit message

Ask me to confirm before moving to Phase 4.

## Phase 4: API & Webhook Infrastructure (Agency Tier)

### 4.1 — API Key Management
- "API Keys" section in Agency settings
- Generate/revoke keys (store hashed in Supabase)
- Keys scoped to user's sites only

### 4.2 — Outbound Webhooks
- Webhook settings for Agency users
- Configurable URLs for events: `scan.completed`, `link.broken`, `link.fixed`
- Webhook delivery with retry (3 attempts, exponential backoff)
- "Test webhook" button

### 4.3 — Slack Integration (Agency)
- Incoming webhook integration (user provides Slack webhook URL)
- Sends formatted messages on: new broken links, weekly summary, scan complete
- Settings page with test message button

**After completing Phase 4:**
- Verify app runs without errors
- Suggest a commit message

Ask me to confirm before moving to Phase 5.

## Phase 5: Affiliate Program Setup

### 5.1 — Rewardful Integration
- Tracking script in `<head>` on all pages
- Pass referral data through Stripe checkout
- Create `/affiliates` page:
  - 30% recurring commission, 12 months, 90-day cookie
  - Signup link to Rewardful dashboard
  - Marketing assets and sample copy
  - Program FAQ

If Rewardful isn't set up yet, create page structure with TODO placeholders.

**After completing Phase 5:**
- List any third-party accounts/keys needed
- Verify app runs without errors
- Suggest a commit message

Ask me to confirm before moving to Phase 6.

## Phase 6: Landing Page & SEO Infrastructure

### 6.1 — Landing Page Updates
- Update pricing section for three tiers
- Add "Affiliate Program" to footer + nav
- Add testimonial/social proof section (placeholder)
- Add "For Agencies" benefits section
- Improve "How it works" with 4th step about health reports

### 6.2 — Programmatic SEO Templates
Create reusable dynamic route templates:
- `/check/[network]` — "[Network] Affiliate Link Checker"
- `/vs/[competitor]` — "LinkRescue vs [Competitor]"
- `/guides/[slug]` — Blog/guide template

For each:
- Next.js dynamic route with proper metadata/SEO tags
- Content schema in Supabase
- ISR with 24h revalidation
- Open Graph tags, canonical URLs, JSON-LD structured data

Don't populate content — just build the infrastructure.

**After completing Phase 6:**
- Verify app runs without errors
- Suggest a commit message

## Implementation Rules
Follow these strictly throughout ALL phases:

1. **Don't break existing functionality.** Test after each phase.
2. **Match existing patterns.** Use the current code style and conventions.
3. **Central config over hardcoded values.** All tier limits and feature flags in config files.
4. **Database migrations.** Create proper SQL migration files for any new tables.
5. **Type safety.** Full TypeScript types, no `any`.
6. **Error handling.** All API routes need proper error handling.
7. **Loading states.** All new data-fetching UI needs loading + empty states.
8. **Mobile responsive.** Test at 375px width.
9. **Small commits.** After each phase, give me a clear commit message.

## Session Management
If we hit context limits or need to continue in a new session:
- This CLAUDE.md file persists — Claude Code will re-read it automatically
- Just tell me which phase and step to resume from
- I'll re-read the relevant files and continue

## Current Progress
- [x] Phase 0: Full Codebase Audit
- [x] Phase 1: Pricing Restructure
- [x] Phase 2: Anti-Churn Engine
- [x] Phase 3: On-Demand Scanning
- [x] Phase 4: API & Webhook Infrastructure
- [x] Phase 5: Affiliate Program Setup
- [x] Phase 6: Landing Page & SEO Infrastructure
