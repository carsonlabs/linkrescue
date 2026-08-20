# LinkRescue — Development Guide

**Last reconciled:** 2026-08-19. This file previously described a three-tier self-serve SaaS
build-out. That plan is superseded — see [Superseded plan](#superseded-plan--do-not-build-from-this)
before acting on any older instruction you find in this repo.

## What LinkRescue is now

A **service-led affiliate revenue recovery desk**. Humans do the audit; the software is the
instrument, not the product. Owner: Carson (solo founder, micro-SaaS studio).

The delivery ladder, as reflected on the live `/pricing` page:

| Offer | Price | What it is |
|---|---|---|
| **Free Leak Snapshot** | $0 | Limited, browser-based review of publicly reachable pages. Evidence only. |
| **Recovery Sprint** | $499 one-time | Human-led archive audit, prioritised repair map, replacement research. |
| **Monitoring Desk** | $149/mo per site | Recurring checks, human-reviewed issue queue, monthly action summary. |
| **Agency Revenue Desk** | $499/mo, up to 5 sites | Recurring monitoring with a client-ready report. Founder pricing — test it. |

Nothing is self-serve. Checkout is intentionally off. Every engagement starts with a snapshot and
a human readiness review.

### The wedge: dropped attribution, not broken links

From our own June 2026 study, **569 of 597 affiliate issues were `LOST_PARAMS`** — a redirect
strips the tracking parameter and the link still returns HTTP 200. The page loads, the reader buys,
and the click is attributed to nobody. Broken-link checkers pass it. So does clicking it yourself.

Broken links are a commodity category owned by free tools. The silent attribution drop is not.
Position new work on the tag drop.

## Hard rules

These are not style preferences. They are the operating constraints of the product.

1. **Never estimate or claim revenue.** No dollar loss, no revenue recovered, no ROI, no
   "commissions protected" figure — not in public copy, not in the dashboard, not in email, not in
   a report. See `docs/CLAIM_SAFETY_AUDIT_2026-08.md`. A claim about a customer's income needs a
   dated customer record, the underlying calculation, and written permission to publish. None
   exists yet.
2. **The only approved evidence is the June study**, with its stated limitations intact:
   > On June 11, 2026, LinkRescue scanned 50 well-known affiliate sites: 683 pages and 6,550
   > outbound links checked within the crawl budget. 5.8% of checked links were visibly broken.
   > Attribution failures affected 597 links, or 9.1% of checked links.

   Never expand this into a dollar figure or a universal incidence claim. It is a research sample,
   not a customer-outcome study.
3. **No testimonials or case studies** until a real customer has bought, received the work, and
   approved the exact wording in writing. `content/blog/case-study-revenue-recovery.md` is a
   fabricated draft — internal example only, never publish, never import to a CMS.
4. **Outward-facing actions need Carson's explicit go**: posting, sending email, contacting anyone,
   `git push`, production deploys, enabling billing.
5. **Deliberately disabled — leave off** unless separately approved, each on its own gate:
   Stripe checkout/billing, visitor-facing email, scheduled scans (`apps/web/vercel.json` declares
   an empty `crons` array on purpose), and the legacy seed/import scripts.
   `scripts/GO-LIVE-PASTE-2026-07-02.sql` and `scripts/insert-agency-posts.sql` would revive the
   fabricated case study — do not run them.
6. **`LEAD_NOTIFICATION_ENABLED`** gates the internal owner alert on a new lead. It is the only
   email path that is on. It notifies Carson; it never emails the visitor.

## Stack and architecture

pnpm + Turborepo monorepo, `packageManager: pnpm@10.33.1`.

- **`apps/web`** — Next.js App Router. Public marketing site, free-scan flow, owner-authenticated
  dashboard, and API routes. Deployed to Vercel at `https://www.linkrescue.io`.
- **`packages/`** — `ai`, `cli`, `config`, `crawler`, `database`, `email`, `github-action`,
  `governance`, `sdk`, `types`.
- **Database** — Supabase project `jjbyctthsxfivwvkkmfq`, running the **safe core schema** only
  (`scripts/SAFE-RECOVERY-PASTE-2026-08.sql`). The historical SEO, scoreboard, and money-modelled
  views were deliberately excluded. Code that queries them must treat a missing relation
  (PostgreSQL `42P01` / PostgREST `PGRST205`) as a zero-state — there are regression tests for this.
- **Observability** — Sentry via the Next.js instrumentation entry points. CI runs on `master`:
  frozen install, lint, all workspace type checks, SDK + GitHub Action builds, tests.

### Commands

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm build
pnpm lint
pnpm type-check
pnpm test
```

Verification bar before proposing any release: lint clean, all workspace type checks pass, full
test suite passes, `git diff --check` passes, and a production web build completes.

## Superseded plan — do not build from this

The former Phase 0–6 plan (self-serve pricing restructure, anti-churn engine, on-demand scanning,
API/webhook tiers, affiliate program, programmatic SEO) was executed against a self-serve SaaS
model the product has since left. Its code is still in the tree. Treat it as legacy surface area,
not as a specification.

Specifically retired:

- **Three-tier self-serve pricing as the live model.** `packages/types/src/tiers.ts` still exports
  `TIER_LIMITS` with free / pro $29 / agency $79 and a `hasFeature()` helper. Note it lives in
  `packages/types`, not the `lib/config/tiers.ts` path the old doc named. It still drives internal
  quota and gating logic, so **do not delete it** — but it is not the pricing model. `/pricing`
  sells the service ladder above. Don't reconcile the public page to this config; reconcile new
  work to the page.
- **The `revenue_estimates` feature flag** and everything downstream of it. Retired by rule 1.
- **"Estimated revenue protected" in the monthly email** (old Phase 2.2). Retired.
- **The "revenue saved" dashboard stat card** (old Phase 2.3). Retired.
- **Programmatic SEO route templates** (old Phase 6.2) — `/check/[network]`, `/vs/[competitor]`,
  `/guides/[slug]`, `/rescue/[slug]`. These are built and shipping, so leave them running, but the
  studio concluded programmatic SEO is structurally declining (see the StackPick decision in
  `C:\DEV\_ai_context\BOARD.md`). **Do not extend this surface or plan growth on it.**

## Known dormant claim surfaces

Audited 2026-08-19. These survived the claim-safety pass because they sit behind auth or a dead
schema object. They are not public, but they are live code — read this before touching the
dashboard, the scoreboard, or the email package.

- `apps/web/src/components/dashboard/scan-synthesis-card.tsx` — **renders a hardcoded dollar
  estimate** ("Est. revenue at risk: ~$X/mo") from a fixed $1,440/mo assumption and a
  5%-per-broken-link factor, on the live site-detail page. No visitor input. This is the same
  pattern that was deleted from the free-scan flow. Highest-priority cleanup.
- `apps/web/src/components/dashboard/scoreboard-hero.tsx` — hero "commissions protected" dollar
  figure. Dormant only because `user_scoreboard` is absent from the safe core schema, so it falls to
  its empty state.
- `apps/web/src/app/api/public/stats/route.ts` — public endpoint still shaped with
  `total_revenue_protected_cents`. Hardcoded to `0`; `network_stats_public` is absent from the schema.
- `apps/web/src/app/api/cron/monthly-report/route.ts` — gated on `hasFeature(plan, 'revenue_estimates')`.
  Unreachable while `crons` is empty and `CRON_SECRET` is required.
- `apps/web/src/app/affiliate-link-revenue-calculator/` + `src/components/RevenueCalculator.tsx` —
  visitor-slider calculator. The audit permitted estimates built from the visitor's own assumptions,
  but this one bakes in an uncited 20% "industry" attribution-strip rate. Treat as unresolved.
- `apps/web/src/components/dashboard/revenue-calculator.tsx` and `src/components/CalculatorTeaser.tsx`
  are dead code — nothing renders them.

## Implementation rules

1. Don't break existing functionality. Test after each change.
2. Match existing patterns and code style.
3. Central config over hardcoded values.
4. Proper SQL migration files for new tables — and check the live schema before writing DDL; the
   migration history table is not a reliable record of what was applied.
5. Full TypeScript types, no `any`.
6. Error handling on every API route.
7. Loading and empty states on every new data-fetching UI.
8. Mobile responsive; check at 375px.
9. Small, reviewable commits with an exact stated path scope.

## Where the real record lives

- **Operating history and current state:** `C:\DEV\_ai_context\tasks\linkrescue-international-launch-2026-08.md`
  — the authoritative log. Read it before planning anything.
- **Claim rules:** `docs/CLAIM_SAFETY_AUDIT_2026-08.md`
- **GTM strategy:** `docs/RECOVERY_DESK_BLUEPRINT_2026-08.html` — competitive map, ICPs, Sprint
  delivery framework.
- **Acceptance evidence:** `docs/PRODUCTION_ACCEPTANCE_TEST_2026-08-14.md`
- **Distribution copy:** `docs/FIRST_WEEK_DISTRIBUTION_KIT.md`
- **Studio board:** `C:\DEV\_ai_context\BOARD.md`

### Open items

1. One unfired action: a single organic LinkedIn post from Carson's profile. Needs his explicit go.
   Rewrite the hook around the tag-drop finding first.
2. Publish the June study as a public methodology page — currently it only lives in a JSON file.
3. Build the 10-minute qualification pre-check before selling any Sprint. The June crawl gate was
   68%; an unqualified site breaks the 2.5h Sprint budget.

## Agent Learning

If you discover something non-obvious while working in this project:
1. **Update this file** — add the finding to the relevant section above (architecture, commands, gotchas)
2. **Append to `C:\DEV\studio\AGENT_KNOWLEDGE.md`** — add an entry under this project's section with date and context
3. **If a documented behavior is wrong** — fix it here and mark the old AGENT_KNOWLEDGE.md entry as `[RESOLVED]`

The goal: every agent session leaves better documentation for the next one.
