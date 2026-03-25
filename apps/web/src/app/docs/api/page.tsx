import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Code2,
  Key,
  Zap,
  Webhook,
  Search,
  Link2,
  Clock,
  Terminal,
} from 'lucide-react';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Documentation — LinkRescue',
  description:
    'Complete REST API reference for LinkRescue. Check broken links, scan sites, manage webhooks. Code examples in cURL, Python, Node.js, and Go.',
  alternates: {
    canonical: 'https://www.linkrescue.io/docs/api',
  },
  openGraph: {
    title: 'API Documentation — LinkRescue',
    description:
      'REST API reference for broken link detection, affiliate parameter checking, and site scanning.',
    url: 'https://www.linkrescue.io/docs/api',
    siteName: 'LinkRescue',
    type: 'website',
  },
};

const BASE_URL = 'https://app.linkrescue.io';

function CodeBlock({ children, label }: { children: string; label?: string }) {
  return (
    <div>
      {label && (
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          {label}
        </h4>
      )}
      <pre className="bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm overflow-x-auto">
        <code className="text-slate-300">{children}</code>
      </pre>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  badge,
  badgeColor = 'green',
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  badge?: string;
  badgeColor?: 'green' | 'purple' | 'blue' | 'orange';
  children: React.ReactNode;
}) {
  const colorMap = {
    green: 'bg-green-500/20 text-green-400',
    purple: 'bg-purple-500/20 text-purple-400',
    blue: 'bg-blue-500/20 text-blue-400',
    orange: 'bg-orange-500/20 text-orange-400',
  };

  const iconColorMap = {
    green: 'text-green-400',
    purple: 'text-purple-400',
    blue: 'text-blue-400',
    orange: 'text-orange-400',
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 ${iconColorMap[badgeColor]}`} />
        <h2 className="font-display font-semibold text-lg">{title}</h2>
        {badge && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${colorMap[badgeColor]}`}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export default function PublicApiDocsPage() {
  return (
    <>
      <PublicNav />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-6 max-w-4xl space-y-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20 mb-6">
              <BookOpen className="w-3 h-3" />
              API Reference
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              API Documentation
            </h1>
            <p className="text-slate-400 mt-3 max-w-lg mx-auto">
              Integrate broken link detection into your workflow. Check links, scan sites, and receive webhooks.
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <Link href="/signup" className="btn-primary text-sm">
                Get API Key <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Base URL */}
          <div className="glass-card p-4 flex items-center gap-3">
            <Terminal className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span className="text-sm text-slate-400">Base URL:</span>
            <code className="text-sm text-green-400 font-mono">{BASE_URL}/api/v1</code>
          </div>

          {/* Authentication */}
          <SectionCard icon={Key} title="Authentication" badgeColor="green">
            <p className="text-sm text-slate-400">
              All API requests require a Bearer token. Generate API keys from your dashboard after signing up.
              API access is available on <strong className="text-slate-300">Pro ($29/mo)</strong> and{' '}
              <strong className="text-slate-300">Agency ($79/mo)</strong> plans.
            </p>
            <CodeBlock>{`Authorization: Bearer lr_your_api_key_here`}</CodeBlock>
          </SectionCard>

          {/* ─── Check Links ─── */}
          <SectionCard icon={Link2} title="Check Links" badge="Pro+" badgeColor="green">
            <p className="text-sm text-slate-400">
              Check one or more URLs for broken links, redirect chains, and affiliate parameter survival.
              Returns results synchronously (typically under 10 seconds).
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-green-500/20 text-green-400 px-2 py-1 rounded">
                  POST
                </span>
                <code className="text-sm text-slate-300">/api/v1/check-links</code>
              </div>

              <CodeBlock label="Request Body">{`// Single URL
{ "url": "https://amzn.to/abc123" }

// Batch (up to 20 URLs)
{ "urls": [
  "https://amzn.to/abc123",
  "https://example.com/old-page",
  "https://shareasale.com/r.cfm?b=12345"
] }`}</CodeBlock>

              <CodeBlock label="Response (200)">{`{
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
}`}</CodeBlock>

              <CodeBlock label="cURL">{`curl -X POST ${BASE_URL}/api/v1/check-links \\
  -H "Authorization: Bearer lr_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"urls": ["https://amzn.to/abc123", "https://example.com/old"]}'`}</CodeBlock>

              <CodeBlock label="Node.js / TypeScript">{`const res = await fetch("${BASE_URL}/api/v1/check-links", {
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
console.log(data.summary); // { broken: 0, redirects: 1, params_lost: 0 }`}</CodeBlock>

              <CodeBlock label="Python">{`import requests

resp = requests.post(
    "${BASE_URL}/api/v1/check-links",
    headers={"Authorization": "Bearer lr_your_api_key"},
    json={"urls": ["https://amzn.to/abc123"]},
)
data = resp.json()
for r in data["results"]:
    if r["status"] == "broken":
        print(f"BROKEN: {r['url']} ({r['issue']})")`}</CodeBlock>

              <CodeBlock label="Go">{`package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	body, _ := json.Marshal(map[string]any{
		"urls": []string{"https://amzn.to/abc123"},
	})
	req, _ := http.NewRequest("POST", "${BASE_URL}/api/v1/check-links", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer lr_your_api_key")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var result map[string]any
	json.NewDecoder(resp.Body).Decode(&result)
	fmt.Println(result["summary"])
}`}</CodeBlock>
            </div>
          </SectionCard>

          {/* ─── Async Site Scan ─── */}
          <SectionCard icon={Search} title="Site Scan (Async)" badge="Agency" badgeColor="purple">
            <p className="text-sm text-slate-400">
              Crawl an entire site for broken links. Returns immediately with a scan ID.
              Poll for results or use a webhook callback.
            </p>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Step 1 — Submit Scan
                </h4>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-mono bg-green-500/20 text-green-400 px-2 py-1 rounded">
                    POST
                  </span>
                  <code className="text-sm text-slate-300">/api/v1/scans</code>
                </div>
                <CodeBlock>{`{
  "url": "https://example.com",
  "webhook_url": "https://your-server.com/callback"  // optional
}`}</CodeBlock>
                <p className="text-xs text-slate-500 mt-2">
                  Response: <code className="text-green-400">202 Accepted</code>
                </p>
                <div className="mt-2">
                  <CodeBlock>{`{
  "scan_id": "a1b2c3d4-...",
  "status": "pending",
  "domain": "example.com",
  "poll_url": "${BASE_URL}/api/v1/scans/a1b2c3d4-...",
  "estimated_seconds": 120
}`}</CodeBlock>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Step 2 — Poll for Results
                </h4>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-mono bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                    GET
                  </span>
                  <code className="text-sm text-slate-300">/api/v1/scans/:scan_id</code>
                </div>
                <CodeBlock>{`// While running:
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
}`}</CodeBlock>
              </div>

              <CodeBlock label="Full cURL Example">{`# Submit scan
curl -X POST ${BASE_URL}/api/v1/scans \\
  -H "Authorization: Bearer lr_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'

# Poll for results (use scan_id from above)
curl ${BASE_URL}/api/v1/scans/SCAN_ID \\
  -H "Authorization: Bearer lr_your_api_key"`}</CodeBlock>
            </div>
          </SectionCard>

          {/* Error Codes */}
          <SectionCard icon={Zap} title="Error Responses" badgeColor="orange">
            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <code className="text-slate-400 flex-shrink-0 w-8">400</code>
                <span className="text-slate-400">Invalid request body or missing fields</span>
              </div>
              <div className="flex gap-3">
                <code className="text-red-400 flex-shrink-0 w-8">401</code>
                <span className="text-slate-400">Invalid or missing API key</span>
              </div>
              <div className="flex gap-3">
                <code className="text-red-400 flex-shrink-0 w-8">403</code>
                <span className="text-slate-400">API access not available on your plan</span>
              </div>
              <div className="flex gap-3">
                <code className="text-amber-400 flex-shrink-0 w-8">404</code>
                <span className="text-slate-400">Site or scan not found</span>
              </div>
              <div className="flex gap-3">
                <code className="text-amber-400 flex-shrink-0 w-8">409</code>
                <span className="text-slate-400">Scan already in progress for this site</span>
              </div>
              <div className="flex gap-3">
                <code className="text-amber-400 flex-shrink-0 w-8">429</code>
                <span className="text-slate-400">Rate limit exceeded — check X-RateLimit-Reset header</span>
              </div>
            </div>
          </SectionCard>

          {/* Rate Limits */}
          <SectionCard icon={Clock} title="Rate Limits" badgeColor="blue">
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
                    <th className="text-left py-3 px-3 text-slate-400 font-medium">Price</th>
                    <th className="text-right py-3 px-3 text-slate-400 font-medium">Check Links</th>
                    <th className="text-right py-3 px-3 text-slate-400 font-medium">Site Scans</th>
                    <th className="text-right py-3 px-3 text-slate-400 font-medium">Monthly Pages</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="py-3 px-3 font-medium">Pro</td>
                    <td className="py-3 px-3 text-slate-400">$29/mo</td>
                    <td className="py-3 px-3 text-right text-slate-400">100/hour</td>
                    <td className="py-3 px-3 text-right text-slate-400">2/day</td>
                    <td className="py-3 px-3 text-right text-slate-400">10,000</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-medium">Agency</td>
                    <td className="py-3 px-3 text-slate-400">$79/mo</td>
                    <td className="py-3 px-3 text-right text-slate-400">1,000/hour</td>
                    <td className="py-3 px-3 text-right text-slate-400">10/day</td>
                    <td className="py-3 px-3 text-right text-slate-400">100,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* Webhooks */}
          <SectionCard icon={Webhook} title="Webhooks" badge="Agency" badgeColor="orange">
            <p className="text-sm text-slate-400">
              Configure webhook endpoints in your dashboard to receive real-time notifications.
              Each delivery includes an HMAC-SHA256 signature for verification.
            </p>

            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Events
              </h4>
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
                  <code className="text-green-400 flex-shrink-0">guardian.rescued</code>
                  <span className="text-slate-400">Guardian link intercepted a broken redirect</span>
                </div>
                <div className="flex gap-3">
                  <code className="text-blue-400 flex-shrink-0">redirect.deployed</code>
                  <span className="text-slate-400">Redirect rule went live</span>
                </div>
              </div>
            </div>

            <CodeBlock label="Signature Verification (Node.js)">{`const crypto = require('crypto');
const signature = req.headers['x-linkrescue-signature'];
const expected = 'sha256=' + crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex');

if (signature !== expected) {
  return res.status(401).send('Invalid signature');
}`}</CodeBlock>
          </SectionCard>

          {/* CTA */}
          <div className="text-center pt-8">
            <h2 className="font-display text-xl font-bold mb-3">Ready to integrate?</h2>
            <p className="text-slate-400 text-sm mb-6">
              Sign up, generate an API key, and check your first link in 30 seconds.
            </p>
            <Link href="/signup" className="btn-primary">
              Get Your API Key <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </>
  );
}
