# LinkRescue Monorepo File Structure

```
linkrescue/
├── apps/
│   └── web/                          # Next.js 14+ App Router application
│       ├── src/
│       │   ├── app/                  # App Router pages
│       │   │   ├── (auth)/          # Auth route group
│       │   │   │   ├── login/
│       │   │   │   │   └── page.tsx
│       │   │   │   └── signup/
│       │   │   │       └── page.tsx
│       │   │   ├── (dashboard)/     # Protected dashboard routes
│       │   │   │   ├── layout.tsx   # Dashboard layout with nav
│       │   │   │   ├── page.tsx     # Dashboard home (sites list)
│       │   │   │   ├── sites/
│       │   │   │   │   ├── [id]/
│       │   │   │   │   │   ├── page.tsx      # Site detail + issues
│       │   │   │   │   │   └── settings/
│       │   │   │   │   │       └── page.tsx  # Site settings
│       │   │   │   │   └── new/
│       │   │   │   │       └── page.tsx      # Add new site
│       │   │   │   └── settings/
│       │   │   │       └── page.tsx          # User settings
│       │   │   ├── api/             # API routes
│       │   │   │   ├── auth/
│       │   │   │   │   └── callback/
│       │   │   │   │       └── route.ts      # Supabase auth callback
│       │   │   │   ├── cron/
│       │   │   │   │   └── scan/
│       │   │   │   │       └── route.ts      # Vercel Cron endpoint
│       │   │   │   ├── sites/
│       │   │   │   │   ├── route.ts          # POST create site
│       │   │   │   │   └── [id]/
│       │   │   │   │       ├── route.ts      # GET/PATCH/DELETE site
│       │   │   │   │       ├── verify/
│       │   │   │   │       │   └── route.ts  # POST verify ownership
│       │   │   │   │       └── scan/
│       │   │   │   │           └── route.ts  # POST trigger scan
│       │   │   │   ├── webhooks/
│       │   │   │   │   └── stripe/
│       │   │   │   │       └── route.ts      # Stripe webhook handler
│       │   │   │   └── health/
│       │   │   │       └── route.ts          # Health check
│       │   │   ├── layout.tsx       # Root layout
│       │   │   ├── page.tsx         # Landing page
│       │   │   ├── pricing/
│       │   │   │   └── page.tsx
│       │   │   └── globals.css      # Tailwind imports
│       │   ├── components/          # React components
│       │   │   ├── ui/              # Shadcn-style base components
│       │   │   │   ├── button.tsx
│       │   │   │   ├── card.tsx
│       │   │   │   ├── table.tsx
│       │   │   │   ├── badge.tsx
│       │   │   │   └── input.tsx
│       │   │   ├── auth/
│       │   │   │   ├── login-form.tsx
│       │   │   │   └── signup-form.tsx
│       │   │   ├── dashboard/
│       │   │   │   ├── site-card.tsx
│       │   │   │   ├── issues-table.tsx
│       │   │   │   └── scan-status.tsx
│       │   │   └── layout/
│       │   │       ├── header.tsx
│       │   │       ├── sidebar.tsx
│       │   │       └── footer.tsx
│       │   ├── lib/                 # App-specific utilities
│       │   │   ├── supabase/
│       │   │   │   ├── client.ts    # Browser client
│       │   │   │   ├── server.ts    # Server client
│       │   │   │   └── middleware.ts
│       │   │   ├── stripe.ts
│       │   │   └── utils.ts
│       │   └── middleware.ts        # Next.js middleware (auth)
│       ├── public/
│       │   ├── favicon.ico
│       │   └── logo.svg
│       ├── .env.local.example
│       ├── next.config.js
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       ├── package.json
│       └── vercel.json              # Vercel config (cron jobs)
│
├── packages/
│   ├── database/                    # Supabase DB client & types
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── client.ts            # Supabase client factory
│   │   │   ├── schema.ts            # Type definitions from DB
│   │   │   └── queries/             # Reusable queries
│   │   │       ├── sites.ts
│   │   │       ├── pages.ts
│   │   │       ├── links.ts
│   │   │       └── scans.ts
│   │   ├── migrations/              # SQL migration files
│   │   │   ├── 001_initial_schema.sql
│   │   │   ├── 002_add_indexes.sql
│   │   │   └── README.md
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── crawler/                     # Link scanning engine
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── sitemap.ts           # Sitemap.xml parser
│   │   │   ├── crawl.ts             # Fallback crawler (cheerio)
│   │   │   ├── link-extractor.ts    # Extract outbound links
│   │   │   ├── link-checker.ts      # HTTP status + redirect check
│   │   │   ├── classifier.ts        # Classify issues (broken, redirect, etc)
│   │   │   └── types.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── email/                       # Email templates & sender
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── client.ts            # Resend client
│   │   │   ├── templates/
│   │   │   │   ├── revenue-leak-report.tsx  # React Email template
│   │   │   │   └── welcome.tsx
│   │   │   └── send.ts              # Send functions
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── config/                      # Shared config (ESLint, TS, etc)
│   │   ├── eslint/
│   │   │   ├── index.js
│   │   │   └── package.json
│   │   ├── typescript/
│   │   │   ├── base.json
│   │   │   ├── nextjs.json
│   │   │   └── package.json
│   │   └── tailwind/
│   │       ├── index.js
│   │       └── package.json
│   │
│   └── types/                       # Shared TypeScript types
│       ├── src/
│       │   ├── index.ts
│       │   ├── site.ts
│       │   ├── scan.ts
│       │   ├── link.ts
│       │   └── user.ts
│       ├── package.json
│       └── tsconfig.json
│
├── .github/
│   └── workflows/
│       └── ci.yml                   # CI/CD (lint, type-check)
│
├── .env.example                     # Root env example
├── .gitignore
├── .prettierrc
├── .prettierignore
├── package.json                     # Root package.json (workspace)
├── pnpm-workspace.yaml
├── turbo.json                       # Turborepo config
└── README.md
```

## Folder Notes

### `/apps/web`
Main Next.js application. Contains all UI, API routes, and frontend logic. Uses App Router with route groups for clean organization.

### `/packages/database`
Centralized database access layer. Exports typed Supabase client, schema types, and reusable query functions. Includes SQL migrations for version control.

### `/packages/crawler`
Core scanning engine. Handles sitemap parsing, fallback crawling with cheerio, link extraction, HTTP checking, and issue classification. Designed to be rate-limited and timeout-safe.

### `/packages/email`
Email service abstraction using Resend. Contains React Email templates for transactional emails and weekly reports.

### `/packages/config`
Shared configuration for ESLint, TypeScript, and Tailwind. Ensures consistency across all packages and apps.

### `/packages/types`
Shared TypeScript types and interfaces used across the monorepo. Single source of truth for domain models.

## Key Design Decisions

1. **Monorepo with Turborepo**: Fast builds, shared dependencies, type-safe imports
2. **Package separation**: Clear boundaries between crawler, DB, email, and web app
3. **App Router**: Modern Next.js patterns with server components by default
4. **Route groups**: Clean URL structure without affecting file organization
5. **API routes co-located**: All backend logic in `/api` for easy deployment
6. **Migration-first DB**: SQL files in version control for reproducible schema
7. **Type safety**: Shared types package + generated Supabase types
