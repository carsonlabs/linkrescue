import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getUserPlan, hasFeature, type TierName } from '@linkrescue/types';
import { BookOpen, Code2, Key, Zap, Webhook, Search, Link2, Clock, Radio, Wrench } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ApiDocsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('stripe_price_id')
    .eq('id', user.id)
    .single();

  const plan = getUserPlan(profile?.stripe_price_id ?? null) as TierName;
  const hasApi = hasFeature(plan, 'api_access');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.linkrescue.io';

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold">API Documentation</h1>
        <p className="text-slate-400 text-sm mt-1">
          Integrate LinkRescue into your workflow with our REST API.
        </p>
      </div>

      {!hasApi && (
        <div className="glass-card p-6 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <Key className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-300">API access requires a paid plan</h3>
              <p className="text-sm text-slate-400 mt-1">
                Upgrade to Pro for link checking, or Agency for full site scans + webhooks.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Authentication */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-green-400" />
          <h2 className="font-display font-semibold text-lg">Authentication</h2>
        </div>
        <p className="text-sm text-slate-400">
          All API requests require a Bearer token. Generate API keys from your{' '}
          <a href="/dashboard/settings" className="text-green-400 hover:underline">
            Settings page
          </a>.
        </p>
        <pre className="bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm overflow-x-auto">
          <code className="text-slate-300">{`Authorization: Bearer lr_your_api_key_here`}</code>
        </pre>
      </div>

      {/* ─── Check Links ─── */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-green-400" />
          <h2 className="font-display font-semibold text-lg">Check Links</h2>
          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
            Pro+
          </span>
        </div>
        <p className="text-sm text-slate-400">
          Check one or more URLs for broken links, redirect chains, and affiliate parameter survival.
          Returns results synchronously (typically under 10 seconds).
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-green-500/20 text-green-400 px-2 py-1 rounded">POST</span>
            <code className="text-sm text-slate-300">{baseUrl}/api/v1/check-links</code>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Request Body</h4>
            <pre className="bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm overflow-x-auto">
              <code className="text-slate-300">{`// Single URL
{ "url": "https://amzn.to/abc123" }

// Batch (up to 20 URLs)
{ "urls": [
  "https://amzn.to/abc123",
  "https://example.com/old-page",
  "https://shareasale.com/r.cfm?b=12345"
] }`}</code>
            </pre>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Response (200)</h4>
            <pre className="bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm overflow-x-auto">
              <code className="text-slate-300">{`{
  "checked": 3,
  "summary": {
    "broken": 1,
    "redirects": 1,
    "params_lost": 0
  },
  "results": [
    {
      "url": "https://amzn.to/abc123",
      "status": "redirect",
      "status_code": 301,
      "final_url": "https://amazon.com/dp/...",
      "redirect_count": 2,
      "is_affiliate": true,
      "affiliate_params_preserved": true,
      "params_lost": [],
      "issue": null
    },
    {
      "url": "https://example.com/old-page",
      "status": "broken",
      "status_code": 404,
      "final_url": "https://example.com/old-page",
      "redirect_count": 0,
      "is_affiliate": false,
      "affiliate_params_preserved": null,
      "params_lost": [],
      "issue": "HTTP 404"
    }
  ]
}`}</code>
            </pre>
          </div>

          {/* cURL example */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">cURL</h4>
            <pre className="bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm overflow-x-auto">
              <code className="text-slate-300">{`curl -X POST ${baseUrl}/api/v1/check-links \\
  -H "Authorization: Bearer lr_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"urls": ["https://amzn.to/abc123", "https://example.com/old"]}'`}</code>
            </pre>
          </div>

          {/* Node.js example */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Node.js</h4>
            <pre className="bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm overflow-x-auto">
              <code className="text-slate-300">{`const res = await fetch("${baseUrl}/api/v1/check-links", {
  method: "POST",
  headers: {
    "Authorization": "Bearer lr_your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    urls: ["https://amzn.to/abc123"]
  }),
});
const data = await res.json();
console.log(data.summary); // { broken: 0, redirects: 1, params_lost: 0 }`}</code>
            </pre>
          </div>

          {/* Python example */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Python</h4>
            <pre className="bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm overflow-x-auto">
              <code className="text-slate-300">{`import requests

resp = requests.post(
    "${baseUrl}/api/v1/check-links",
    headers={"Authorization": "Bearer lr_your_api_key"},
    json={"urls": ["https://amzn.to/abc123"]},
)
data = resp.json()
for r in data["results"]:
    if r["status"] == "broken":
        print(f"BROKEN: {r['url']} ({r['issue']})")`}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* ─── Async Site Scan ─── */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-blue-400" />
          <h2 className="font-display font-semibold text-lg">Monitoring</h2>
          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
            Agency
          </span>
        </div>
        <p className="text-sm text-slate-400">
          Create or update a recurring monitoring schedule for a site already in your account.
          The API accepts hours and normalizes them to the nearest supported cadence.
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-blue-500/20 text-blue-400 px-2 py-1 rounded">POST</span>
            <code className="text-sm text-slate-300">{baseUrl}/api/v1/monitors</code>
          </div>

          <pre className="bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm overflow-x-auto">
            <code className="text-slate-300">{`{
  "url": "https://example.com",
  "frequency_hours": 24
}`}</code>
          </pre>

          <pre className="bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm overflow-x-auto">
            <code className="text-slate-300">{`{
  "monitoring_id": "9b3c2f5a-...",
  "site_id": "2a4f8c7d-...",
  "url": "https://example.com",
  "status": "active",
  "frequency_hours": 24,
  "normalized_frequency": "daily",
  "next_scan": "2026-04-02T13:00:00.000Z"
}`}</code>
          </pre>
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-purple-400" />
          <h2 className="font-display font-semibold text-lg">Site Scan (Async)</h2>
          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
            Agency
          </span>
        </div>
        <p className="text-sm text-slate-400">
          Crawl an entire site for broken links. Returns immediately with a scan ID.
          Poll for results or use a webhook callback.
        </p>

        {/* Step 1: Submit */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Step 1 — Submit Scan</h4>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-green-500/20 text-green-400 px-2 py-1 rounded">POST</span>
            <code className="text-sm text-slate-300">{baseUrl}/api/v1/scans</code>
          </div>
          <pre className="bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm overflow-x-auto">
            <code className="text-slate-300">{`{
  "url": "https://example.com",
  "webhook_url": "https://your-server.com/callback"  // optional
}`}</code>
          </pre>
          <p className="text-xs text-slate-500">
            Response: <code className="text-green-400">202 Accepted</code>
          </p>
          <pre className="bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm overflow-x-auto">
            <code className="text-slate-300">{`{
  "scan_id": "a1b2c3d4-...",
  "status": "pending",
  "domain": "example.com",
  "poll_url": "${baseUrl}/api/v1/scans/a1b2c3d4-...",
  "estimated_seconds": 120
}`}</code>
          </pre>
        </div>

        {/* Step 2: Poll */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Step 2 — Poll for Results</h4>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-blue-500/20 text-blue-400 px-2 py-1 rounded">GET</span>
            <code className="text-sm text-slate-300">{`{baseUrl}/api/v1/scans/{scan_id}`}</code>
          </div>
          <pre className="bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm overflow-x-auto">
            <code className="text-slate-300">{`// While running:
{ "scan_id": "...", "status": "running", "pages_scanned": 24, "links_checked": 187 }

// When done:
{
  "scan_id": "...",
  "status": "completed",
  "domain": "example.com",
  "pages_scanned": 48,
  "links_checked": 523,
  "issue_count": 7,
  "issues": [
    {
      "url": "https://dead-link.com/page",
      "status_code": 404,
      "issue_type": "BROKEN_4XX",
      "is_affiliate": false
    }
  ]
}`}</code>
          </pre>
        </div>

        {/* cURL example */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full cURL Example</h4>
          <pre className="bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm overflow-x-auto">
            <code className="text-slate-300">{`# Submit scan
curl -X POST ${baseUrl}/api/v1/scans \\
  -H "Authorization: Bearer lr_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'

# Poll for results (use scan_id from above)
curl ${baseUrl}/api/v1/scans/SCAN_ID \\
  -H "Authorization: Bearer lr_your_api_key"`}</code>
          </pre>
        </div>

        {/* Error codes */}
        <div className="pt-2">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Error Responses</h4>
          <div className="space-y-2 text-sm">
            <div className="flex gap-3">
              <code className="text-red-400 flex-shrink-0">401</code>
              <span className="text-slate-400">Invalid or missing API key</span>
            </div>
            <div className="flex gap-3">
              <code className="text-red-400 flex-shrink-0">403</code>
              <span className="text-slate-400">API access not available on your plan</span>
            </div>
            <div className="flex gap-3">
              <code className="text-amber-400 flex-shrink-0">404</code>
              <span className="text-slate-400">Site not found in your account</span>
            </div>
            <div className="flex gap-3">
              <code className="text-amber-400 flex-shrink-0">409</code>
              <span className="text-slate-400">Scan already in progress</span>
            </div>
            <div className="flex gap-3">
              <code className="text-amber-400 flex-shrink-0">429</code>
              <span className="text-slate-400">Rate limit exceeded</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rate Limits */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-orange-400" />
          <h2 className="font-display font-semibold text-lg">Fix Suggestions</h2>
          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
            Agency
          </span>
        </div>
        <p className="text-sm text-slate-400">
          Turn completed scan results into remediation guidance. Pass a scan ID for product-native
          suggestions, or send a raw broken-links payload from another system.
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-orange-500/20 text-orange-400 px-2 py-1 rounded">POST</span>
            <code className="text-sm text-slate-300">{baseUrl}/api/v1/suggestions</code>
          </div>

          <pre className="bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm overflow-x-auto">
            <code className="text-slate-300">{`{
  "scan_id": "a1b2c3d4-..."
}`}</code>
          </pre>

          <pre className="bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm overflow-x-auto">
            <code className="text-slate-300">{`{
  "suggestions": [
    {
      "broken_url": "https://merchant.example/dead-offer",
      "priority": "high",
      "action": "update_affiliate_link",
      "detail": "This affiliate destination is dead. Update it to the current merchant link or replace it with a comparable offer."
    }
  ],
  "total": 1,
  "high_priority": 1
}`}</code>
          </pre>
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          <h2 className="font-display font-semibold text-lg">Rate Limits</h2>
        </div>
        <p className="text-sm text-slate-400">
          Rate limit headers are included in every response:{' '}
          <code className="text-slate-300 text-xs">X-RateLimit-Limit</code>,{' '}
          <code className="text-slate-300 text-xs">X-RateLimit-Remaining</code>,{' '}
          <code className="text-slate-300 text-xs">X-RateLimit-Reset</code>.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-3 text-slate-400 font-medium">Plan</th>
                <th className="text-right py-3 px-3 text-slate-400 font-medium">Check Links</th>
                <th className="text-right py-3 px-3 text-slate-400 font-medium">Site Scans</th>
                <th className="text-right py-3 px-3 text-slate-400 font-medium">Monthly Pages</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="py-3 px-3 font-medium">Pro</td>
                <td className="py-3 px-3 text-right text-slate-400">100/hour</td>
                <td className="py-3 px-3 text-right text-slate-400">2/day</td>
                <td className="py-3 px-3 text-right text-slate-400">10,000</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-medium">Agency</td>
                <td className="py-3 px-3 text-right text-slate-400">1,000/hour</td>
                <td className="py-3 px-3 text-right text-slate-400">10/day</td>
                <td className="py-3 px-3 text-right text-slate-400">100,000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Outbound Webhooks */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Webhook className="w-5 h-5 text-orange-400" />
          <h2 className="font-display font-semibold text-lg">Webhooks</h2>
          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
            Agency
          </span>
        </div>
        <p className="text-sm text-slate-400">
          Configure webhook endpoints in{' '}
          <a href="/dashboard/settings" className="text-green-400 hover:underline">Settings</a>{' '}
          to receive real-time notifications. Each delivery includes an HMAC-SHA256 signature.
        </p>

        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Events</h4>
          <div className="space-y-2 text-sm">
            <div className="flex gap-3">
              <code className="text-green-400 flex-shrink-0">scan.completed</code>
              <span className="text-slate-400">Scan finished successfully</span>
            </div>
            <div className="flex gap-3">
              <code className="text-red-400 flex-shrink-0">scan.failed</code>
              <span className="text-slate-400">Scan encountered a fatal error</span>
            </div>
            <div className="flex gap-3">
              <code className="text-red-400 flex-shrink-0">link.broken</code>
              <span className="text-slate-400">New broken link detected</span>
            </div>
            <div className="flex gap-3">
              <code className="text-green-400 flex-shrink-0">link.fixed</code>
              <span className="text-slate-400">Previously broken link recovered</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Signature Verification</h4>
          <pre className="bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm overflow-x-auto">
            <code className="text-slate-300">{`const crypto = require('crypto');
const signature = req.headers['x-linkrescue-signature'];
const expected = 'sha256=' + crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex');

if (signature !== expected) {
  return res.status(401).send('Invalid signature');
}`}</code>
          </pre>
        </div>
      </div>

      {/* Quick Start */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-slate-400" />
          <h2 className="font-display font-semibold text-lg">Quick Start</h2>
        </div>
        <p className="text-sm text-slate-400">
          Check your first link in 30 seconds:
        </p>
        <pre className="bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm overflow-x-auto">
          <code className="text-slate-300">{`curl -X POST ${baseUrl}/api/v1/check-links \\
  -H "Authorization: Bearer lr_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://amzn.to/abc123"}'`}</code>
        </pre>
      </div>
    </div>
  );
}
