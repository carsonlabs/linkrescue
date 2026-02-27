# Sentry Setup Guide

## Quick Start (5 minutes)

### Step 1: Sign up for Sentry
1. Go to https://sentry.io/signup/
2. Create account (GitHub login recommended)
3. Create new project → Select "Next.js"
4. Copy your DSN (looks like: https://xxx@xxx.ingest.sentry.io/xxx)

### Step 2: Add Environment Variables

```bash
# Add to .env.local (development)
NEXT_PUBLIC_SENTRY_DSN=your_dsn_here
SENTRY_DSN=your_dsn_here

# Add to Vercel Environment Variables (production)
# Go to Vercel Dashboard → Project Settings → Environment Variables
NEXT_PUBLIC_SENTRY_DSN=your_dsn_here
SENTRY_DSN=your_dsn_here
```

### Step 3: Test the Integration

```bash
# Start dev server
npm run dev

# Visit http://localhost:3000/api/sentry-test
# This will trigger a test error
```

### Step 4: Deploy

```bash
git add .
git commit -m "feat: add Sentry error tracking"
git push origin master
```

After deploy, visit `/api/sentry-test` on production to verify.

---

## What's Already Configured

### ✅ Client-side error tracking
- React component crashes
- JavaScript errors
- Session replay (optional)

### ✅ Server-side error tracking  
- API route errors
- Database failures
- Crawler exceptions

### ✅ Health endpoint
- `GET /api/health` → Returns 200 or 503
- Better Stack will ping this every 60 seconds
- Checks database connectivity

---

## Monitoring Checklist

### Critical Errors (Alert immediately)
- [ ] 500 errors on /dashboard/*
- [ ] Database connection failures
- [ ] Stripe webhook failures
- [ ] Crawler crashes

### Warnings (Daily digest)
- [ ] 404 spikes
- [ ] Slow API responses (>2s)
- [ ] Failed scans

---

## Better Stack Uptime Setup (Next)

### Step 1: Sign up
https://betterstack.com/ (free tier: 5 monitors)

### Step 2: Add monitors
1. **Homepage check**
   - URL: https://linkrescue.io
   - Interval: 60 seconds
   
2. **API health check**
   - URL: https://linkrescue.io/api/health
   - Interval: 60 seconds
   - Expected status: 200

3. **Dashboard check** (optional)
   - URL: https://linkrescue.io/dashboard
   - Interval: 5 minutes
   - Expected keyword: "Sites" (confirms page loaded)

### Step 3: Configure alerts
- Email: your-email@example.com
- Slack: (optional, connect webhook)
- SMS: (optional, for critical alerts)

---

## Cost

| Service | Free Tier | When to Pay |
|---------|-----------|-------------|
| Sentry | 5k errors/month | >$290 MRR |
| Better Stack | 5 monitors | Need >5 checks |

**Rule:** Don't pay until you have paying customers.

---

## Troubleshooting

**"Sentry DSN not found"**
→ Check env vars are set in Vercel dashboard

**"Health endpoint returns 503"**
→ Check Supabase connection / database status

**"Not receiving alerts"**
→ Check spam folder
→ Verify alert rules in Sentry/Better Stack dashboard

---

## Next Steps

1. ✅ Set up Sentry (you just did this)
2. ⏳ Set up Better Stack uptime monitoring
3. ⏳ Create database health dashboard
4. ⏳ Set up log aggregation

You're now sleeping soundly. 🌙
