import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ExternalLink, Calendar } from 'lucide-react';
import { createAdminClient } from '@linkrescue/database';

const SITE_URL = 'https://linkrescue.io';

type ContentBlock = {
  type: 'heading' | 'paragraph' | 'list' | 'callout';
  heading?: string;
  body?: string;
  items?: string[];
  variant?: 'info' | 'warning' | 'tip';
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
  content: ContentBlock[];
  sidebar: { toc?: { label: string; href: string }[]; related?: { title: string; slug: string }[] } | null;
  faq: { q: string; a: string }[] | null;
  published_at: string | null;
  updated_at: string;
};

async function getPage(slug: string): Promise<SeoPage | null> {
  const db = createAdminClient();
  const { data } = await db
    .from('seo_pages' as any)
    .select('*')
    .eq('page_type', 'guide')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  return data as SeoPage | null;
}

export const revalidate = 86400; // ISR: 24 hours

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return {};

  const pageUrl = `${SITE_URL}/guides/${slug}`;
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
      ...(page.published_at ? { publishedTime: page.published_at } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: page.og_title || page.title,
      description: page.og_description || page.meta_description,
    },
  };
}

function ContentBlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'heading':
      return <h2 className="font-display text-2xl font-bold mt-10 mb-4">{block.heading}</h2>;
    case 'paragraph':
      return <p className="text-slate-300 leading-relaxed mb-4">{block.body}</p>;
    case 'list':
      return (
        <ul className="list-disc list-inside space-y-2 mb-6 text-slate-300">
          {block.items?.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );
    case 'callout':
      return (
        <div
          className={`rounded-xl p-4 mb-6 border ${
            block.variant === 'warning'
              ? 'bg-yellow-500/5 border-yellow-500/20 text-yellow-300'
              : block.variant === 'tip'
                ? 'bg-green-500/5 border-green-500/20 text-green-300'
                : 'bg-blue-500/5 border-blue-500/20 text-blue-300'
          }`}
        >
          <p className="text-sm">{block.body}</p>
        </div>
      );
    default:
      return null;
  }
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  const pageUrl = `${SITE_URL}/guides/${slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.title,
    description: page.meta_description,
    url: pageUrl,
    ...(page.published_at ? { datePublished: page.published_at } : {}),
    dateModified: page.updated_at,
    publisher: {
      '@type': 'Organization',
      name: 'LinkRescue',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
  };

  const publishedDate = page.published_at
    ? new Date(page.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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

        {/* Article Header */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6 max-w-3xl">
            <Link
              href="/guides"
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors mb-6 inline-block"
            >
              &larr; All Guides
            </Link>
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              {page.hero_headline || page.title}
            </h1>
            {page.hero_subheadline && (
              <p className="text-lg text-slate-400 mb-6">{page.hero_subheadline}</p>
            )}
            {publishedDate && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Calendar className="w-4 h-4" />
                <time dateTime={page.published_at!}>{publishedDate}</time>
              </div>
            )}
          </div>
        </section>

        {/* Article Body */}
        <section className="pb-16">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto">
              {/* Table of Contents */}
              {page.sidebar?.toc && page.sidebar.toc.length > 0 && (
                <div className="glass-card p-5 mb-10">
                  <h2 className="font-semibold text-sm text-slate-400 uppercase tracking-wider mb-3">
                    In This Guide
                  </h2>
                  <nav className="space-y-2">
                    {page.sidebar.toc.map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        className="block text-sm text-slate-300 hover:text-green-400 transition-colors"
                      >
                        {item.label}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              {/* Content */}
              <div className="prose-custom">
                {page.content.map((block, i) => (
                  <ContentBlockRenderer key={i} block={block} />
                ))}
              </div>

              {/* Related Guides */}
              {page.sidebar?.related && page.sidebar.related.length > 0 && (
                <div className="mt-16 pt-8 border-t border-white/5">
                  <h2 className="font-display text-xl font-bold mb-4">Related Guides</h2>
                  <div className="space-y-3">
                    {page.sidebar.related.map((item) => (
                      <Link
                        key={item.slug}
                        href={`/guides/${item.slug}`}
                        className="block glass-card p-4 hover:border-green-500/20 transition-colors"
                      >
                        <span className="text-sm font-medium">{item.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

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
    </>
  );
}
