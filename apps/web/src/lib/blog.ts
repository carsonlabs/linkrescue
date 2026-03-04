import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const BLOG_DIR = path.join(process.cwd(), '..', '..', 'content', 'blog');

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

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'));

  const posts = files.map((filename) => {
    const slug = filename.replace(/\.md$/, '');
    const filePath = path.join(BLOG_DIR, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContents);

    return {
      slug,
      title: data.title ?? '',
      date: String(data.date ?? ''),
      author: data.author ?? '',
      tags: data.tags ?? [],
      category: data.category ?? '',
      seo_title: data.seo_title ?? data.title ?? '',
      meta_description: data.meta_description ?? '',
    };
  });

  // Sort by date descending
  return posts.sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function getAllSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''));
}

export async function getPostBySlug(slug: string): Promise<BlogPostWithContent | null> {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  const processed = await remark().use(html).process(content);
  const contentHtml = processed.toString();

  return {
    slug,
    title: data.title ?? '',
    date: String(data.date ?? ''),
    author: data.author ?? '',
    tags: data.tags ?? [],
    category: data.category ?? '',
    seo_title: data.seo_title ?? data.title ?? '',
    meta_description: data.meta_description ?? '',
    contentHtml,
  };
}
