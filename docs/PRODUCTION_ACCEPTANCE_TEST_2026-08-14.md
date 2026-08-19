# Controlled production acceptance test — 2026-08-14

## Outcome

The controlled production acceptance test completed. The production health endpoint is healthy on deployment `dpl_4yBUUPxbAHSn3bJW4E1qUyw4h8cN` (`web: ok`, `database: ok`).

## Safety controls observed

- No Stripe checkout, portal, webhook, customer, subscription, or API operation was opened.
- No Resend endpoint or application email action was invoked.
- Two Supabase Auth messages were sent only to the owner-approved personal Gmail inbox: the original sign-up confirmation and one corrected sign-in link.
- No scheduled scan was configured or invoked. The verified test site has zero `scan_schedules` records.
- The only scanned host was the controlled Vercel acceptance site: `https://linkrescue-acceptance-control.vercel.app`.
- The test account's temporary non-billing entitlement was removed after the scan; it is back on the free plan.

## Acceptance results

| Step | Status | Evidence |
| --- | --- | --- |
| Magic-link signup and sign-in | Passed after configuration correction | The initial sign-up email redirected to `localhost:3000`; the owner corrected Supabase Auth URL Configuration. A fresh sign-in link then targeted `https://www.linkrescue.io/api/auth/callback` and completed into the LinkRescue dashboard. |
| Controlled test host | Passed | The dedicated Vercel host returned HTTP 200 at `/` and HTTP 404 at `/acceptance-controlled-404`. Its only test link is same-origin. |
| Test-site verification | Passed | LinkRescue issued a user-specific verification meta tag; it was published to the controlled homepage and the dashboard marked the site **Verified**. |
| One dashboard scan | Passed | One manual scan record completed with `trigger_source: manual`, 1 fetched page, 2 discovered URLs, 0 outbound links checked, no error, and dashboard health score 80. The deliberate same-origin 404 was discovered as an internal page; this scanner reports outbound links only. |
| Free-scan report | Passed | The no-email free scan completed with 2 pages scanned, 0 outbound links checked, 0 broken links, and 0 broken affiliate links. The optional email-unlock action was not used. |

## Production hardening performed

The manual-scan request first created its pending record at 13:51 UTC and the worker claimed it at 13:56 UTC. It ultimately completed successfully, but the dispatch code used an unawaited self-fetch and gave no lifecycle guarantee.

The deployed repair in `apps/web/src/lib/scan-dispatch.ts` now:

1. Uses Vercel `waitUntil()` to keep the internal worker dispatch alive after the API response.
2. Safely re-dispatches an existing pending scan through the worker's atomic claim, without creating a duplicate scan.
3. Logs a non-success worker response instead of silently ignoring it.

The non-secret Vercel production `NEXT_PUBLIC_APP_URL` is explicitly set to `https://www.linkrescue.io`. Type checking and all four existing unit tests passed; Vercel's full production build completed successfully. No second scan was run after the repair, preserving the requested one-scan scope.

## Follow-up

Keep the Vercel acceptance host for repeat controlled tests. It has no schedule, no custom domain, no third-party links, and can be reused by publishing the next per-user verification tag.
