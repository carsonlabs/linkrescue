# Controlled production acceptance test — 2026-08-14

## Scope and safety controls

Requested flow: magic-link signup, site verification, one dashboard scan, and a public free-scan report.

Controls observed:

- No Stripe page, checkout endpoint, webhook, customer portal, or billing API was opened.
- No Resend-powered endpoint, test-email action, lead-unlock email capture, or other application email was invoked.
- One Supabase Auth magic-link email was sent only to the owner-approved controlled inbox. This is the requested signup step, not a Resend send.
- No cron or schedule endpoint was invoked or configured. The checked-in `apps/web/vercel.json` declares an empty `crons` array.
- No third-party target was scanned. The controlled target was the Vercel-hosted acceptance site at `https://linkrescue-acceptance-control.vercel.app`; its only intentional broken target is same-origin.

## Results

| Step | Status | Evidence |
| --- | --- | --- |
| Production entry point | Passed | `https://www.linkrescue.io` and the production health endpoint were previously verified. The local `NEXT_PUBLIC_APP_URL` uses that canonical production URL. |
| Controlled test host | Passed | A dedicated Vercel project now hosts `https://linkrescue-acceptance-control.vercel.app`. Direct verification returned HTTP 200 for `/` and HTTP 404 for `/acceptance-controlled-404`; the homepage contains the intentional-404 marker. |
| Magic-link signup | Failed — production configuration blocker | The production signup page accepted the controlled personal Gmail address and Supabase Auth delivered the confirmation email. The email link contained `redirect_to=http://localhost:3000`, although the client requests `https://www.linkrescue.io/api/auth/callback`. Following the link sent its one-time authorization code to a different local application at `localhost:3000`, not LinkRescue. No code value is recorded here. |
| Test-site verification | Blocked | It needs a LinkRescue-authenticated browser session to create the site and issue the per-user `linkrescue-site-verification` meta token. The magic-link redirect defect prevents that session. |
| One dashboard scan | Blocked | It depends on a signed-in, verified site. The on-demand scan route also rejects free accounts with `403` / `On-demand scanning requires a paid plan`; a non-billing test entitlement must be applied only after authentication succeeds. No Stripe action was attempted. |
| Free-scan report | Passed | The public no-email form scanned the controlled site: **2 pages scanned, 0 outbound links checked, 0 broken links, 0 broken affiliate links**. The intentional 404 was same-origin, so this outbound-link snapshot correctly did not count it. No optional email-unlock action was used. |

## Blocker remediation

An owner with Supabase dashboard access must update **Authentication → URL Configuration** for project `jjbyctthsxfivwvkkmfq`:

1. Set **Site URL** to `https://www.linkrescue.io`.
2. Add the exact **Redirect URL** `https://www.linkrescue.io/api/auth/callback`.
3. Save, then request a fresh magic link and confirm that it opens the LinkRescue callback rather than `localhost:3000`.

After that correction, resume with the existing controlled Vercel host: add the newly issued verification meta tag, verify it, apply a non-billing test entitlement to the controlled test user, run exactly one dashboard scan, and record the report. Keep scheduled scans disabled.

## Safety-relevant implementation checks

- The checked-in cron declaration is disabled: `apps/web/vercel.json` contains `"crons": []`.
- Signup uses Supabase `signInWithOtp`, not the app's Resend package: `apps/web/src/components/auth/signup-form.tsx`.
- The signup component constructs the desired callback from `window.location.origin` and `/api/auth/callback`; the failure is the production Supabase URL configuration, not that source expression.
- Site verification fetches the site homepage and checks for the issued `linkrescue-site-verification` meta tag: `apps/web/src/app/api/sites/[id]/verify/route.ts`.
- The public free-scan UI submits no email initially. Its optional post-result email unlock was not used.
