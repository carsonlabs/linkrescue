import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please log in.</div>;
  }

  const { data: sites } = await supabase.from('sites').select('*').eq('user_id', user.id);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Your Sites</h1>
        <Link
          href="/sites/new"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:opacity-90"
        >
          Add Site
        </Link>
      </div>
      <div className="grid gap-4">
        {sites?.map((site) => (
          <Link
            key={site.id}
            href={`/sites/${site.id}`}
            className="border rounded-lg p-4 hover:bg-accent"
          >
            <h2 className="font-semibold">{site.domain}</h2>
            <p className="text-sm text-muted-foreground">
              {site.ownership_verified ? 'Verified' : 'Not verified'}
            </p>
          </Link>
        ))}
        {sites?.length === 0 && (
          <p className="text-muted-foreground">No sites yet. Add your first site to get started!</p>
        )}
      </div>
    </div>
  );
}
