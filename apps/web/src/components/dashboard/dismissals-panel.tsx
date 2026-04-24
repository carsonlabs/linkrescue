'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Link as LinkIcon, Globe } from 'lucide-react';

export interface DismissalRow {
  id: string;
  link_id: string | null;
  pattern_host: string | null;
  issue_type: string | null;
  reason: string | null;
  created_at: string;
  link_href: string | null;
}

export function DismissalsPanel({ dismissals }: { dismissals: DismissalRow[] }) {
  const router = useRouter();
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function remove(id: string) {
    setError(null);
    setRemoving((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/issues/dismiss/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || 'Failed to remove');
      }
      startTransition(() => router.refresh());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove');
    } finally {
      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  if (dismissals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No dismissals yet. Click <span className="font-medium">Ignore</span> on any issue to
        suppress alerts for that link or host — they&apos;ll appear here so you can restore them.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
      {dismissals.map((d) => {
        const isHost = d.pattern_host !== null;
        const label = isHost ? d.pattern_host : d.link_href || d.link_id;
        const Icon = isHost ? Globe : LinkIcon;
        return (
          <div
            key={d.id}
            className="flex items-center gap-3 border rounded-lg px-3 py-2 bg-card"
          >
            <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{label}</p>
              <p className="text-xs text-muted-foreground">
                {isHost ? 'Host pattern' : 'Single link'}
                {' · '}
                {d.issue_type ? d.issue_type : 'any issue type'}
                {' · '}
                {new Date(d.created_at).toLocaleDateString()}
                {d.reason ? ` · "${d.reason}"` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => remove(d.id)}
              disabled={removing.has(d.id)}
              className="text-xs px-2 py-1 rounded border hover:bg-accent disabled:opacity-50 flex items-center gap-1"
              aria-label="Restore alerts for this entry"
            >
              <Trash2 className="w-3 h-3" />
              Restore
            </button>
          </div>
        );
      })}
    </div>
  );
}
