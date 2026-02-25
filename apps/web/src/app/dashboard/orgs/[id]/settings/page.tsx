import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function OrgSettingsPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: org } = await supabase
    .from('organizations').select('*').eq('id', params.id).single();
  if (!org) notFound();

  const { data: members } = await supabase
    .from('org_members').select('*').eq('org_id', params.id);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">{org.name} — Settings</h1>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">Members</h2>
        <div className="border rounded-lg bg-background overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left font-medium">User ID</th>
                <th className="px-4 py-2 text-left font-medium">Role</th>
                <th className="px-4 py-2 text-left font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {(members ?? []).map((m) => (
                <tr key={m.user_id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{m.user_id}</td>
                  <td className="px-4 py-3 capitalize">{m.role}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {m.accepted_at ? new Date(m.accepted_at).toLocaleDateString() : 'Invited'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
