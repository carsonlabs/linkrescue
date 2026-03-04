import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, CheckCircle2, AlertTriangle, Shield } from 'lucide-react';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import { cache } from 'react';
import { createAdminClient } from '@linkrescue/database';

const SITE_URL = 'https://www.linkrescue.io';

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
  sidebar: unknown;
  faq: { q: string; a: string }[] | null;
  network_name: string | null;
  network_url: string | null;
  network_commission: string | null;
  network_cookie_days: number | null;
  published_at: string | null;
};

const getPage = cache(async function getPage(slug: string): Promise<SeoPage | null> {
  const db = createAdminClient();
  const { data } = await db
    .from('seo_pages' as any)
    .select('*')
    .eq('page_type', 'network_check')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  return data as SeoPage | null;
});

export const revalidate = 86400; // ISR: 24 hours

export async function generateMetadata({
  params,
}: {
  params: Promise<{ network: string }>;
}): Promise<Metadata> {
  const { network } = await params;
  const page = await getPage(network);
  if (!page) return {};

  const pageUrl = `${SITE_URL}/check/${network}`;
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

export default async function NetworkCheckPage({
  params,
}: {
  params: Promise<{ network: string }>;
}) {
  const { network } = await params;
  const page = await getPage(network);
  if (!page) notFound();

  const pageUrl = `${SITE_URL}/check/${network}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: page.title,
    url: pageUrl,
    description: page.meta_description,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    provider: { '@type': 'Organization', name: 'LinkRescue', url: SITE_URL },
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
            <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-400 text-sm font-medium px-4 py-1.5 rounded-full mb-8 border border-green-500/20">
              <Shield className="w-4 h-4" />
              Affiliate Link Checker
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {page.hero_headline || `${page.network_name} Link Checker`}
            </h1>
            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              {page.hero_subheadline ||
                `Monitor your ${page.network_name} affiliate links for broken URLs, redirect issues, and lost tracking parameters.`}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="btn-primary text-base px-8 py-4">
                Check Your Links Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/link-checker" className="btn-secondary text-base px-8 py-4">
                Try Instant Checker
              </Link>
            </div>
          </div>
        </section>

        {/* Network Info */}
        {page.network_name && (
          <section className="py-16 border-t border-white/5">
            <div className="container mx-auto px-6 max-w-3xl">
              <h2 className="font-display text-3xl font-bold text-center mb-10">
                About {page.network_name}
              </h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {page.network_commission && (
                  <div className="glass-card p-5 text-center">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Commission</p>
                    <p className="text-xl font-bold text-green-400">{page.network_commission}</p>
                  </div>
                )}
                {page.network_cookie_days && (
                  <div className="glass-card p-5 text-center">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Cookie Duration</p>
                    <p className="text-xl font-bold text-green-400">{page.network_cookie_days} days</p>
                  </div>
                )}
                {page.network_url && (
                  <div className="glass-card p-5 text-center">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Program</p>
                    <a
                      href={page.network_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-400 hover:text-green-300 transition-colors text-sm font-medium"
                    >
                      Visit Program &rarr;
                    </a>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Common Issues */}
        <section className="py-16 border-t border-white/5">
          <div className="container mx-auto px-6 max-w-3xl">
            <h2 className="font-display text-3xl font-bold text-center mb-10">
              Common {page.network_name} Link Issues
            </h2>
            <div className="space-y-4">
              {[
                {
                  icon: AlertTriangle,
                  title: 'Broken Links',
                  description: `${page.network_name} product pages get removed or URLs change, leaving your affiliate links pointing nowhere.`,
                },
                {
                  icon: Shield,
                  title: 'Lost Tracking Parameters',
                  description: 'Affiliate tags can get stripped during redirects, meaning you lose credit for sales you generated.',
                },
                {
                  icon: CheckCircle2,
                  title: 'Redirect Chain Issues',
                  description: 'Multiple redirects slow down page loads and can cause affiliate cookies to not be set correctly.',
                },
              ].map((item) => (
                <div key={item.title} className="glass-card p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                    <p className="text-xs text-slate-500">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

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
              Stop Losing {page.network_name} Commissions
            </h2>
            <p className="text-lg text-slate-400 mb-10">
              LinkRescue monitors your {page.network_name} affiliate links daily and alerts you the moment something breaks.
            </p>
            <Link href="/signup" className="btn-primary text-base px-8 py-4">
              Start Monitoring Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        <PublicFooter />
      </div>
    </>
  );
}
