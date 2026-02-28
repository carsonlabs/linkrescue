import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getUserPlan, hasFeature, type TierName } from '@linkrescue/types';
import { BookOpen, Code2, Key, Zap, Webhook } from 'lucide-react';

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
                Upgrade to Pro for read-only API access, or Agency for full API + webhook-triggered scans.
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

      {/* Trigger Scan */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-400" />
          <h2 className="font-display font-semibold text-lg">Trigger Scan</h2>
          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
            Agency
          </span>
        </div>
        <p className="text-sm text-slate-400">
          Trigger an on-demand scan for a specific site. Agency plan only.
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-green-500/20 text-green-400 px-2 py-1 rounded">POST</span>
            <code className="text-sm text-slate-300">{baseUrl}/api/webhooks/scan</code>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Request Body</h4>
            <pre className="bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm overflow-x-auto">
              <code className="text-slate-300">{`{
  "siteId": "your-site-uuid"
}`}</code>
            </pre>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Success Response (200)</h4>
            <pre className="bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm overflow-x-auto">
              <code className="text-slate-300">{`{
  "scanId": "scan-uuid",
  "status": "completed",
  "pagesScanned": 42,
  "linksChecked": 187,
  "remaining": 9
}`}</code>
            </pre>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Error Responses</h4>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <code className="text-red-400 flex-shrink-0">401</code>
                <span className="text-slate-400">Invalid or missing API key</span>
              </div>
              <div className="flex gap-3">
                <code className="text-red-400 flex-shrink-0">403</code>
                <span className="text-slate-400">Feature not available on your plan</span>
              </div>
              <div className="flex gap-3">
                <code className="text-amber-400 flex-shrink-0">409</code>
                <span className="text-slate-400">Scan already in progress for this site</span>
              </div>
              <div className="flex gap-3">
                <code className="text-amber-400 flex-shrink-0">429</code>
                <span className="text-slate-400">Daily scan limit reached</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rate Limits */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-400" />
          <h2 className="font-display font-semibold text-lg">Rate Limits</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-3 text-slate-400 font-medium">Plan</th>
                <th className="text-right py-3 px-3 text-slate-400 font-medium">Read Requests</th>
                <th className="text-right py-3 px-3 text-slate-400 font-medium">Scan Requests</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="py-3 px-3">Pro</td>
                <td className="py-3 px-3 text-right text-slate-400">100/hour</td>
                <td className="py-3 px-3 text-right text-slate-400">2/day</td>
              </tr>
              <tr>
                <td className="py-3 px-3">Agency</td>
                <td className="py-3 px-3 text-right text-slate-400">1,000/hour</td>
                <td className="py-3 px-3 text-right text-slate-400">10/day</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Outbound Webhooks */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Webhook className="w-5 h-5 text-orange-400" />
          <h2 className="font-display font-semibold text-lg">Outbound Webhooks</h2>
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
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Available Events</h4>
          <div className="space-y-2 text-sm">
            <div className="flex gap-3">
              <code className="text-green-400 flex-shrink-0">scan.completed</code>
              <span className="text-slate-400">Fired when a scan finishes successfully</span>
            </div>
            <div className="flex gap-3">
              <code className="text-red-400 flex-shrink-0">scan.failed</code>
              <span className="text-slate-400">Fired when a scan fails</span>
            </div>
            <div className="flex gap-3">
              <code className="text-red-400 flex-shrink-0">link.broken</code>
              <span className="text-slate-400">Fired when a new broken link is detected</span>
            </div>
            <div className="flex gap-3">
              <code className="text-green-400 flex-shrink-0">link.fixed</code>
              <span className="text-slate-400">Fired when a previously broken link is fixed</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Signature Verification</h4>
          <pre className="bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm overflow-x-auto">
            <code className="text-slate-300">{`// Verify the X-LinkRescue-Signature header
const crypto = require('crypto');
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

      {/* cURL Example */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-slate-400" />
          <h2 className="font-display font-semibold text-lg">Quick Start</h2>
        </div>
        <pre className="bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm overflow-x-auto">
          <code className="text-slate-300">{`curl -X POST ${baseUrl}/api/webhooks/scan \\
  -H "Authorization: Bearer lr_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"siteId": "your-site-uuid"}'`}</code>
        </pre>
      </div>
    </div>
  );
}
