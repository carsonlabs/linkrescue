import { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/blog';

const BASE = 'https://www.linkrescue.io';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${BASE}/pricing`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE}/affiliate-link-revenue-calculator`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE}/link-checker`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/affiliates`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE}/guides`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Blog posts from CMS
  const posts = await getAllPosts();
  const blogPosts: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Blog index
  const blogIndex: MetadataRoute.Sitemap = [
    {
      url: `${BASE}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // Dynamic SEO pages from database
  let seoPages: MetadataRoute.Sitemap = [];
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return [...staticPages, ...blogIndex, ...blogPosts];
    }
    const { createAdminClient } = await import('@linkrescue/database');
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('seo_pages')
      .select('slug, page_type, updated_at')
      .eq('status', 'published');

    if (data) {
      seoPages = data.map((page) => {
        const prefix =
          page.page_type === 'network_check'
            ? '/check'
            : page.page_type === 'comparison'
              ? '/vs'
              : '/guides';
        return {
          url: `${BASE}${prefix}/${page.slug}`,
          lastModified: new Date(page.updated_at),
          changeFrequency: 'monthly' as const,
          priority: 0.8,
        };
      });
    }
  } catch {
    // If database is unavailable, return static pages only
  }

  return [...staticPages, ...blogIndex, ...blogPosts, ...seoPages];
}
