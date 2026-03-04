import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllSlugs, getPostBySlug } from '@/lib/blog';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import type { Metadata } from 'next';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) return {};

  return {
    title: post.seo_title,
    description: post.meta_description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.seo_title,
      description: post.meta_description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      {/* Article */}
      <article className="pt-28 pb-12 md:pt-32 md:pb-20">
        <div className="container mx-auto px-6 max-w-3xl">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-green-400 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to blog
          </Link>

          {/* Header */}
          <header className="mb-10">
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                {post.author}
              </span>
            </div>
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Content */}
          <div
            className="prose prose-invert prose-slate max-w-none
              prose-headings:font-display prose-headings:font-bold
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-slate-300 prose-p:leading-relaxed
              prose-a:text-green-400 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white
              prose-li:text-slate-300
              prose-blockquote:border-green-500/50 prose-blockquote:text-slate-400
              prose-table:text-sm
              prose-th:text-slate-300 prose-th:border-white/10
              prose-td:border-white/10
              prose-hr:border-white/10"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />

          {/* CTA */}
          <div className="mt-16 glass-card p-8 text-center">
            <h3 className="font-display text-xl font-bold mb-3">
              Ready to protect your affiliate revenue?
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Start monitoring your affiliate links for free. No credit card required.
            </p>
            <Link href="/signup" className="btn-primary text-sm inline-flex">
              Get started free
            </Link>
          </div>
        </div>
      </article>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            datePublished: post.date,
            author: { '@type': 'Person', name: post.author },
            description: post.meta_description,
            publisher: {
              '@type': 'Organization',
              name: 'LinkRescue',
              url: 'https://www.linkrescue.io',
            },
          }),
        }}
      />

      <PublicFooter />
    </div>
  );
}
