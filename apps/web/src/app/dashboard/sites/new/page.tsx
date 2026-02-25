'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Globe, Info } from 'lucide-react';

export default function AddSitePage() {
  const router = useRouter();
  const [domain, setDomain] = useState('');
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch('/api/sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain,
        sitemap_url: sitemapUrl || null,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(typeof data.error === 'string' ? data.error : 'Failed to create site');
      setLoading(false);
      return;
    }

    router.push(`/sites/${data.id}`);
  };

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/sites"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to sites
      </Link>

      <div className="border bg-card rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Add a New Site</h1>
            <p className="text-sm text-muted-foreground">
              We&apos;ll start scanning once you verify ownership.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="domain" className="block text-sm font-medium mb-1.5">
              Domain
            </label>
            <input
              id="domain"
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              required
              className="w-full px-3 py-2.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <Info className="w-3 h-3 flex-shrink-0" />
              Enter the domain without http:// or trailing slashes
            </p>
          </div>

          <div>
            <label htmlFor="sitemap" className="block text-sm font-medium mb-1.5">
              Sitemap URL{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              id="sitemap"
              type="url"
              value={sitemapUrl}
              onChange={(e) => setSitemapUrl(e.target.value)}
              placeholder="https://example.com/sitemap.xml"
              className="w-full px-3 py-2.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <Info className="w-3 h-3 flex-shrink-0" />
              If omitted, we&apos;ll try /sitemap.xml and /sitemap_index.xml automatically
            </p>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !domain}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity text-sm"
          >
            {loading ? 'Adding site...' : 'Add Site'}
          </button>
        </form>
      </div>
    </div>
  );
}
