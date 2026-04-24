'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { IssueType } from '@linkrescue/types';

interface Issue {
  id: string;
  issue_type: IssueType;
  status_code: number | null;
  final_url: string | null;
  redirect_hops: number;
  checked_at: string;
  link: {
    id: string;
    href: string;
    is_affiliate: boolean;
    page: {
      url: string;
    };
  };
}

function hostFromHref(href: string): string | null {
  try {
    return new URL(href).hostname.toLowerCase();
  } catch {
    return null;
  }
}

const ISSUE_LABELS: Record<string, { label: string; color: string }> = {
  BROKEN_4XX: { label: '4xx Broken', color: 'bg-red-100 text-red-800' },
  SERVER_5XX: { label: '5xx Server Error', color: 'bg-orange-100 text-orange-800' },
  TIMEOUT: { label: 'Timeout', color: 'bg-yellow-100 text-yellow-800' },
  REDIRECT_TO_HOME: { label: 'Redirect to Home', color: 'bg-purple-100 text-purple-800' },
  LOST_PARAMS: { label: 'Lost Params', color: 'bg-blue-100 text-blue-800' },
};

const ISSUE_TYPES = ['BROKEN_4XX', 'SERVER_5XX', 'TIMEOUT', 'REDIRECT_TO_HOME', 'LOST_PARAMS'];

export function IssuesTable({
  issues,
  siteId: _siteId,
}: {
  issues: Issue[];
  siteId: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [dismissing, setDismissing] = useState<Set<string>>(new Set());
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const visibleIssues = useMemo(
    () => issues.filter((issue) => !hidden.has(issue.id)),
    [issues, hidden],
  );

  const filtered = visibleIssues.filter((issue) => {
    if (filter && issue.issue_type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        issue.link.href.toLowerCase().includes(q) ||
        issue.link.page.url.toLowerCase().includes(q)
      );
    }
    return true;
  });

  async function dismissIssue(issue: Issue, scope: 'single' | 'host') {
    setError(null);
    setDismissing((prev) => new Set(prev).add(issue.id));

    try {
      const res = await fetch('/api/issues/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkId: issue.link.id,
          scope,
          issueType: issue.issue_type,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || 'Failed to dismiss');
      }

      if (scope === 'host') {
        const host = hostFromHref(issue.link.href);
        setHidden((prev) => {
          const next = new Set(prev);
          for (const i of issues) {
            if (
              i.issue_type === issue.issue_type &&
              hostFromHref(i.link.href) === host
            ) {
              next.add(i.id);
            }
          }
          return next;
        });
      } else {
        setHidden((prev) => new Set(prev).add(issue.id));
      }

      startTransition(() => router.refresh());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss');
    } finally {
      setDismissing((prev) => {
        const next = new Set(prev);
        next.delete(issue.id);
        return next;
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('')}
          className={`text-xs px-3 py-1 rounded-full border ${
            filter === '' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
          }`}
        >
          All ({issues.length})
        </button>
        {ISSUE_TYPES.map((type) => {
          const count = issues.filter((i) => i.issue_type === type).length;
          if (count === 0) return null;
          const info = ISSUE_LABELS[type];
          return (
            <button
              key={type}
              onClick={() => setFilter(filter === type ? '' : type)}
              className={`text-xs px-3 py-1 rounded-full border ${
                filter === type ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              }`}
            >
              {info.label} ({count})
            </button>
          );
        })}
      </div>

      <input
        type="text"
        placeholder="Search links..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2 border rounded-md bg-background text-sm"
      />

      {error && (
        <p className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm py-4 text-center">No issues found.</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Link</th>
                <th className="text-left p-3 font-medium">Found On</th>
                <th className="text-left p-3 font-medium">Issue</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Affiliate</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((issue) => {
                const info = ISSUE_LABELS[issue.issue_type] || {
                  label: issue.issue_type,
                  color: 'bg-gray-100 text-gray-800',
                };
                const host = hostFromHref(issue.link.href);
                const isDismissing = dismissing.has(issue.id);
                return (
                  <tr key={issue.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 max-w-xs truncate">
                      <a
                        href={issue.link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {issue.link.href}
                      </a>
                    </td>
                    <td className="p-3 max-w-xs truncate text-muted-foreground">
                      {issue.link.page.url}
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${info.color}`}>
                        {info.label}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {issue.status_code || '—'}
                    </td>
                    <td className="p-3">
                      {issue.link.is_affiliate && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          Affiliate
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => dismissIssue(issue, 'single')}
                        disabled={isDismissing}
                        className="text-xs px-2 py-1 rounded border hover:bg-accent disabled:opacity-50"
                        title="Stop alerting on this link"
                      >
                        Ignore
                      </button>
                      {host && (
                        <button
                          type="button"
                          onClick={() => dismissIssue(issue, 'host')}
                          disabled={isDismissing}
                          className="ml-1 text-xs px-2 py-1 rounded border hover:bg-accent disabled:opacity-50"
                          title={`Stop alerting on ${info.label} for all ${host} links`}
                        >
                          Ignore {host}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
