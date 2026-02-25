# LinkRescue Code Audit Report

## ✅ What's Working Well

### Architecture
- **Clean monorepo structure** with Turborepo
- **Good separation of concerns** between packages (crawler, database, email, ai, types)
- **Proper TypeScript types** throughout
- **RLS policies** in place for security

### API Routes
- Consistent error handling with proper HTTP status codes
- Authentication checks on all protected routes
- Input validation using Zod schemas
- Rate limiting considerations (maxDuration set on cron)

### Security
- No secrets in code
- Row Level Security (RLS) enabled on all tables
- Stripe webhook signature verification
- Supabase auth properly integrated

---

## ⚠️ Issues Found

### 1. **Missing Error Handling in Crawler**
**File:** `packages/crawler/src/index.ts`

The crawler has a bare `try/catch` that silently ignores errors:
```typescript
for (const result of brokenResults) {
  try {
    const analysis = await analyzeDeadLink(link.href);
    // ...
  } catch {
    // Skip individual failures, continue processing
  }
}
```

**Impact:** AI analysis failures are silently ignored. Users won't know if matching failed.

**Fix:** At minimum log the error:
```typescript
} catch (err) {
  console.error(`AI analysis failed for ${link.href}:`, err);
  // Continue processing
}
```

### 2. **No Retry Logic for External Requests**
**Files:** 
- `packages/crawler/src/link-checker.ts`
- `packages/crawler/src/index.ts`

Link checking and page fetching can fail due to transient network issues.

**Fix:** Add simple retry logic:
```typescript
async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, { ... });
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1))); // Exponential backoff
    }
  }
  throw new Error('Max retries reached');
}
```

### 3. **Email Sending Failures Not Handled Gracefully**
**File:** `apps/web/src/app/api/cron/scan/route.ts`

Email sending errors are caught and logged but don't affect the scan result:
```typescript
try {
  await sendWeeklyDigest({ ... });
} catch (emailErr) {
  console.error(`Failed to send digest for ${site.domain}:`, emailErr);
}
```

**Impact:** Users might not get email notifications and won't know scans completed.

**Fix:** Consider adding a "notifications_failed" flag to scans table.

### 4. **Scan Status Not Updated on Failure**
**File:** `packages/crawler/src/index.ts`

If `runScan` throws an error, the scan status stays as 'running' instead of 'failed'.

**Fix:** Wrap in try/finally:
```typescript
let scan;
try {
  scan = await createScanRecord();
  await performScan();
  await updateScanStatus(scan.id, 'completed');
} catch (err) {
  if (scan) await updateScanStatus(scan.id, 'failed', err.message);
  throw err;
}
```

### 5. **Hardcoded Email From Address**
**File:** `packages/email/src/send.ts`

```typescript
from: 'LinkRescue <noreply@linkrescue.com>',
```

This domain needs to be verified in Resend. If not verified, emails will fail.

**Fix:** Make this an env var:
```typescript
from: process.env.RESEND_FROM_EMAIL || 'LinkRescue <noreply@linkrescue.com>',
```

### 6. **No Input Sanitization on Domain Names**
**File:** `apps/web/src/app/api/sites/route.ts`

While Zod strips http/https, it doesn't handle:
- Path traversal attempts (`../../../etc/passwd`)
- Newline injection
- Extremely long domains

**Fix:** Add additional validation:
```typescript
const createSiteSchema = z.object({
  domain: z.string()
    .min(1)
    .max(253) // Max DNS length
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/) // Basic domain regex
    .transform((d) => d.replace(/^https?:\/\//, '').replace(/\/+$/, '').toLowerCase()),
});
```

### 7. **Missing Database Indexes**
The SQL setup doesn't include indexes. Common queries will be slow at scale:

**Add these indexes:**
```sql
-- For user lookups
CREATE INDEX idx_sites_user_id ON sites(user_id);
CREATE INDEX idx_scans_site_id ON scans(site_id);
CREATE INDEX idx_scan_results_scan_id ON scan_results(scan_id);
CREATE INDEX idx_pages_site_id ON pages(site_id);
CREATE INDEX idx_links_page_id ON links(page_id);

-- For filtering
CREATE INDEX idx_sites_verified_at ON sites(verified_at) WHERE verified_at IS NOT NULL;
CREATE INDEX idx_scans_status ON scans(status);
CREATE INDEX idx_scan_results_issue_type ON scan_results(issue_type) WHERE issue_type != 'OK';
```

### 8. **No Rate Limiting on API Routes**
Users could abuse:
- `/api/sites` (create unlimited sites)
- `/api/sites/[id]/scan` (trigger unlimited scans)
- `/api/scans/[id]/analyze` (run expensive AI analysis)

**Fix:** Add rate limiting middleware or Vercel Edge Config.

### 9. **Stripe Webhook Missing Idempotency Check**
**File:** `apps/web/src/app/api/webhooks/stripe/route.ts`

If Stripe retries a webhook, the handler will process it multiple times.

**Fix:** Track processed event IDs:
```typescript
const { data: existing } = await supabase
  .from('stripe_events')
  .select('id')
  .eq('stripe_event_id', event.id)
  .single();

if (existing) return NextResponse.json({ received: true, idempotent: true });

await supabase.from('stripe_events').insert({ stripe_event_id: event.id });
```

### 10. **Pages Table Not in Setup Guide**
The setup guide mentions `pages`, `links`, `scan_results` tables but doesn't create them.

**Missing SQL:**
```sql
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  last_fetched_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(site_id, url)
);

CREATE TABLE IF NOT EXISTS links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  href TEXT NOT NULL,
  is_affiliate BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scan_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  link_id UUID REFERENCES links(id) ON DELETE CASCADE,
  issue_type TEXT CHECK (issue_type IN ('OK', 'BROKEN', 'TIMEOUT', 'REDIRECT', 'LOST_PARAMS')),
  status_code INTEGER,
  final_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_result_id UUID REFERENCES scan_results(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
  match_score INTEGER,
  match_reason TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🎯 Recommendations (Priority Order)

### High Priority (Fix Before Launch)
1. ✅ Add missing tables to setup SQL (pages, links, scan_results, matches)
2. ✅ Add database indexes for performance
3. ✅ Fix scan status not updating on failure
4. ✅ Verify Resend domain or make from-email configurable

### Medium Priority (Fix After Launch)
5. Add retry logic for external requests
6. Add rate limiting to API routes
7. Improve error logging in crawler
8. Add Stripe webhook idempotency

### Low Priority (Nice to Have)
9. Add stricter domain validation
10. Track email delivery failures
11. Add more comprehensive logging

---

## 📋 Pre-Launch Checklist

- [ ] Run the complete SQL setup in Supabase
- [ ] Add all environment variables to Vercel
- [ ] Verify Resend domain (or use a verified domain)
- [ ] Set up Stripe webhook endpoint in Stripe dashboard
- [ ] Test signup → verify site → run scan flow
- [ ] Test Stripe checkout (use test mode)
- [ ] Verify email notifications arrive
- [ ] Run test-supabase.js script
- [ ] Load test with a large site (500+ pages)

---

## 🔍 Testing Commands

```bash
# Test Supabase connection
node scripts/test-supabase.js

# Build locally to catch TypeScript errors
pnpm build

# Test cron job locally (requires Vercel CLI)
vercel dev

# Then visit: http://localhost:3000/api/cron/scan
```
