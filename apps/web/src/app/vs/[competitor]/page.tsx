import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Check, X, Minus } from 'lucide-react';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import { cache } from 'react';
const SITE_URL = 'https://www.linkrescue.io';

type ComparisonFeature = {
  feature: string;
  linkrescue: string | boolean;
  competitor: string | boolean;
};

type SeoPage = {
  id: string;
  slug: string;
  title: string;
  meta_description: string;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  hero_headline: string | null;
  hero_subheadline: string | null;
  content: unknown[];
  faq: { q: string; a: string }[] | null;
  competitor_name: string | null;
  competitor_url: string | null;
  comparison_features: ComparisonFeature[] | null;
  published_at: string | null;
};

const getPage = cache(async function getPage(slug: string): Promise<SeoPage | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  const { createAdminClient } = await import('@linkrescue/database');
  const db = createAdminClient();
  const { data } = await db
    .from('seo_pages' as any)
    .select('*')
    .eq('page_type', 'comparison')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  return data as SeoPage | null;
});

export const revalidate = 86400; // ISR: 24 hours

export async function generateMetadata({
  params,
}: {
  params: Promise<{ competitor: string }>;
}): Promise<Metadata> {
  const { competitor } = await params;
  const page = await getPage(competitor);
  if (!page) return {};

  const pageUrl = `${SITE_URL}/vs/${competitor}`;
  return {
    title: page.title,
    description: page.meta_description,
    alternates: { canonical: page.canonical_url || pageUrl },
    openGraph: {
      title: page.og_title || page.title,
      description: page.og_description || page.meta_description,
      url: pageUrl,
      siteName: 'LinkRescue',
      type: 'article',
      ...(page.og_image_url ? { images: [{ url: page.og_image_url, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: page.og_title || page.title,
      description: page.og_description || page.meta_description,
    },
  };
}

function FeatureValue({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="w-5 h-5 text-green-400 mx-auto" />;
  if (value === false) return <X className="w-5 h-5 text-red-400 mx-auto" />;
  if (value === '-') return <Minus className="w-5 h-5 text-slate-600 mx-auto" />;
  return <span className="text-sm text-slate-300">{value}</span>;
}

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ competitor: string }>;
}) {
  const { competitor } = await params;
  const page = await getPage(competitor);
  if (!page) notFound();

  const pageUrl = `${SITE_URL}/vs/${competitor}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.title,
    description: page.meta_description,
    url: pageUrl,
    publisher: { '@type': 'Organization', name: 'LinkRescue', url: SITE_URL },
    ...(page.published_at ? { datePublished: page.published_at } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-slate-950 text-white">
        <PublicNav />

        {/* Hero */}
        <section className="pt-28 pb-20 md:pt-36 md:pb-28">
          <div className="container mx-auto px-6 text-center max-w-3xl">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {page.hero_headline || `LinkRescue vs ${page.competitor_name}`}
            </h1>
            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              {page.hero_subheadline ||
                `See how LinkRescue compares to ${page.competitor_name} for affiliate link monitoring.`}
            </p>
          </div>
        </section>

        {/* Comparison Table */}
        {page.comparison_features && page.comparison_features.length > 0 && (
          <section className="py-16 border-t border-white/5">
            <div className="container mx-auto px-6 max-w-3xl">
              <h2 className="font-display text-3xl font-bold text-center mb-10">
                Feature Comparison
              </h2>
              <div className="glass-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-4 px-5 text-slate-400 font-medium">Feature</th>
                      <th className="text-center py-4 px-5 text-green-400 font-medium">LinkRescue</th>
                      <th className="text-center py-4 px-5 text-slate-400 font-medium">
                        {page.competitor_name}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {page.comparison_features.map((row) => (
                      <tr key={row.feature}>
                        <td className="py-4 px-5 font-medium">{row.feature}</td>
                        <td className="py-4 px-5 text-center">
                          <FeatureValue value={row.linkrescue} />
                        </td>
                        <td className="py-4 px-5 text-center">
                          <FeatureValue value={row.competitor} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Content blocks */}
        {Array.isArray(page.content) && page.content.length > 0 && (
          <section className="py-16 border-t border-white/5">
            <div className="container mx-auto px-6 max-w-3xl prose prose-invert prose-sm">
              {(page.content as { type: string; heading?: string; body?: string }[]).map((block, i) => (
                <div key={i}>
                  {block.heading && <h2>{block.heading}</h2>}
                  {block.body && <p>{block.body}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        {page.faq && page.faq.length > 0 && (
          <section className="py-16 border-t border-white/5">
            <div className="container mx-auto px-6 max-w-3xl">
              <h2 className="font-display text-3xl font-bold text-center mb-10">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {page.faq.map((item) => (
                  <div key={item.q} className="glass-card p-5">
                    <h3 className="font-semibold mb-2">{item.q}</h3>
                    <p className="text-sm text-slate-400">{item.a}</p>
                  </div>
                ))}
              </div>
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'FAQPage',
                    mainEntity: page.faq.map((item) => ({
                      '@type': 'Question',
                      name: item.q,
                      acceptedAnswer: { '@type': 'Answer', text: item.a },
                    })),
                  }),
                }}
              />
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-20 border-t border-white/5">
          <div className="container mx-auto px-6 text-center max-w-2xl">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Ready to Switch to LinkRescue?
            </h2>
            <p className="text-lg text-slate-400 mb-10">
              Start monitoring your affiliate links in under 2 minutes. Free plan available.
            </p>
            <Link href="/signup" className="btn-primary text-base px-8 py-4">
              Start Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        <PublicFooter />
      </div>
    </>
  );
}
