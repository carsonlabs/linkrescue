# LinkRescue operating baseline — 2026-08-13

## Current safe operating state

The core web application is live and backed by a reachable database.

| Item | Status | Evidence |
| --- | --- | --- |
| Vercel project | Ready | `linkrescue-web` (`prj_ZxZMcGq5RMO0MzaAcwVDl2iZIwcQ`), root directory `apps/web`. |
| Production deployment | Ready | Deployment `dpl_4LHimAiC9GF5r1etTm5axp6acutG` is a ready production deployment. |
| Production aliases | Active | `https://www.linkrescue.io`, `https://linkrescue.io`, and Vercel aliases resolve to the ready deployment. |
| Health endpoint | Healthy | `GET https://www.linkrescue.io/api/health` returned `200` with `{ "status": "ok", "services": { "web": "ok", "database": "ok" } }` on 2026-08-13. |
| Public smoke check | Passed | `GET` returned `200` for `/`, `/signup`, `/free-scan`, `/pricing`, and `/blog` on 2026-08-13. |
| Local application URL | Corrected | `apps/web/.env.local` now targets the canonical `https://www.linkrescue.io` URL instead of the retired `link-rescue.vercel.app` hostname. |
| Type safety | Passed | `pnpm@10.28.0 --filter @linkrescue/web type-check` completed successfully. |
| Unit tests | Passed | `pnpm@10.28.0 --filter @linkrescue/web test` passed: 1 test file, 4 tests. |
| Production build | Passed | `pnpm@10.28.0 --filter @linkrescue/web build` completed successfully. |

## Deliberately not enabled

- Stripe checkout, portal, or webhooks
- Resend email delivery and test-email actions
- Vercel cron jobs or scan schedules (`apps/web/vercel.json` declares `"crons": []`)
- Scheduled scans, automated follow-ups, webhooks, or outbound integrations

## Before the first controlled acceptance run

1. Nominate a controlled mailbox for one Supabase magic-link email.
2. Nominate a controlled site and publish the per-user verification meta tag after account creation.
3. Grant a non-billing test entitlement for one manual dashboard scan, or authorize a compatible test-plan configuration.
4. Re-run the documented acceptance test and retain the generated free-scan report URL as evidence.
