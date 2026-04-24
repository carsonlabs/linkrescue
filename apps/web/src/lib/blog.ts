import { createClient } from '@supabase/supabase-js';
import { remark } from 'remark';
import html from 'remark-html';

// CMS lives in the AgentReady Supabase project
const CMS_URL = process.env.CMS_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const CMS_KEY = process.env.CMS_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SITE_SLUG = 'linkrescue';

const cms = createClient(CMS_URL, CMS_KEY);

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  author: string;
  tags: string[];
  category: string;
  seo_title: string;
  meta_description: string;
}

export interface BlogPostWithContent extends BlogPost {
  contentHtml: string;
}

export async function getAllPosts(): Promise<BlogPost[]> {
  const { data, error } = await cms
    .from('blog_posts')
    .select('slug, title, published_at, author, tags, category, seo_title, meta_description')
    .eq('status', 'published')
    .contains('sites', [SITE_SLUG])
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false });

  if (error) {
    console.error('[CMS] getAllPosts error:', error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    slug: row.slug,
    title: row.title,
    date: row.published_at ?? '',
    author: row.author ?? 'LinkRescue Team',
    tags: row.tags ?? [],
    category: row.category ?? '',
    seo_title: row.seo_title ?? row.title,
    meta_description: row.meta_description ?? '',
  }));
}

export async function getAllSlugs(): Promise<string[]> {
  const { data, error } = await cms
    .from('blog_posts')
    .select('slug')
    .eq('status', 'published')
    .contains('sites', [SITE_SLUG])
    .lte('published_at', new Date().toISOString());

  if (error) {
    console.error('[CMS] getAllSlugs error:', error.message);
    return [];
  }
  return (data ?? []).map((p) => p.slug);
}

export async function getPostBySlug(slug: string): Promise<BlogPostWithContent | null> {
  const { data, error } = await cms
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .contains('sites', [SITE_SLUG])
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[CMS] getPostBySlug error:', error.message);
    }
    return null;
  }

  const processed = await remark().use(html).process(data.content ?? '');
  const contentHtml = processed.toString();

  return {
    slug: data.slug,
    title: data.title,
    date: data.published_at ?? '',
    author: data.author ?? 'LinkRescue Team',
    tags: data.tags ?? [],
    category: data.category ?? '',
    seo_title: data.seo_title ?? data.title,
    meta_description: data.meta_description ?? '',
    contentHtml,
  };
}
