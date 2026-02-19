# LinkRescue - Broken Affiliate Link Monitor

**LinkRescue** is a production-ready micro-SaaS application that automatically monitors websites for broken and redirected affiliate links, helping site owners recover lost revenue. This monorepo scaffold provides a complete foundation for building and deploying the MVP.

---

## Architecture Overview

LinkRescue is built as a **modern TypeScript monorepo** using **Turborepo** for efficient build orchestration. The architecture separates concerns into distinct packages while maintaining type safety across the entire stack.

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 (App Router) + React | Server-rendered UI with modern routing |
| **Styling** | Tailwind CSS | Utility-first styling with design system |
| **Backend** | Next.js API Routes | Serverless API endpoints |
| **Database** | Supabase (PostgreSQL) | Managed Postgres with real-time capabilities |
| **Authentication** | Supabase Auth | OAuth and email/password authentication |
| **Payments** | Stripe | Subscription billing and webhooks |
| **Email** | Resend + React Email | Transactional emails with React templates |
| **Background Jobs** | Vercel Cron | Scheduled link scanning |
| **Crawler** | Cheerio + Fetch API | Deterministic sitemap parsing and HTML crawling |
| **Deployment** | Vercel | Edge-optimized hosting with zero-config |
| **Monorepo** | Turborepo + pnpm | Fast builds with workspace management |

---

## Monorepo Structure

The repository is organized into **apps** (deployable applications) and **packages** (shared libraries):

```
linkrescue/
├── apps/
│   └── web/                    # Next.js web application
│       ├── src/
│       │   ├── app/           # App Router pages and API routes
│       │   ├── components/    # React components
│       │   └── lib/           # App-specific utilities
│       └── public/            # Static assets
│
├── packages/
│   ├── database/              # Supabase client, schema, and queries
│   ├── crawler/               # Link scanning engine
│   ├── email/                 # Email templates and sending logic
│   ├── types/                 # Shared TypeScript types
│   └── config/                # Shared ESLint, TypeScript, Tailwind configs
│
└── .github/workflows/         # CI/CD pipelines
```

### Package Responsibilities

**`@linkrescue/web`** (apps/web)  
The main Next.js application containing all user-facing pages, API routes, and UI components. Handles authentication flows, dashboard views, site management, and Stripe integration.

**`@linkrescue/database`** (packages/database)  
Centralized database access layer that exports typed Supabase clients, schema definitions, and reusable query functions. Includes SQL migration files for version-controlled schema changes.

**`@linkrescue/crawler`** (packages/crawler)  
The core link scanning engine. Fetches sitemaps, crawls pages using Cheerio, extracts outbound links, checks HTTP status codes, detects redirects, and classifies issues. Designed with rate limiting, timeouts, and retry logic.

**`@linkrescue/email`** (packages/email)  
Email service abstraction using Resend. Contains React Email templates for welcome emails and weekly revenue leak reports. Provides a simple `sendEmail` function for transactional messaging.

**`@linkrescue/types`** (packages/types)  
Shared TypeScript types and interfaces used across the monorepo. Ensures type safety for domain models like `Site`, `Scan`, `Link`, and `User`.

**`@linkrescue/config`** (packages/config)  
Shared configuration for ESLint, TypeScript, and Tailwind CSS. Ensures consistency across all packages and apps.

---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed and configured:

- **Node.js** (v18 or higher)
- **pnpm** (v8 or higher) - Install with `npm install -g pnpm`
- **Supabase account** - [Sign up here](https://supabase.com)
- **Stripe account** - [Sign up here](https://stripe.com)
- **Resend account** - [Sign up here](https://resend.com)
- **Vercel account** - [Sign up here](https://vercel.com)

### Installation

Clone the repository and install dependencies:

```bash
git clone <your-repo-url>
cd linkrescue
pnpm install
```

This will install all dependencies for the monorepo, including all apps and packages.

---

## Configuration

### Environment Variables

Copy the root `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

You will need to obtain API keys and configuration values from the following services:

#### Supabase Configuration

1. Create a new project in your [Supabase dashboard](https://app.supabase.com)
2. Navigate to **Project Settings > API**
3. Copy the **Project URL** and **Anon Key** to your `.env` file
4. Copy the **Service Role Key** (for server-side operations) to your `.env` file

#### Stripe Configuration

1. Log in to your [Stripe dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers > API keys**
3. Copy the **Publishable key** and **Secret key** to your `.env` file
4. Set up a webhook endpoint (after deploying to Vercel) and copy the **Signing secret**

#### Resend Configuration

1. Log in to your [Resend dashboard](https://resend.com/dashboard)
2. Navigate to **API Keys**
3. Create a new API key and copy it to your `.env` file

#### Vercel Cron Secret

Generate a strong random string to protect your cron endpoint:

```bash
openssl rand -base64 32
```

Add this value to your `.env` file as `CRON_SECRET`.

---

## Database Setup

LinkRescue uses **Supabase** for database and authentication. The schema is defined in SQL migration files for version control and reproducibility.

### Running Migrations

1. Open the [Supabase SQL Editor](https://app.supabase.com/project/_/sql)
2. Execute the contents of `packages/database/migrations/001_initial_schema.sql`
3. This will create all tables, indexes, row-level security policies, and triggers

### Schema Overview

The database schema includes the following tables:

| Table | Purpose |
|-------|---------|
| `users` | User profiles with Stripe subscription data |
| `sites` | Websites being monitored |
| `pages` | Individual pages discovered on each site |
| `links` | Outbound links found on pages |
| `scans` | Scan jobs and their status |
| `scan_events` | Logs and events from scan execution |

**Row-Level Security (RLS)** is enabled on all tables to ensure users can only access their own data.

---

## Development

Start the development server:

```bash
pnpm dev
```

This will start the Next.js application at **http://localhost:3000**.

The development server includes:
- Hot module replacement for instant feedback
- TypeScript type checking
- Tailwind CSS compilation
- Automatic code formatting with Prettier

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Run ESLint across the monorepo |
| `pnpm format` | Format code with Prettier |
| `pnpm type-check` | Run TypeScript type checking |

---

## Deployment

### Deploying to Vercel

LinkRescue is optimized for deployment on **Vercel**, which provides zero-config hosting for Next.js applications.

1. **Connect your repository** to Vercel
2. **Configure environment variables** in the Vercel dashboard (Project Settings > Environment Variables)
3. **Deploy** - Vercel will automatically detect the Next.js app and deploy it

### Configuring Vercel Cron

The `vercel.json` file in `apps/web` defines a cron job that runs daily at midnight:

```json
{
  "crons": [
    {
      "path": "/api/cron/scan",
      "schedule": "0 0 * * *"
    }
  ]
}
```

Ensure the `CRON_SECRET` environment variable is set in Vercel to protect this endpoint from unauthorized access.

### Stripe Webhook Configuration

After deploying to Vercel, configure a Stripe webhook:

1. Navigate to **Developers > Webhooks** in your Stripe dashboard
2. Add a new endpoint with your deployed URL: `https://your-app.vercel.app/api/webhooks/stripe`
3. Select the events to listen for (e.g., `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`)
4. Copy the **Signing secret** and add it to your Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

---

## Product Scope (MVP)

The initial MVP includes the following features:

### Core Features

**Authentication** - Users can sign up and log in using Supabase Auth (email/password or OAuth providers).

**Site Management** - Users can add websites to monitor. Ownership is verified via a meta tag placed in the site's HTML.

**Link Scanning** - The crawler fetches the sitemap.xml file or falls back to crawling the site (depth 2). It extracts all outbound links, checks their HTTP status, detects redirects, and classifies issues.

**Dashboard** - Users can view a table of issues filtered by type (broken, redirected) and status. Each issue shows the page URL, link URL, HTTP code, and redirect destination.

**Weekly Email Reports** - Users receive a weekly "Revenue Leak Report" via Resend, summarizing broken and redirected affiliate links.

**Subscription Gating** - Free tier allows 1 site with limited pages. Paid tier (via Stripe) unlocks more sites and higher page limits.

### Technical Safeguards

The application includes the following production-ready safeguards:

- **Rate limiting** on crawler requests to avoid overwhelming target servers
- **Timeouts** on all HTTP requests to prevent hanging operations
- **Retries** with exponential backoff for transient failures
- **Logging** via `scan_events` table for debugging and monitoring
- **Row-Level Security** on all database tables to prevent unauthorized access

---

## Next Steps

This scaffold provides the foundation for LinkRescue. To complete the MVP, follow the **Implementation Checklist** in `IMPLEMENTATION_CHECKLIST.md`.

The checklist is organized into phases:

1. **Core Backend & Authentication** - Implement Supabase clients, auth UI, middleware, and site management APIs
2. **Crawler Engine Implementation** - Complete sitemap parsing, fallback crawling, link extraction, and database integration
3. **Dashboard & User Interface** - Build the site list, issues table, and site detail pages
4. **Payments & Subscriptions** - Implement Stripe webhooks, pricing page, and feature gating
5. **Email & Final Polish** - Design email templates, implement sending logic, and add environment validation

Each task in the checklist is self-contained and can be implemented independently.

---

## Contributing

This project uses **Prettier** for code formatting and **ESLint** for linting. Before committing, run:

```bash
pnpm format
pnpm lint
```

The CI pipeline (defined in `.github/workflows/ci.yml`) will automatically run linting and type checking on all pull requests.

---

## License

This project is licensed under the MIT License.

---

## Support

For questions or issues, please open a GitHub issue or contact the development team.

**Built with ❤️ by the LinkRescue team**
