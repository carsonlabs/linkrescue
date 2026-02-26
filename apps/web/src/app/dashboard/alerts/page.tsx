import { createClient } from '@/lib/supabase/server';
import { Bell, CheckCircle2, AlertCircle, Info, Mail } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AlertsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch user's sites and their latest scan results
  const { data: sites } = await supabase
    .from('sites')
    .select('id, domain, verified_at')
    .eq('user_id', user.id);

  // Fetch recent alerts/notifications
  const { data: alerts } = await supabase
    .from('scan_events')
    .select(`
      id,
      level,
      message,
      created_at,
      scan:scans!inner(
        site_id,
        site:sites!inner(domain)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  // Get summary stats
  const totalSites = sites?.length || 0;
  const verifiedSites = sites?.filter(s => s.verified_at)?.length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold mb-2">Alerts</h1>
        <p className="text-slate-400">
          Notifications and updates about your monitored sites
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-5 h-5 text-green-400" />
            <span className="text-sm text-slate-400">Total Sites</span>
          </div>
          <div className="font-display text-2xl font-bold">{totalSites}</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="text-sm text-slate-400">Verified</span>
          </div>
          <div className="font-display text-2xl font-bold">{verifiedSites}</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-5 h-5 text-green-400" />
            <span className="text-sm text-slate-400">Email Alerts</span>
          </div>
          <div className="font-display text-2xl font-bold">Enabled</div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="glass-card">
        <div className="p-4 border-b border-white/5">
          <h2 className="font-semibold">Recent Activity</h2>
        </div>
        <div className="divide-y divide-white/5">
          {!alerts || alerts.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Bell className="w-8 h-8 mx-auto mb-3 text-slate-600" />
              <p>No alerts yet</p>
              <p className="text-sm mt-1">
                Alerts will appear here when scans complete or issues are detected
              </p>
            </div>
          ) : (
            alerts.map((alert: any) => (
              <div key={alert.id} className="p-4 flex items-start gap-4">
                {alert.level === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                ) : alert.level === 'warn' ? (
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200">{alert.message}</p>
                  {alert.scan?.site?.domain && (
                    <p className="text-xs text-slate-500 mt-1">
                      {alert.scan.site.domain}
                    </p>
                  )}
                  <p className="text-xs text-slate-600 mt-1">
                    {new Date(alert.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Email Settings */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-5 h-5 text-green-400" />
          <h2 className="font-semibold">Email Notifications</h2>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          Get weekly digests and immediate alerts for critical issues
        </p>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="rounded border-slate-600 bg-slate-800" />
            <span className="text-sm">Weekly summary of all issues</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="rounded border-slate-600 bg-slate-800" />
            <span className="text-sm">Immediate alerts for critical broken links</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" className="rounded border-slate-600 bg-slate-800" />
            <span className="text-sm">Scan completion notifications</span>
          </label>
        </div>
      </div>
    </div>
  );
}
