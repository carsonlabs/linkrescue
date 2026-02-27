# LinkRescue Monitoring & Observability Stack

## Philosophy: "Sleep Well at Night"

**Goal:** Know immediately when something breaks. Fix it before customers notice.

---

## Layer 1: Error Tracking (Sentry)

**Why:** Catch frontend crashes and API errors

**Setup:**
```bash
npm install @sentry/nextjs
```

**What to track:**
- React component crashes
- API route 500 errors
- Database connection failures
- Stripe webhook failures
- Crawler exceptions

**Alerts:**
- Critical: Email + Slack immediately
- Warning: Slack digest daily
- Info: Dashboard only

**Cost:** Free tier (5k errors/month) → $26/month (50k errors)

---

## Layer 2: Uptime Monitoring (Better Stack)

**Why:** Know when site is down before customers complain

**Checks every 60 seconds:**
- https://linkrescue.io (homepage)
- https://linkrescue.io/api/health (API health)
- https://linkrescue.io/dashboard (authenticated route)

**Alert escalation:**
1. 1 min down → Push notification
2. 5 min down → Email + SMS
3. 15 min down → Phone call (if configured)

**Cost:** Free tier (5 monitors) → $25/month (50 monitors)

---

## Layer 3: Database Monitoring (Supabase + Custom)

**Track:**
- Connection pool usage
- Slow queries (>1s)
- Failed auth attempts
- Storage usage
- Daily scan counts (business metric)

**Custom dashboard query:**
```sql
-- Daily health snapshot
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE stripe_subscription_id IS NOT NULL) as paid_users,
  (SELECT COUNT(*) FROM scans WHERE created_at > NOW() - INTERVAL '24 hours') as scans_24h,
  (SELECT COUNT(*) FROM scan_issues WHERE created_at > NOW() - INTERVAL '24 hours') as issues_found_24h
FROM users;
```

**Alerts:**
- Connection pool >80% → Scale up
- Failed scans spike → Check crawler

**Cost:** Included in Supabase (free tier sufficient)

---

## Layer 4: Log Aggregation (Vercel + Custom)

**Centralize logs from:**
- Vercel deployments
- Crawler execution logs
- Email send logs
- Stripe webhook logs

**Format:** Structured JSON
```json
{
  "timestamp": "2026-02-27T04:00:00Z",
  "level": "error",
  "service": "crawler",
  "scan_id": "uuid",
  "site_id": "uuid",
  "message": "Failed to fetch page",
  "url": "https://example.com/page",
  "error": "ECONNREFUSED"
}
```

**Tool options:**
1. **Vercel native logs** (free, 7-day retention)
2. **Logflare** (free tier, better search)
3. **Better Stack** (bundled with uptime monitoring)
4. **Self-hosted** (Plausible/Meilisearch on VPS)

**Recommendation:** Start with Better Stack (bundled), upgrade when needed.

---

## Layer 5: Business Metrics (Custom Dashboard)

**Track in Mothership or simple endpoint:**

```typescript
// /api/metrics endpoint
{
  "mrr": 0,                    // From Stripe
  "active_users": 0,           // From Supabase
  "sites_monitored": 0,        // From Supabase
  "scans_today": 0,            // From Supabase
  "broken_links_found_today": 0, // From Supabase
  "avg_scan_duration_ms": 0,   // From logs
}
```

**Display:**
- Simple JSON endpoint for now
- Later: Pretty dashboard in Mothership

---

## Implementation Priority

### Week 1 (Critical)
1. ✅ Sentry setup (catch crashes)
2. ✅ Better Stack uptime (know when down)

### Week 2 (Important)
3. Database health checks
4. Structured logging

### Week 3 (Nice to have)
5. Business metrics endpoint
6. Custom dashboard

---

## Cost Summary

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| Sentry | 5k errors | $26/mo (50k) |
| Better Stack | 5 monitors | $25/mo (50) |
| Supabase | 500MB, 2M requests | $25/mo |
| **Total** | **$0** | **~$76/mo** |

**Recommendation:** Start free. Pay when you have revenue.

---

## Alert Channels

**Critical (immediate):**
- Site down >1 min
- Database connection failures
- Stripe webhook failures

**Warning (daily digest):**
- Error rate spike
- Slow queries
- Failed scans

**Info (weekly):**
- Business metrics summary
- Growth trends

---

## Setup Commands

```bash
# Sentry
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs

# Better Stack
# Sign up, add monitors via UI

# Custom health endpoint
cat > app/api/health/route.ts << 'EOF'
export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev',
  });
}
EOF
```

---

## Success Criteria

**You'll know it's working when:**
- You get an alert within 60 seconds of site going down
- You know about errors before customers report them
- You can see business trends without logging into 5 different tools
- You sleep soundly knowing things are monitored
