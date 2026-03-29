'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowLeftRight, Info } from 'lucide-react';

export default function NewRedirectRulePage() {
  const router = useRouter();
  const [fromUrl, setFromUrl] = useState('');
  const [toUrl, setToUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch('/api/redirect-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from_url: fromUrl,
        to_url: toUrl,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(typeof data.error === 'string' ? data.error : 'Failed to create redirect rule');
      setLoading(false);
      return;
    }

    router.push('/redirect-rules');
  };

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/redirect-rules"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Redirect Rules
      </Link>

      <div className="border bg-card rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
            <ArrowLeftRight className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">New Redirect Rule</h1>
            <p className="text-sm text-muted-foreground">
              Redirect a broken URL to a working destination.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="from_url" className="block text-sm font-medium mb-1.5">
              From URL (broken)
            </label>
            <input
              id="from_url"
              type="text"
              value={fromUrl}
              onChange={(e) => setFromUrl(e.target.value)}
              placeholder="/old-product-page or https://example.com/dead-link"
              required
              className="w-full px-3 py-2.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <Info className="w-3 h-3 flex-shrink-0" />
              The broken URL that needs to be redirected
            </p>
          </div>

          <div className="flex justify-center py-1">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4 text-muted-foreground rotate-90" />
            </div>
          </div>

          <div>
            <label htmlFor="to_url" className="block text-sm font-medium mb-1.5">
              To URL (destination)
            </label>
            <input
              id="to_url"
              type="url"
              value={toUrl}
              onChange={(e) => setToUrl(e.target.value)}
              placeholder="https://new-product.example.com?ref=123"
              required
              className="w-full px-3 py-2.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <Info className="w-3 h-3 flex-shrink-0" />
              The working URL visitors should be sent to
            </p>
          </div>

          <div className="bg-accent/50 border rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              Rules start as <span className="font-medium text-foreground">drafts</span>. Submit for approval, then deploy when ready.
            </p>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !fromUrl || !toUrl}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity text-sm"
          >
            {loading ? 'Creating...' : 'Create Redirect Rule'}
          </button>
        </form>
      </div>
    </div>
  );
}
