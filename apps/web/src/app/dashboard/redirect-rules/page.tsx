import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftRight, Plus } from 'lucide-react';
import type { RedirectStatus, Database } from '@linkrescue/database';

export const dynamic = 'force-dynamic';

const statusColors: Record<RedirectStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  deployed: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-400',
};

export default async function RedirectRulesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: rulesData } = await supabase
    .from('redirect_rules')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const rules: Database['public']['Tables']['redirect_rules']['Row'][] | null = rulesData;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Redirect Rules</h1>
          <p className="text-muted-foreground mt-1">Manage URL redirect rules with approval workflows</p>
        </div>
        <Link
          href="/redirect-rules/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Rule
        </Link>
      </div>

      {!rules || rules.length === 0 ? (
        <div className="text-center py-20 border rounded-lg bg-background">
          <ArrowLeftRight className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No redirect rules yet.</p>
        </div>
      ) : (
        <div className="border rounded-lg bg-background overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left font-medium">From</th>
                <th className="px-4 py-2 text-left font-medium">To</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-left font-medium">Version</th>
                <th className="px-4 py-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono text-xs max-w-xs truncate">{rule.from_url}</td>
                  <td className="px-4 py-3 font-mono text-xs max-w-xs truncate text-muted-foreground">
                    {rule.to_url}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[rule.status]}`}>
                      {rule.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">v{rule.version}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/redirect-rules/${rule.id}`}
                      className="text-xs text-primary hover:underline"
                    >
                      View
                    </Link>
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
