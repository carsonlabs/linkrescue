import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getUserPlan, PLAN_LIMITS } from '@linkrescue/types';
import { 
  ArrowLeft, 
  Code, 
  Key, 
  Globe, 
  Search, 
  Play, 
  Link as LinkIcon,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ApiDocsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let plan = 'free';
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('stripe_price_id')
      .eq('id', user.id)
      .single();
    plan = getUserPlan(profile?.stripe_price_id ?? null);
  }

  const readLimit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS].apiReadRequestsPerHour;
  const scanLimit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS].apiScanRequestsPerDay;
  const hasApiAccess = readLimit > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center">
                <LinkIcon className="w-4 h-4 text-slate-900" />
              </div>
              <span className="font-display font-bold text-lg">LinkRescue</span>
            </Link>
            <span className="text-slate-400">/</span>
            <span className="font-medium">API Documentation</span>
          </div>
          {user ? (
            <Link href="/sites" className="text-sm text-slate-400 hover:text-white transition-colors">
              Dashboard →
            </Link>
          ) : (
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">
              Sign in →
            </Link>
          )}
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-sm text-green-400 bg-green-400/10 px-3 py-1 rounded-full mb-6">
              <Zap className="w-4 h-4" />
              <span>REST API v1</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              LinkRescue API
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Programmatically manage your sites, trigger scans, and retrieve broken link data. 
              Built for automation and integration.
            </p>
            {!hasApiAccess && (
              <div className="mt-6">
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  Upgrade for API Access
                </Link>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-16">
            <div className="border rounded-xl p-5 bg-card">
              <Clock className="w-5 h-5 text-green-400 mb-3" />
              <div className="text-2xl font-bold">{readLimit}</div>
              <div className="text-sm text-slate-400">Read requests / hour</div>
            </div>
            <div className="border rounded-xl p-5 bg-card">
              <Play className="w-5 h-5 text-amber-400 mb-3" />
              <div className="text-2xl font-bold">{scanLimit}</div>
              <div className="text-sm text-slate-400">Scan requests / day</div>
            </div>
            <div className="border rounded-xl p-5 bg-card">
              <Globe className="w-5 h-5 text-blue-400 mb-3" />
              <div className="text-2xl font-bold">5</div>
              <div className="text-sm text-slate-400">API endpoints</div>
            </div>
            <div className="border rounded-xl p-5 bg-card">
              <Code className="w-5 h-5 text-purple-400 mb-3" />
              <div className="text-2xl font-bold">JSON</div>
              <div className="text-sm text-slate-400">Response format</div>
            </div>
          </div>

          {/* Authentication */}
          <section className="mb-16">
            <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-green-400" />
              Authentication
            </h2>
            <p className="text-slate-400 mb-6">
              All API requests require authentication using an API key in the Authorization header.
              API keys are available on Pro and Agency plans.
            </p>
            
            <div className="bg-slate-950 rounded-xl p-5 overflow-x-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Header</span>
              </div>
              <code className="text-sm text-green-400 font-mono">
                Authorization: Bearer lr_your_api_key_here
              </code>
            </div>

            {hasApiAccess && user && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm">
                  Manage your API keys in{' '}
                  <Link href="/dashboard/settings" className="text-primary hover:underline">
                    Settings → API Keys
                  </Link>
                </p>
              </div>
            )}
          </section>

          {/* Rate Limiting */}
          <section className="mb-16">
            <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              Rate Limiting
            </h2>
            <p className="text-slate-400 mb-6">
              API requests are rate-limited using two separate quotas. Read requests (GET) are 
              generous for data retrieval. Scan requests (POST /scans) are strictly limited due to 
              infrastructure costs. Rate limit headers are included in every response.
            </p>

            {/* Read Limits */}
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-400" />
              Read Requests (GET)
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Used for retrieving data: listing sites, scans, results, and guardian links. 
              Resets every hour.
            </p>
            <div className="grid gap-3 mb-8">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-slate-500">Free</span>
                  <span className="text-sm text-slate-400">No API access</span>
                </div>
                <span className="text-sm font-medium">0 req/hr</span>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-blue-400">Pro</span>
                  <span className="text-sm text-slate-400">Full API access</span>
                </div>
                <span className="text-sm font-medium">100 req/hr</span>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-purple-400">Agency</span>
                  <span className="text-sm text-slate-400">High-volume access</span>
                </div>
                <span className="text-sm font-medium">1,000 req/hr</span>
              </div>
            </div>

            {/* Scan Limits */}
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Play className="w-4 h-4 text-amber-400" />
              Scan Requests (POST /scans)
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Used to trigger new site scans. Strictly limited due to crawler infrastructure costs. 
              Resets at midnight UTC. Additionally, each site has a 1-hour cooldown between scans.
            </p>
            <div className="grid gap-3">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-slate-500">Free</span>
                  <span className="text-sm text-slate-400">No API access</span>
                </div>
                <span className="text-sm font-medium">0 scans/day</span>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-blue-400">Pro</span>
                  <span className="text-sm text-slate-400">Manual scans</span>
                </div>
                <span className="text-sm font-medium">2 scans/day</span>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-purple-400">Agency</span>
                  <span className="text-sm text-slate-400">Team scanning</span>
                </div>
                <span className="text-sm font-medium">10 scans/day</span>
              </div>
            </div>

            <div className="mt-6 bg-slate-950 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Response Headers</span>
              </div>
              <pre className="text-sm text-slate-300 font-mono">
{`X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 2024-01-15T14:00:00.000Z`}
              </pre>
            </div>
          </section>

          {/* Monthly Crawl Limits */}
          <section className="mb-16">
            <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-green-400" />
              Monthly Crawl Limits
            </h2>
            <p className="text-slate-400 mb-6">
              To prevent abuse and manage infrastructure costs, each plan has a monthly page crawl limit. 
              This counts the total number of pages scanned across all your sites. The counter resets on 
              the 1st of each month.
            </p>
            
            <div className="grid gap-3">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-slate-500">Free</span>
                  <span className="text-sm text-slate-400">No API crawling</span>
                </div>
                <span className="text-sm font-medium">0 pages/month</span>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-blue-400">Pro</span>
                  <span className="text-sm text-slate-400">~20 full scans at 500 pages</span>
                </div>
                <span className="text-sm font-medium">10,000 pages/month</span>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-purple-400">Agency</span>
                  <span className="text-sm text-slate-400">~10 full scans at 10K pages</span>
                </div>
                <span className="text-sm font-medium">100,000 pages/month</span>
              </div>
            </div>

            <div className="mt-6 bg-slate-950 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-500 uppercase tracking-wider">429 Response Headers</span>
              </div>
              <pre className="text-sm text-slate-300 font-mono">
{`X-MonthlyCrawl-Limit: 10000
X-MonthlyCrawl-Reset: 2024-02-01T00:00:00.000Z`}
              </pre>
            </div>

            <div className="mt-4 flex items-start gap-2 text-sm text-amber-400 bg-amber-400/10 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                If your site configuration would exceed your monthly limit, the scan will be rejected 
                with a 429 status. Upgrade your plan to increase your monthly crawl allowance.
              </span>
            </div>
          </section>

          {/* Endpoints */}
          <section className="mb-16">
            <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-400" />
              Endpoints
            </h2>

            {/* GET /sites */}
            <div className="mb-10 border rounded-xl overflow-hidden">
              <div className="bg-muted/50 px-5 py-3 border-b flex items-center gap-3">
                <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">GET</span>
                <code className="text-sm font-mono">/api/v1/sites</code>
              </div>
              <div className="p-5">
                <p className="text-slate-400 mb-4">
                  List all sites belonging to the authenticated user.
                </p>
                
                <h4 className="font-semibold text-sm mb-2">Response</h4>
                <div className="bg-slate-950 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-slate-300 font-mono">
{`{
  "sites": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "domain": "example.com",
      "sitemap_url": "https://example.com/sitemap.xml",
      "is_verified": true,
      "verified_at": "2024-01-10T12:00:00.000Z",
      "created_at": "2024-01-01T10:00:00.000Z"
    }
  ]
}`}
                  </pre>
                </div>
              </div>
            </div>

            {/* GET /sites/:id/scans */}
            <div className="mb-10 border rounded-xl overflow-hidden">
              <div className="bg-muted/50 px-5 py-3 border-b flex items-center gap-3">
                <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">GET</span>
                <code className="text-sm font-mono">/api/v1/sites/:id/scans</code>
              </div>
              <div className="p-5">
                <p className="text-slate-400 mb-4">
                  List all scans for a specific site.
                </p>
                
                <h4 className="font-semibold text-sm mb-2">Query Parameters</h4>
                <table className="w-full text-sm mb-4">
                  <thead className="text-left text-slate-500">
                    <tr>
                      <th className="pb-2 font-medium">Parameter</th>
                      <th className="pb-2 font-medium">Type</th>
                      <th className="pb-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-400">
                    <tr>
                      <td className="py-1 font-mono text-slate-300">limit</td>
                      <td>integer</td>
                      <td>Max results (default: 20, max: 100)</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-mono text-slate-300">offset</td>
                      <td>integer</td>
                      <td>Offset for pagination (default: 0)</td>
                    </tr>
                  </tbody>
                </table>
                
                <h4 className="font-semibold text-sm mb-2">Response</h4>
                <div className="bg-slate-950 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-slate-300 font-mono">
{`{
  "scans": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "status": "completed",
      "started_at": "2024-01-15T10:00:00.000Z",
      "finished_at": "2024-01-15T10:05:30.000Z",
      "pages_scanned": 150,
      "links_checked": 1200,
      "created_at": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}`}
                  </pre>
                </div>
              </div>
            </div>

            {/* POST /sites/:id/scans */}
            <div className="mb-10 border rounded-xl overflow-hidden">
              <div className="bg-muted/50 px-5 py-3 border-b flex items-center gap-3">
                <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded">POST</span>
                <code className="text-sm font-mono">/api/v1/sites/:id/scans</code>
              </div>
              <div className="p-5">
                <p className="text-slate-400 mb-4">
                  Trigger a new scan for a site. Returns immediately with a pending scan.
                  Subject to daily scan limits and 1-hour site cooldown.
                </p>

                <h4 className="font-semibold text-sm mb-2">Response</h4>
                <div className="bg-slate-950 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-slate-300 font-mono">
{`{
  "message": "Scan triggered successfully",
  "scan": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "status": "pending",
    "site_id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2024-01-15T12:00:00.000Z"
  }
}`}
                  </pre>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-start gap-2 text-sm text-amber-400 bg-amber-400/10 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Returns <code className="font-mono">202 Accepted</code>. Poll GET /sites/:id/scans to check status.</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-red-400 bg-red-400/10 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Scan requests are expensive! Limited to 2/day (Pro) or 10/day (Agency). Each site has a 1-hour cooldown between scans.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* GET /scans/:id/results */}
            <div className="mb-10 border rounded-xl overflow-hidden">
              <div className="bg-muted/50 px-5 py-3 border-b flex items-center gap-3">
                <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">GET</span>
                <code className="text-sm font-mono">/api/v1/scans/:id/results</code>
              </div>
              <div className="p-5">
                <p className="text-slate-400 mb-4">
                  Get broken link results for a specific scan.
                </p>
                
                <h4 className="font-semibold text-sm mb-2">Query Parameters</h4>
                <table className="w-full text-sm mb-4">
                  <thead className="text-left text-slate-500">
                    <tr>
                      <th className="pb-2 font-medium">Parameter</th>
                      <th className="pb-2 font-medium">Type</th>
                      <th className="pb-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-400">
                    <tr>
                      <td className="py-1 font-mono text-slate-300">issue_type</td>
                      <td>string</td>
                      <td>Filter by issue type (optional)</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-mono text-slate-300">limit</td>
                      <td>integer</td>
                      <td>Max results (default: 100, max: 1000)</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-mono text-slate-300">offset</td>
                      <td>integer</td>
                      <td>Offset for pagination (default: 0)</td>
                    </tr>
                  </tbody>
                </table>

                <h4 className="font-semibold text-sm mb-2">Issue Types</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {['BROKEN_4XX', 'SERVER_5XX', 'TIMEOUT', 'REDIRECT_TO_HOME', 'LOST_PARAMS'].map(type => (
                    <span key={type} className="text-xs font-mono bg-muted px-2 py-1 rounded">
                      {type}
                    </span>
                  ))}
                </div>
                
                <h4 className="font-semibold text-sm mb-2">Response</h4>
                <div className="bg-slate-950 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-slate-300 font-mono">
{`{
  "scan": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "status": "completed",
    "pages_scanned": 150,
    "links_checked": 1200,
    "created_at": "2024-01-15T10:00:00.000Z"
  },
  "summary": {
    "total_issues": 23,
    "by_type": {
      "BROKEN_4XX": 15,
      "SERVER_5XX": 3,
      "TIMEOUT": 5
    }
  },
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "source_page": "https://example.com/blog/post-1",
      "link_url": "https://affiliate.example.com/product",
      "final_url": "https://affiliate.example.com/product",
      "status_code": 404,
      "redirect_hops": 0,
      "issue_type": "BROKEN_4XX",
      "checked_at": "2024-01-15T10:03:45.000Z"
    }
  ],
  "pagination": {
    "total": 23,
    "limit": 100,
    "offset": 0,
    "has_more": false
  }
}`}
                  </pre>
                </div>
              </div>
            </div>

            {/* GET /guardian-links */}
            <div className="mb-10 border rounded-xl overflow-hidden">
              <div className="bg-muted/50 px-5 py-3 border-b flex items-center gap-3">
                <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">GET</span>
                <code className="text-sm font-mono">/api/v1/guardian-links</code>
              </div>
              <div className="p-5">
                <p className="text-slate-400 mb-4">
                  List all Guardian-monitored links.
                </p>
                
                <h4 className="font-semibold text-sm mb-2">Query Parameters</h4>
                <table className="w-full text-sm mb-4">
                  <thead className="text-left text-slate-500">
                    <tr>
                      <th className="pb-2 font-medium">Parameter</th>
                      <th className="pb-2 font-medium">Type</th>
                      <th className="pb-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-400">
                    <tr>
                      <td className="py-1 font-mono text-slate-300">status</td>
                      <td>string</td>
                      <td>Filter by status: active, paused, broken</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-mono text-slate-300">limit</td>
                      <td>integer</td>
                      <td>Max results (default: 20, max: 100)</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-mono text-slate-300">offset</td>
                      <td>integer</td>
                      <td>Offset for pagination (default: 0)</td>
                    </tr>
                  </tbody>
                </table>
                
                <h4 className="font-semibold text-sm mb-2">Response</h4>
                <div className="bg-slate-950 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-slate-300 font-mono">
{`{
  "links": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440004",
      "slug": "summer-sale",
      "rescue_url": "https://linkrescue.io/r/summer-sale",
      "original_url": "https://affiliate.com/summer-deals",
      "backup_url": "https://affiliate.com/fallback",
      "status": "active",
      "value_per_click_cents": 50,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-10T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 12,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* Error Codes */}
          <section className="mb-16">
            <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              Error Codes
            </h2>
            
            <div className="space-y-3">
              {[
                { code: 400, desc: 'Bad Request - Invalid parameters or JSON' },
                { code: 401, desc: 'Unauthorized - Invalid or missing API key' },
                { code: 403, desc: 'Forbidden - Plan doesn\'t have API access' },
                { code: 404, desc: 'Not Found - Resource doesn\'t exist' },
                { code: 409, desc: 'Conflict - Scan already running' },
                { code: 429, desc: 'Too Many Requests - Rate limit or monthly crawl limit exceeded' },
                { code: 500, desc: 'Internal Server Error - Please try again' },
              ].map(({ code, desc }) => (
                <div key={code} className="flex items-center gap-4 p-3 border rounded-lg">
                  <span className="text-sm font-mono w-12">{code}</span>
                  <span className="text-sm text-slate-400">{desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Example */}
          <section className="mb-16">
            <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
              <Play className="w-5 h-5 text-green-400" />
              Example Usage
            </h2>
            
            <div className="bg-slate-950 rounded-xl p-5 overflow-x-auto">
              <pre className="text-sm text-slate-300 font-mono">
{`# List your sites
curl -H "Authorization: Bearer lr_your_api_key" \\
  https://linkrescue.io/api/v1/sites

# Trigger a scan
curl -X POST \\
  -H "Authorization: Bearer lr_your_api_key" \\
  https://linkrescue.io/api/v1/sites/UUID/scans

# Get scan results
curl -H "Authorization: Bearer lr_your_api_key" \\
  "https://linkrescue.io/api/v1/scans/UUID/results?limit=50"

# List broken guardian links
curl -H "Authorization: Bearer lr_your_api_key" \\
  "https://linkrescue.io/api/v1/guardian-links?status=broken"`}
              </pre>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center pt-8 border-t">
            <p className="text-slate-400 text-sm">
              Need help? Contact us at{' '}
              <a href="mailto:support@linkrescue.io" className="text-primary hover:underline">
                support@linkrescue.io
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
