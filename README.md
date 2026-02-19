# LinkRescue - Broken Affiliate Link Monitor

**LinkRescue** is a production-ready micro-SaaS that automatically monitors websites for broken and redirected affiliate links, helping site owners recover lost revenue.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + React + Tailwind CSS |
| Database | Supabase (PostgreSQL) with RLS |
| Auth | Supabase Auth (magic link / passwordless) |
| Payments | Stripe subscriptions |
| Email | Resend + React Email |
| Cron | Vercel Cron (daily scans) |
| Crawler | fetch + Cheerio (no headless browser) |
| Monorepo | Turborepo + pnpm |

## Setup

### Prerequisites

- Node.js >= 18
- pnpm >= 8 (`npm install -g pnpm`)
- Supabase project ([supabase.com](https://supabase.com))
- Stripe account ([stripe.com](https://stripe.com))
- Resend account ([resend.com](https://resend.com))

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Fill in all values:

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase > Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Project Settings > API |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe > Developers > API keys |
| `STRIPE_SECRET_KEY` | Stripe > Developers > API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe > Developers > Webhooks |
| `STRIPE_PRO_PRICE_ID` | Stripe > Products > Pro plan price ID |
| `RESEND_API_KEY` | Resend > API Keys |
| `CRON_SECRET` | Generate: `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Your deployed URL (or `http://localhost:3000`) |

### 3. Database Setup

Run the migration SQL in your Supabase SQL Editor:

1. Open Supabase > SQL Editor
2. Paste the contents of `packages/database/migrations/001_initial_schema.sql`
3. Execute

This creates all tables with RLS policies:
- `users` - profiles + Stripe subscription data
- `sites` - monitored domains with verification
- `pages` - discovered pages per site
- `links` - outbound links with affiliate detection
- `scans` - scan jobs and status
- `scan_results` - per-link issue classification
- `scan_events` - scan log entries

### 4. Stripe Setup

1. Create a Product in Stripe with a monthly price (e.g., $29/month)
2. Copy the Price ID to `STRIPE_PRO_PRICE_ID`
3. After deploying, create a webhook endpoint at `https://your-app/api/webhooks/stripe`
4. Subscribe to events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

### Authentication
- Magic link (passwordless) via Supabase Auth
- Protected dashboard routes via middleware

### Site Management
- Add sites with domain + optional sitemap URL
- Ownership verification via meta tag:
  ```html
  <meta name="linkrescue-site-verification" content="YOUR_TOKEN" />
  ```

### Scan Engine
1. Tries sitemap (provided URL, then `domain/sitemap.xml`), supports sitemap index
2. Falls back to crawling internal links (depth=2, same-domain only)
3. Extracts external outbound links
4. Checks each link: HEAD then GET fallback, follows redirects (up to 5 hops), 10s timeout
5. Detects affiliate links (patterns: `ref=`, `aff=`, `tag=`, `utm_`, `affiliate`; networks: amzn.to, shareasale, cj, impact, clickbank, etc.)
6. Classifies issues: `BROKEN_4XX`, `SERVER_5XX`, `TIMEOUT`, `REDIRECT_TO_HOME`, `LOST_PARAMS`, `OK`

### Dashboard
- `/sites` - list sites with issue counts + last scan
- `/sites/[id]` - issues table with filters (by issue type) + search
- Trigger manual scans

### Email
- Weekly digest per user via Resend
- "Send test email" in Settings

### Stripe Plans
- **Free**: 1 site, 50 pages/scan
- **Pro** ($29/mo): 5 sites, 500 pages/scan
- Blocks site creation and scans when limits hit
- Checkout + billing portal

### Cron
- Vercel Cron daily at midnight: `GET /api/cron/scan`
- Scans all verified sites with plan-based page limits
- Concurrency limit of 3 parallel scans
- Sends digest emails after scans

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm type-check` | TypeScript check |
| `pnpm --filter @linkrescue/crawler test` | Run crawler tests |

## Project Structure

```
apps/web/              Next.js app (pages, API routes, components)
packages/database/     Supabase client, schema types, query functions
packages/crawler/      Sitemap parser, crawler, link checker, classifier
packages/email/        Resend client, React Email templates
packages/types/        Shared TypeScript types
packages/config/       Shared TS/ESLint/Tailwind config
```

## Launch Checklist

- [ ] Create Supabase project and run migration SQL
- [ ] Configure all environment variables
- [ ] Create Stripe product + price for Pro plan
- [ ] Deploy to Vercel
- [ ] Set environment variables in Vercel
- [ ] Configure Stripe webhook endpoint
- [ ] Verify Vercel Cron is active
- [ ] Configure Resend domain (for production email sending)
- [ ] Test: sign up, add site, verify, run scan, check issues
- [ ] Test: upgrade to Pro via Stripe checkout
- [ ] Test: receive weekly digest email

## License

MIT
