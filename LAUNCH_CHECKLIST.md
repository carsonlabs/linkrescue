# LinkRescue Launch Checklist

## Pre-Launch Verification

### Stripe (Revenue)
- [ ] Create Stripe products in **live mode** (not test):
  - [ ] Pro Monthly: $29/mo → set `STRIPE_PRO_MONTHLY_PRICE_ID`
  - [ ] Pro Annual: $290/yr → set `STRIPE_PRO_ANNUAL_PRICE_ID`
  - [ ] Agency Monthly: $79/mo → set `STRIPE_AGENCY_MONTHLY_PRICE_ID`
  - [ ] Agency Annual: $790/yr → set `STRIPE_AGENCY_ANNUAL_PRICE_ID`
- [ ] Create Stripe webhook endpoint pointing to `https://app.linkrescue.io/api/webhooks/stripe`
  - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
  - Set `STRIPE_WEBHOOK_SECRET` from the signing secret
- [ ] Test end-to-end purchase flow (use Stripe test card, then switch to live)

### Supabase (Database)
- [ ] Run `phase3_detection_intelligence.sql` migration (adds content_hash, content_text, wayback_url columns)
- [ ] Verify RLS policies are enabled on all tables
- [ ] Verify `SUPABASE_SERVICE_ROLE_KEY` is set on Vercel

### Vercel (Hosting)
- [ ] Production deployment at linkrescue.io
- [ ] Custom domain configured and SSL active
- [ ] Environment variables set (all from `.env.example`)
- [ ] Verify cron jobs are running (check Vercel dashboard > Cron Jobs)
- [ ] `CRON_SECRET` set (random string, same in Vercel env vars)

### Sentry (Monitoring)
- [ ] Sentry project created for linkrescue
- [ ] `SENTRY_DSN` set in Vercel env vars
- [ ] Verify errors are being captured (trigger a test error)

### Email (Resend)
- [ ] `RESEND_API_KEY` set
- [ ] Sender domain verified (linkrescue.io or linkrescue.com)
- [ ] Test monthly report email renders correctly

### Rewardful (Affiliates)
- [ ] Rewardful account created
- [ ] Set `NEXT_PUBLIC_REWARDFUL_API_KEY` (tracking script)
- [ ] Set `NEXT_PUBLIC_REWARDFUL_SIGNUP_URL` (affiliate signup page)
- [ ] Commission: 30% recurring, 12 months, 90-day cookie

### Anthropic (AI)
- [ ] `ANTHROPIC_API_KEY` set for AI fix suggestions (claude-sonnet-4-6)

## Launch Day

### Content
- [ ] Seed SEO pages (run SQL inserts below or use admin UI)
- [ ] Verify `/check/amazon`, `/check/shareasale` etc. render
- [ ] Verify `/vs/ahrefs`, `/vs/screaming-frog` etc. render
- [ ] Verify `/docs/api` is accessible (no auth required)

### Distribution
- [ ] Product Hunt submission
- [ ] Hacker News Show HN post (lead with API/developer angle)
- [ ] Reddit posts: r/webdev, r/SEO, r/affiliatemarketing, r/SaaS
- [ ] Dev.to article: "How to monitor affiliate links with a simple API call"
- [ ] Submit to SaaS directories (see docs/MARKETING_PLAN.md for full list)

### Post-Launch (Week 1)
- [ ] Monitor Sentry for errors
- [ ] Monitor Stripe for successful charges
- [ ] Respond to Product Hunt comments
- [ ] Track signups in Studio CRM
- [ ] Publish npm SDK to npmjs.com (`@linkrescue/sdk`)
- [ ] Publish GitHub Action to marketplace
