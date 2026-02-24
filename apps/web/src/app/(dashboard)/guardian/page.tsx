import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Shield, Plus, ExternalLink } from 'lucide-react';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  broken: 'bg-red-100 text-red-800',
};

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

export default async function GuardianPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: linksRaw } = await supabase
    .from('guardian_links')
    .select('*, rescue_logs(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const links = (linksRaw ?? []) as any[];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Guardian Links</h1>
          <p className="text-muted-foreground mt-1">Backup links that rescue visitors from broken URLs</p>
        </div>
        <Link
          href="/guardian/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Link
        </Link>
      </div>

      {!links || links.length === 0 ? (
        <div className="text-center py-20 border rounded-lg bg-background">
          <Shield className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No guardian links yet.</p>
        </div>
      ) : (
        <div className="border rounded-lg bg-background overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left font-medium">Slug</th>
                <th className="px-4 py-2 text-left font-medium">Original URL</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-left font-medium">Rescues</th>
                <th className="px-4 py-2 text-left font-medium">Value/click</th>
                <th className="px-4 py-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => {
                const rescues = Array.isArray(link.rescue_logs) ? link.rescue_logs.length : 0;
                const rescueUrl = `${appUrl}/api/rescue/${link.slug}`;
                return (
                  <tr key={link.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{link.slug}</td>
                    <td className="px-4 py-3 max-w-xs truncate text-muted-foreground">
                      {link.original_url}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[link.status] ?? ''}`}>
                        {link.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{rescues}</td>
                    <td className="px-4 py-3">${(link.value_per_click_cents / 100).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <a
                          href={rescueUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Rescue URL
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
