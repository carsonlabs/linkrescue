'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield, Info } from 'lucide-react';

export default function NewGuardianLinkPage() {
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [originalUrl, setOriginalUrl] = useState('');
  const [backupUrl, setBackupUrl] = useState('');
  const [valuePerClick, setValuePerClick] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch('/api/guardian', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        original_url: originalUrl,
        backup_url: backupUrl,
        value_per_click_cents: valuePerClick ? Math.round(parseFloat(valuePerClick) * 100) : 0,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(typeof data.error === 'string' ? data.error : 'Failed to create guardian link');
      setLoading(false);
      return;
    }

    router.push('/guardian');
  };

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/guardian"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Guardian Links
      </Link>

      <div className="border bg-card rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">New Guardian Link</h1>
            <p className="text-sm text-muted-foreground">
              Create a backup link that rescues visitors when the original breaks.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="slug" className="block text-sm font-medium mb-1.5">
              Slug
            </label>
            <div className="flex items-center gap-0">
              <span className="px-3 py-2.5 border border-r-0 rounded-l-lg bg-muted text-sm text-muted-foreground">
                /rescue/
              </span>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="my-affiliate-link"
                required
                className="flex-1 px-3 py-2.5 border rounded-r-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <Info className="w-3 h-3 flex-shrink-0" />
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>

          <div>
            <label htmlFor="original_url" className="block text-sm font-medium mb-1.5">
              Original URL
            </label>
            <input
              id="original_url"
              type="url"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              placeholder="https://affiliate.example.com/product?ref=123"
              required
              className="w-full px-3 py-2.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <Info className="w-3 h-3 flex-shrink-0" />
              The affiliate link you want to protect
            </p>
          </div>

          <div>
            <label htmlFor="backup_url" className="block text-sm font-medium mb-1.5">
              Backup URL
            </label>
            <input
              id="backup_url"
              type="url"
              value={backupUrl}
              onChange={(e) => setBackupUrl(e.target.value)}
              placeholder="https://alternative-product.com?ref=123"
              required
              className="w-full px-3 py-2.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <Info className="w-3 h-3 flex-shrink-0" />
              Where visitors go if the original link is broken
            </p>
          </div>

          <div>
            <label htmlFor="value" className="block text-sm font-medium mb-1.5">
              Estimated Value per Click{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <div className="flex items-center gap-0">
              <span className="px-3 py-2.5 border border-r-0 rounded-l-lg bg-muted text-sm text-muted-foreground">
                $
              </span>
              <input
                id="value"
                type="number"
                step="0.01"
                min="0"
                value={valuePerClick}
                onChange={(e) => setValuePerClick(e.target.value)}
                placeholder="0.50"
                className="flex-1 px-3 py-2.5 border rounded-r-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !slug || !originalUrl || !backupUrl}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity text-sm"
          >
            {loading ? 'Creating...' : 'Create Guardian Link'}
          </button>
        </form>
      </div>
    </div>
  );
}
