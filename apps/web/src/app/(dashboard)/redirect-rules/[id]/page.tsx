import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import type { RedirectStatus, Database } from '@linkrescue/database';

const statusColors: Record<RedirectStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  deployed: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-400',
};

export default async function RedirectRuleDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: ruleData } = await supabase
    .from('redirect_rules').select('*').eq('id', params.id).single();
  
  const rule: Database['public']['Tables']['redirect_rules']['Row'] | null = ruleData;
  if (!rule || rule.user_id !== user.id) notFound();

  const [{ data: versions }, { data: approvalLog }] = await Promise.all([
    supabase.from('redirect_rule_versions').select('*').eq('rule_id', params.id).order('version', { ascending: false }),
    supabase.from('approval_log').select('*').eq('rule_id', params.id).order('acted_at', { ascending: false }),
  ]);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold">Redirect Rule</h1>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[rule.status]}`}>
          {rule.status.replace('_', ' ')}
        </span>
      </div>

      <section className="mb-6 border rounded-lg bg-background p-5">
        <p className="text-sm text-muted-foreground mb-1">From</p>
        <p className="font-mono text-sm mb-4">{rule.from_url}</p>
        <p className="text-sm text-muted-foreground mb-1">To</p>
        <p className="font-mono text-sm">{rule.to_url}</p>
      </section>

      <section className="mb-6">
        <h2 className="text-base font-semibold mb-3">Actions</h2>
        <div className="flex gap-2 flex-wrap">
          {rule.status === 'draft' && (
            <form action={`/api/redirect-rules/${rule.id}/submit`} method="POST">
              <button className="px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors">
                Submit for Approval
              </button>
            </form>
          )}
          {rule.status === 'pending_approval' && (
            <>
              <form action={`/api/redirect-rules/${rule.id}/approve`} method="POST">
                <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                  Approve
                </button>
              </form>
              <form action={`/api/redirect-rules/${rule.id}/reject`} method="POST">
                <button className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors">
                  Reject
                </button>
              </form>
            </>
          )}
          {rule.status === 'approved' && (
            <form action={`/api/redirect-rules/${rule.id}/deploy`} method="POST">
              <button className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                Deploy
              </button>
            </form>
          )}
          {rule.status === 'deployed' && (
            <form action={`/api/redirect-rules/${rule.id}/rollback`} method="POST">
              <button className="px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors">
                Rollback
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-base font-semibold mb-3">Version History</h2>
        <div className="border rounded-lg bg-background overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left font-medium">Version</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-left font-medium">Changed</th>
              </tr>
            </thead>
            <tbody>
              {(versions ?? []).map((v) => (
                <tr key={v.id} className="border-b last:border-0">
                  <td className="px-4 py-3">v{v.version}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[v.status]}`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(v.changed_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-3">Approval Log</h2>
        <div className="space-y-2">
          {(approvalLog ?? []).map((entry) => (
            <div key={entry.id} className="text-sm border rounded-md px-4 py-3 bg-background">
              <span className="font-medium capitalize">{entry.action}</span>
              {entry.note && <span className="text-muted-foreground"> — {entry.note}</span>}
              <span className="text-muted-foreground ml-2">
                {new Date(entry.acted_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
