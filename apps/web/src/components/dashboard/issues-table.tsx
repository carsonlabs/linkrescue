'use client';

import { useState } from 'react';
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
  siteId,
}: {
  issues: Issue[];
  siteId: string;
}) {
  const [filter, setFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const filtered = issues.filter((issue) => {
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
              </tr>
            </thead>
            <tbody>
              {filtered.map((issue) => {
                const info = ISSUE_LABELS[issue.issue_type] || {
                  label: issue.issue_type,
                  color: 'bg-gray-100 text-gray-800',
                };
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
