# LinkRescue Implementation Checklist

This checklist outlines the development tasks required to build out the LinkRescue MVP based on the provided scaffold. The tasks are ordered by priority.

### Phase 1: Core Backend & Authentication

- [ ] **Task 1: Implement Supabase Client**: Flesh out the Supabase client logic in `packages/database/src/client.ts` and the server/client helpers in `apps/web/src/lib/supabase/`.
- [ ] **Task 2: Implement Auth UI**: Build the React components for the login and signup forms in `apps/web/src/components/auth/` and connect them to Supabase Auth.
- [ ] **Task 3: Implement Auth Middleware**: Complete the Next.js middleware (`apps/web/src/middleware.ts`) to protect dashboard routes and handle session management.
- [ ] **Task 4: Implement Site Creation API**: Build the API endpoint (`apps/web/src/app/api/sites/route.ts`) to handle creating a new site record in the database.
- [ ] **Task 5: Implement Site Verification**: Build the API and UI for meta tag-based domain ownership verification (`/api/sites/[id]/verify/route.ts`).

### Phase 2: Crawler Engine Implementation

- [ ] **Task 6: Implement Sitemap Parser**: Complete the `fetchSitemap` function in `packages/crawler/src/sitemap.ts` to fetch and parse `sitemap.xml` files.
- [ ] **Task 7: Implement Fallback Crawler**: Build the `crawlSite` function in `packages/crawler/src/crawl.ts` using `fetch` and `cheerio` for sites without a sitemap.
- [ ] **Task 8: Implement Link Extractor & Checker**: Complete the `link-extractor.ts` and `link-checker.ts` modules. Ensure robust error handling, timeouts, and retries.
- [ ] **Task 9: Implement Database Integration**: In `packages/crawler/src/index.ts`, add the logic to save scan results (pages, links, statuses) to the Supabase database using the `database` package.

### Phase 3: Dashboard & User Interface

- [ ] **Task 10: Build "Add Site" Form**: Create the UI and form logic for adding a new site in `apps/web/src/app/(dashboard)/sites/new/page.tsx`.
- [ ] **Task 11: Build Sites List**: Implement the main dashboard page that lists all of a user's sites.
- [ ] **Task 12: Build Issues Table**: Complete the `IssuesTable` component (`apps/web/src/components/dashboard/issues-table.tsx`) with sorting, filtering, and pagination.
- [ ] **Task 13: Refine Site Details Page**: Polish the site details page to correctly query and display link issues from the database.

### Phase 4: Payments & Subscriptions

- [ ] **Task 14: Implement Stripe Webhooks**: Build the Stripe webhook handler (`apps/web/src/app/api/webhooks/stripe/route.ts`) to manage subscription status changes and update the `users` table.
- [ ] **Task 15: Implement Pricing Page**: Create the pricing page (`apps/web/src/app/pricing/page.tsx`) with buttons that initiate a Stripe Checkout session.
- [ ] **Task 16: Gate Features by Plan**: Implement logic throughout the app to limit features based on the user's `stripe_price_id` (e.g., number of sites, pages per scan).

### Phase 5: Email & Final Polish

- [ ] **Task 17: Design Email Templates**: Create the React Email templates for the welcome email and the weekly "Revenue Leak Report" in `packages/email/src/templates/`.
- [ ] **Task 18: Implement Email Sending Logic**: In the cron job (`/api/cron/scan/route.ts`), after a scan is complete, trigger the weekly report email via the `email` package.
- [ ] **Task 19: Implement Environment Validation**: Use Zod to validate environment variables to ensure the app fails fast on misconfiguration.
- [ ] **Task 20: Write Unit & Integration Tests**: Add tests for critical parts of the application, especially the crawler and payment logic.
