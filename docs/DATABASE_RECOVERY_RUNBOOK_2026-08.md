# LinkRescue database recovery runbook

**Purpose:** restore a clean LinkRescue Supabase database without replaying unsafe legacy content or inventing financial outcomes.
**State:** prepared locally on 2026-08-12; not executed against any cloud project.
**Owner approval required:** project creation, running schema SQL, setting Vercel environment variables, any deployment, payment configuration, and email configuration.

## What is known

- The original LinkRescue Supabase database was deleted during the July teardown.
- The codebase has a complete core schema, but two required base tables live in `migrations/` rather than the numbered package sequence.
- Some historical seed/import scripts contain unsupported customer, revenue, ROI, or competitor claims. They are deliberately excluded below.

## Recovery principles

1. Start with a **new**, empty Supabase project. Do not point this process at any surviving database.
2. Apply schema only; do not import old user, lead, payment, or email data.
3. Use the **core schema list** below, exactly in order. Record each successful file in the project change log.
4. Do not load marketing/SEO seed scripts until individual items pass the claim-safety review.
5. Store credentials only in Supabase/Vercel settings; never commit them or paste them into this repository.

## Core schema order

Run each file in the Supabase SQL editor or an authenticated migration tool, in this order:

1. `packages/database/migrations/001_initial_schema.sql`
2. `packages/database/migrations/002_feature_expansion.sql`
3. `packages/database/migrations/003_health_scores_and_trends.sql`
4. `packages/database/migrations/003_seed_affiliate_programs.sql`
5. `packages/database/migrations/004_api_webhooks_slack.sql`
6. `packages/database/migrations/005_seo_pages.sql`
7. `packages/database/migrations/006_hardening.sql`
8. `packages/database/migrations/008_email_sequence_log.sql`
9. `packages/database/migrations/009_phase2_production_readiness.sql`
10. `packages/database/migrations/010_phase3_scale_readiness.sql`
11. `migrations/free_scan_leads.sql`
12. `packages/database/migrations/011_free_scan_leads.sql`
13. `packages/database/migrations/012_free_scan_results.sql`
14. `packages/database/migrations/013_free_scan_results_tighten_rls.sql`
15. `packages/database/migrations/015_issue_type_enum_additions.sql`
16. `packages/database/migrations/016_blog_posts_cms.sql`
17. `packages/database/migrations/017_funnel_counts_rpc.sql`

### Deliberately excluded

| File                                                              | Reason                                                                                                                             |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `packages/database/migrations/007_seed_seo_pages.sql`             | Historical marketing copy requires claim review before it can be public again.                                                     |
| `packages/database/migrations/014_seed_seo_pages_competitors.sql` | Historical competitor and revenue-impact assertions require review.                                                                |
| `migrations/calculator_leads.sql`                                 | The legacy calculator stores generated loss figures; do not restore until the calculator is redesigned as customer-input planning. |
| `migrations/scoreboard_value_engine.sql`                          | It labels modelled estimates as revenue protected. The public counter now fails soft if this view is absent.                       |
| `scripts/*.sql` that publish content                              | Several reference the fabricated David case study; see `CLAIM_SAFETY_AUDIT_2026-08.md`.                                            |

## Vercel environment inventory

Set these first, for **Production and Preview** only after the schema is confirmed:

| Required for safe core flow     | Source                                         |
| ------------------------------- | ---------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | New Supabase project API settings              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | New Supabase project API settings              |
| `SUPABASE_SERVICE_ROLE_KEY`     | New Supabase project API settings; server-only |
| `NEXT_PUBLIC_APP_URL`           | `https://www.linkrescue.io`                    |
| `CRON_SECRET`                   | New high-entropy secret; server-only           |
| `REVALIDATE_SECRET`             | New high-entropy secret; server-only           |

Do **not** set Stripe, Resend, Anthropic, browser-fetch, Rewardful, PostHog, or curator keys until their corresponding feature is intentionally enabled and tested. This prevents an infrastructure restore from creating charges, emails, or autonomous jobs.

## Minimum acceptance test

Perform using a test mailbox and a domain Carson owns or has explicit written authority to scan:

1. Supabase email sign-in returns a magic-link email to the test mailbox.
2. Opening the link creates exactly one `public.users` row via `handle_new_user`.
3. The test user adds and verifies a site.
4. One scan completes, writes pages/links/scan results, and shows a report.
5. A free scan writes only observed counts and link evidence—no dollar-loss field or revenue claim.
6. A shareable result URL works server-side but a direct anonymous REST read of `free_scan_results` is denied.
7. Cron endpoints reject a request without `CRON_SECRET`.
8. Stripe checkout/webhook, Resend email, and scheduled production scans remain disabled for this test.

## Handoff when cloud access is available

1. Sign in to the existing Vercel account on this machine (or connect the Vercel plugin) and confirm project `prj_ZxZMcGq5RMO0MzaAcwVDl2iZIwcQ` is LinkRescue.
2. Sign in to Supabase and create a new empty project in the intended region.
3. Give Codex access to the authenticated session—not a copied service-role secret in chat.
4. Run the core schema list and complete the acceptance test.
5. Review the local claim-safety patch, then explicitly authorise deployment.

Until this checklist completes, do not promote the free scan, accept payment, or enable any LinkRescue automation.
