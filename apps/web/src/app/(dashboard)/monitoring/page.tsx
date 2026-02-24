import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Activity } from 'lucide-react';

export default async function MonitoringPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: sources } = await supabase
    .from('log_sources').select('id, name').eq('user_id', user.id);

  const sourceIds = (sources ?? []).map((s) => s.id);

  const { data: incidents } = sourceIds.length > 0
    ? await supabase
        .from('link_incidents')
        .select('*, log_sources(name)')
        .in('source_id', sourceIds)
        .order('hits', { ascending: false })
        .limit(100)
    : { data: [] };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Monitoring</h1>
          <p className="text-muted-foreground mt-1">Broken links detected from server logs</p>
        </div>
        <Link
          href="/monitoring/setup"
          className="flex items-center gap-2 border px-4 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
        >
          Setup Guide
        </Link>
      </div>

      {!incidents || incidents.length === 0 ? (
        <div className="text-center py-20 border rounded-lg bg-background">
          <Activity className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No incidents yet.</p>
          <Link href="/monitoring/setup" className="text-sm text-primary hover:underline mt-2 inline-block">
            Set up log ingestion →
          </Link>
        </div>
      ) : (
        <div className="border rounded-lg bg-background overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left font-medium">URL</th>
                <th className="px-4 py-2 text-left font-medium">Source</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-left font-medium">Hits</th>
                <th className="px-4 py-2 text-left font-medium">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident) => (
                <tr key={incident.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono text-xs max-w-xs truncate">{incident.url}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {(incident.log_sources as { name: string })?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">
                      {incident.status_code}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">{incident.hits}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(incident.last_seen_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
