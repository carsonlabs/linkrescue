import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users, Plus } from 'lucide-react';

export default async function OrgsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: orgs } = await supabase
    .from('organizations')
    .select('*, org_members(user_id, role)')
    .or(`owner_id.eq.${user.id},org_members.user_id.eq.${user.id}`);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Organizations</h1>
          <p className="text-muted-foreground mt-1">Manage teams and collaboration</p>
        </div>
        <Link
          href="/orgs/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Organization
        </Link>
      </div>

      {!orgs || orgs.length === 0 ? (
        <div className="text-center py-20 border rounded-lg bg-background">
          <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No organizations yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orgs.map((org) => (
            <div key={org.id} className="border rounded-lg bg-background p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold">{org.name}</p>
                <p className="text-sm text-muted-foreground">/{org.slug}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {org.org_members?.length ?? 0} member(s)
                </span>
                <Link
                  href={`/orgs/${org.id}/settings`}
                  className="text-sm px-3 py-1.5 border rounded-md hover:bg-muted transition-colors"
                >
                  Settings
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
