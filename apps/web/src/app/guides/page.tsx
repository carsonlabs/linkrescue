import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink, ArrowRight, Calendar } from 'lucide-react';
import { createAdminClient } from '@linkrescue/database';

const SITE_URL = 'https://linkrescue.io';

export const revalidate = 86400; // ISR: 24 hours

export const metadata: Metadata = {
  title: 'Affiliate Marketing Guides — Tips, Strategies & Best Practices',
  description:
    'Learn how to protect your affiliate revenue, monitor broken links, and optimize your affiliate marketing strategy with our in-depth guides.',
  alternates: { canonical: `${SITE_URL}/guides` },
  openGraph: {
    title: 'Affiliate Marketing Guides',
    description:
      'Learn how to protect your affiliate revenue, monitor broken links, and optimize your affiliate marketing strategy.',
    url: `${SITE_URL}/guides`,
    siteName: 'LinkRescue',
    type: 'website',
  },
};

type GuideSummary = {
  slug: string;
  title: string;
  meta_description: string;
  published_at: string | null;
};

async function getGuides(): Promise<GuideSummary[]> {
  const db = createAdminClient();
  const { data } = await db
    .from('seo_pages' as any)
    .select('slug, title, meta_description, published_at')
    .eq('page_type', 'guide')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  return (data as GuideSummary[] | null) ?? [];
}

export default async function GuidesIndexPage() {
  const guides = await getGuides();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="border-b border-white/5">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center">
              <ExternalLink className="w-4 h-4 text-slate-900" />
            </div>
            <span className="font-display font-bold text-lg">LinkRescue</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm text-slate-400 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">
              Log in
            </Link>
            <Link href="/signup" className="btn-primary text-sm px-4 py-2">
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Affiliate Marketing Guides
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Tips, strategies, and best practices for protecting and growing your affiliate revenue.
          </p>
        </div>
      </section>

      {/* Guides List */}
      <section className="pb-20">
        <div className="container mx-auto px-6 max-w-3xl">
          {guides.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-500">Guides coming soon. Check back later!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {guides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/guides/${guide.slug}`}
                  className="block glass-card p-6 hover:border-green-500/20 transition-colors group"
                >
                  <h2 className="font-display font-semibold text-lg mb-2 group-hover:text-green-400 transition-colors">
                    {guide.title}
                  </h2>
                  <p className="text-sm text-slate-400 mb-3">{guide.meta_description}</p>
                  {guide.published_at && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Calendar className="w-3.5 h-3.5" />
                      <time dateTime={guide.published_at}>
                        {new Date(guide.published_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </time>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-white/5">
        <div className="container mx-auto px-6 text-center max-w-2xl">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Protect Your Affiliate Revenue
          </h2>
          <p className="text-lg text-slate-400 mb-10">
            LinkRescue monitors your affiliate links daily and alerts you the moment something breaks.
          </p>
          <Link href="/signup" className="btn-primary text-base px-8 py-4">
            Start Monitoring Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center">
                <ExternalLink className="w-3.5 h-3.5 text-slate-900" />
              </div>
              <span className="font-display font-bold">LinkRescue</span>
            </Link>
            <div className="flex items-center gap-8 text-sm text-slate-500">
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
            <p className="text-sm text-slate-600">
              &copy; {new Date().getFullYear()} LinkRescue
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
