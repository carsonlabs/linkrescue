# LinkRescue

**Stop losing affiliate commissions to broken links.** LinkRescue monitors your entire site for broken, redirected, and parameter-stripped affiliate links — so you can fix them before they cost you money.

[linkrescue.io](https://linkrescue.io)

## What It Does

Affiliate sites lose revenue every day from links that silently break — 404s, merchant shutdowns, redirects that strip your affiliate parameters. LinkRescue crawls your full content archive (not just your sitemap), detects every affiliate link across 20+ networks, and tells you exactly what's broken and how much it's costing you.

**Key capabilities:**
- Full-archive crawling with sitemap + internal link discovery
- Affiliate link detection across Amazon, ShareASale, Impact, CJ, Awin, Rakuten, PartnerStack, and more
- Issue classification: broken (4xx/5xx), timeouts, redirect-to-home, lost parameters
- Health score tracking with 30/60/90-day trends
- AI-powered replacement offer matching for broken links
- Revenue impact estimates on highest-traffic pages
- Monthly health report emails
- API + webhooks for agency workflows
- Slack integration

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + React 18 + Tailwind CSS |
| Database | Supabase (PostgreSQL) with Row-Level Security |
| Auth | Supabase Auth (magic link / passwordless) |
| Payments | Stripe (3 tiers, monthly + annual billing) |
| Email | Resend + React Email |
| Scheduling | Vercel Cron |
| Crawler | Cheerio + fast-xml-parser (no headless browser) |
| AI | Anthropic Claude (offer matching, revenue analysis) |
| Monitoring | Sentry |
| Monorepo | Turborepo + pnpm |

## Plans

| | Starter (Free) | Pro ($29/mo) | Agency ($79/mo) |
|---|---|---|---|
| Sites | 1 | 5 | 25 |
| Pages/scan | 200 | 2,000 | Unlimited |
| Scan frequency | Weekly | Daily | Hourly |
| Revenue estimates | - | Yes | Yes |
| Fix suggestions | - | Yes | Yes |
| API access | - | - | Yes |
| Webhooks | - | - | Yes |
| Slack integration | - | - | Yes |

Annual billing available (save ~17%).

## Project Structure

```
apps/web/              Next.js app (pages, API routes, components)
packages/crawler/      Sitemap parser, crawler, link checker
packages/database/     Supabase client + schema types
packages/email/        Resend + React Email templates
packages/ai/           Claude integration (offer matching)
packages/governance/   Role-based access control
packages/types/        Shared TypeScript types
packages/cli/          Command-line tools
packages/config/       Shared TS/ESLint/Tailwind config
```

## Setup

### Prerequisites

- Node.js >= 20
- pnpm >= 8 (`npm install -g pnpm`)
- Supabase project
- Stripe account
- Resend account

### Install

```bash
pnpm install
cp apps/web/.env.example apps/web/.env
# Fill in env vars (see below)
pnpm dev
```

### Environment Variables

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase > Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Project Settings > API |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe > Developers > API Keys |
| `STRIPE_SECRET_KEY` | Stripe > Developers > API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe > Developers > Webhooks |
| `STRIPE_PRO_PRICE_ID` | Stripe > Products > Pro price ID |
| `STRIPE_AGENCY_PRICE_ID` | Stripe > Products > Agency price ID |
| `RESEND_API_KEY` | Resend > API Keys |
| `ANTHROPIC_API_KEY` | Anthropic > API Keys |
| `CRON_SECRET` | Generate: `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` or production URL |

### Database

Run the migration SQL in your Supabase SQL Editor:

```bash
# packages/database/migrations/001_initial_schema.sql
```

See `SUPABASE_SETUP.md` for full schema documentation.

### Stripe

1. Create three products: Starter (free), Pro ($29/mo + $290/yr), Agency ($79/mo + $790/yr)
2. Copy price IDs to env vars
3. Create webhook endpoint at `https://your-domain/api/webhooks/stripe`
4. Subscribe to: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Build all packages + Next.js |
| `pnpm lint` | Lint all code |
| `pnpm type-check` | TypeScript check |
| `pnpm --filter @linkrescue/crawler test` | Run crawler tests |

## Deploy

1. Push to GitHub
2. Connect repo to Vercel
3. Set all environment variables in Vercel dashboard
4. Configure Vercel Cron for daily scans
5. Create Stripe webhook endpoint pointing to production
6. Configure Resend domain for production email

## License

MIT
