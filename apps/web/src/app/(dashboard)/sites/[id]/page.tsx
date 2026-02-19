import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export default async function SiteDetailsPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: site } = await supabase.from('sites').select('*').eq('id', params.id).single();

  if (!site) {
    notFound();
  }

  // TODO: Fetch links for the site with 'broken' or 'redirected' status
  const { data: pages } = await supabase.from('pages').select('*').eq('site_id', params.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{site.domain}</h1>
        <p className="text-muted-foreground">
          Here are the latest issues found on your site. {pages?.length || 0} pages scanned.
        </p>
      </div>
      {/* TODO: Add IssuesTable component */}
      <div className="border rounded-lg p-4">
        <p className="text-muted-foreground">Issues table will be displayed here.</p>
      </div>
    </div>
  );
}
