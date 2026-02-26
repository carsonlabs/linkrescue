# Email Alert System Setup

## Overview

LinkRescue now has two types of email alerts:

1. **Immediate Alerts** - Sent when a scan finds broken affiliate links
2. **Weekly Digests** - Sent weekly summarizing all issues

## Environment Variables

Add these to your `.env` file:

```bash
# Required for sending emails
RESEND_API_KEY=re_your_api_key_here

# Required for weekly digest cron
CRON_SECRET=your_random_secret_here
NEXT_PUBLIC_APP_URL=https://linkrescue.io
```

## Setup Resend

1. Sign up at [resend.com](https://resend.com)
2. Add your domain (linkrescue.io)
3. Verify the domain
4. Get your API key

## Setting Up Weekly Digests

### Option 1: Vercel Cron (Recommended)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-digest",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

This sends every Monday at 9 AM.

### Option 2: GitHub Actions

Create `.github/workflows/weekly-digest.yml`:

```yaml
name: Weekly Digest
on:
  schedule:
    - cron: '0 9 * * 1'  # Monday at 9 AM UTC
jobs:
  send-digest:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger weekly digest
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://linkrescue.io/api/cron/weekly-digest
```

### Option 3: Manual Trigger

```bash
curl -X POST \
  -H "Authorization: Bearer your_cron_secret" \
  https://linkrescue.io/api/cron/weekly-digest
```

## How It Works

### Immediate Alerts

1. Scan completes
2. System checks for broken affiliate links
3. If found, calculates estimated revenue loss
4. Sends email: "🚨 3 broken links detected, $450/month at risk"
5. Email includes link to fix issues

### Weekly Digests

1. Runs weekly (configurable)
2. For each user with verified sites:
   - Gets latest scan results
   - Formats issues list
   - Sends summary email
3. Email shows all issues + revenue impact

## Email Templates

Templates are in `packages/email/src/templates/`:

- `immediate-alert.tsx` - Urgent alerts for broken links
- `revenue-leak-report.tsx` - Weekly digest
- `welcome.tsx` - New user welcome

## Testing

### Test Immediate Alert

Trigger a scan on a site with broken links. Check Resend dashboard for sent emails.

### Test Weekly Digest

```bash
curl -X POST \
  -H "Authorization: Bearer your_cron_secret" \
  http://localhost:3000/api/cron/weekly-digest
```

## Troubleshooting

**Emails not sending?**
- Check RESEND_API_KEY is set
- Check domain is verified in Resend
- Check scan_results table has broken links

**Weekly digest not running?**
- Verify CRON_SECRET matches
- Check Vercel/GitHub Actions logs
- Test endpoint manually

**Wrong revenue estimates?**
- Adjust constants in `trigger-alert.ts`:
  - `avgClicksPerLink` (default: 100)
  - `avgConversionRate` (default: 0.03 = 3%)
  - `avgCommission` (default: $15)
