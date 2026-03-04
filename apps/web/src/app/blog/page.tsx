import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';
import { ArrowRight, Calendar, Tag } from 'lucide-react';
import type { Metadata } from 'next';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';

export const metadata: Metadata = {
  title: 'Blog — Affiliate Link Monitoring Tips & Insights',
  description:
    'Learn how to protect your affiliate revenue from broken links, link rot, and silent attribution failures. Guides, case studies, and actionable tips.',
  alternates: { canonical: 'https://www.linkrescue.io/blog' },
  openGraph: {
    title: 'LinkRescue Blog — Affiliate Link Monitoring Tips & Insights',
    description:
      'Learn how to protect your affiliate revenue from broken links, link rot, and silent attribution failures.',
    url: 'https://www.linkrescue.io/blog',
    siteName: 'LinkRescue',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LinkRescue Blog — Affiliate Link Monitoring Tips & Insights',
    description:
      'Learn how to protect your affiliate revenue from broken links, link rot, and silent attribution failures.',
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      {/* Header */}
      <section className="pt-28 pb-8 md:pt-32 md:pb-12">
        <div className="container mx-auto px-6 max-w-4xl">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            The LinkRescue <span className="text-gradient">Blog</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            Tips, guides, and case studies on protecting your affiliate revenue from broken links and link rot.
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className="pb-24">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="space-y-8">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block glass-card p-6 md:p-8 group hover:border-green-500/30 transition-all"
              >
                <div className="flex items-center gap-3 text-sm text-slate-500 mb-3">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(post.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    {post.category}
                  </span>
                </div>
                <h2 className="font-display text-xl md:text-2xl font-bold mb-3 group-hover:text-green-400 transition-colors">
                  {post.title}
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  {post.meta_description}
                </p>
                <span className="text-green-400 text-sm font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  Read more <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
