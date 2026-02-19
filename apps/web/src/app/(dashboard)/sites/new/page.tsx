'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Add a New Site</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="domain" className="block text-sm font-medium mb-1">
            Domain
          </label>
          <input
            id="domain"
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            required
            className="w-full px-3 py-2 border rounded-md bg-background"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Enter the domain without http:// or trailing slashes
          </p>
        </div>
        <div>
          <label htmlFor="sitemap" className="block text-sm font-medium mb-1">
            Sitemap URL (optional)
          </label>
          <input
            id="sitemap"
            type="url"
            value={sitemapUrl}
            onChange={(e) => setSitemapUrl(e.target.value)}
            placeholder="https://example.com/sitemap.xml"
            className="w-full px-3 py-2 border rounded-md bg-background"
          />
        </div>
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground py-2 rounded-md font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Site'}
        </button>
      </form>
    </div>
  );
}
