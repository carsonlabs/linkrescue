import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Tag, Plus } from 'lucide-react';

export default async function OffersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: offers } = await supabase
    .from('offers')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Offers</h1>
          <p className="text-muted-foreground mt-1">Replacement links matched to broken URLs by AI</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/offers/import"
            className="flex items-center gap-2 border px-4 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
          >
            Import CSV
          </Link>
          <Link
            href="/offers/new"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Offer
          </Link>
        </div>
      </div>

      {!offers || offers.length === 0 ? (
        <div className="text-center py-20 border rounded-lg bg-background">
          <Tag className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No offers yet. Add one or import a CSV.</p>
        </div>
      ) : (
        <div className="border rounded-lg bg-background overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left font-medium">Title</th>
                <th className="px-4 py-2 text-left font-medium">Topic</th>
                <th className="px-4 py-2 text-left font-medium">Tags</th>
                <th className="px-4 py-2 text-left font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <a
                      href={offer.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline text-primary"
                    >
                      {offer.title}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{offer.topic || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {offer.tags.map((tag: string) => (
                        <span key={tag} className="px-1.5 py-0.5 bg-muted rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">${(offer.estimated_value_cents / 100).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
