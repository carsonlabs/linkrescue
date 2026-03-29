'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Tag, Info, X } from 'lucide-react';

export default function NewOfferPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [topic, setTopic] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [estimatedValue, setEstimatedValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch('/api/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        url,
        topic: topic || '',
        tags,
        estimated_value_cents: estimatedValue ? Math.round(parseFloat(estimatedValue) * 100) : 0,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(typeof data.error === 'string' ? data.error : 'Failed to create offer');
      setLoading(false);
      return;
    }

    router.push('/offers');
  };

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/offers"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Offers
      </Link>

      <div className="border bg-card rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
            <Tag className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Add Offer</h1>
            <p className="text-sm text-muted-foreground">
              Add a replacement link that can be matched to broken URLs.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1.5">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Product Name — Affiliate Link"
              required
              className="w-full px-3 py-2.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label htmlFor="url" className="block text-sm font-medium mb-1.5">
              Offer URL
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://affiliate.example.com/product?ref=123"
              required
              className="w-full px-3 py-2.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label htmlFor="topic" className="block text-sm font-medium mb-1.5">
              Topic{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. creatine, hosting, email-marketing"
              className="w-full px-3 py-2.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <Info className="w-3 h-3 flex-shrink-0" />
              Used to match this offer to broken links in the same category
            </p>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium mb-1.5">
              Tags{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <div className="flex gap-2">
              <input
                id="tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Add a tag and press Enter"
                className="flex-1 px-3 py-2.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2.5 border rounded-lg text-sm hover:bg-muted transition-colors"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent rounded text-xs font-medium"
                  >
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
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
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
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
            disabled={loading || !title || !url}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity text-sm"
          >
            {loading ? 'Creating...' : 'Add Offer'}
          </button>
        </form>
      </div>
    </div>
  );
}
