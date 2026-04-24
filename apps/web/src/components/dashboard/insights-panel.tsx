'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, TrendingUp, ShieldAlert, Sparkles, X, Share2, Check } from 'lucide-react';

export type InsightKind = 'summary' | 'recommendation' | 'alert_suppression' | 'program_risk';

export interface CuratorInsight {
  id: string;
  kind: InsightKind;
  headline: string;
  body: string | null;
  created_at: string;
}

const KIND_META: Record<InsightKind, { label: string; Icon: typeof Brain; color: string }> = {
  summary: { label: 'Summary', Icon: Sparkles, color: 'text-blue-400 bg-blue-500/10' },
  recommendation: { label: 'Recommendation', Icon: Brain, color: 'text-purple-400 bg-purple-500/10' },
  alert_suppression: {
    label: 'Auto-suppressed',
    Icon: TrendingUp,
    color: 'text-amber-400 bg-amber-500/10',
  },
  program_risk: { label: 'Program risk', Icon: ShieldAlert, color: 'text-red-400 bg-red-500/10' },
};

export function InsightsPanel({ insights }: { insights: CuratorInsight[] }) {
  const router = useRouter();
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function share(id: string) {
    const url = `${window.location.origin}/i/${id}`;
    try {
      if (navigator.share) {
        await navigator.share({ url, title: 'LinkRescue Curator insight' });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(id);
        setTimeout(() => setCopied((c) => (c === id ? null : c)), 1800);
      }
    } catch {
      // user cancelled or share failed; fall back to clipboard
      try {
        await navigator.clipboard.writeText(url);
        setCopied(id);
        setTimeout(() => setCopied((c) => (c === id ? null : c)), 1800);
      } catch {
        setError('Could not copy link');
      }
    }
  }

  const visible = insights.filter((i) => !hidden.has(i.id));
  if (visible.length === 0) return null;

  async function dismiss(id: string) {
    setError(null);
    setHidden((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/insights/${id}/dismiss`, { method: 'POST' });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || 'Failed to dismiss');
      }
      startTransition(() => router.refresh());
    } catch (err: unknown) {
      setHidden((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setError(err instanceof Error ? err.message : 'Failed to dismiss');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-lg flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          Curator insights
        </h2>
        <span className="text-xs text-slate-500">Updated weekly</span>
      </div>
      {error && (
        <p className="text-xs text-red-400 mb-2" role="alert">
          {error}
        </p>
      )}
      <div className="space-y-3">
        {visible.map((insight) => {
          const meta = KIND_META[insight.kind];
          const Icon = meta.Icon;
          return (
            <div
              key={insight.id}
              className="glass-card p-4 flex items-start gap-4 group"
            >
              <div
                className={`w-9 h-9 rounded-xl ${meta.color} flex items-center justify-center flex-shrink-0`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                    {meta.label}
                  </span>
                  <span className="text-[10px] text-slate-600">
                    {new Date(insight.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className="font-medium text-sm leading-snug">{insight.headline}</p>
                {insight.body && (
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{insight.body}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => share(insight.id)}
                  aria-label="Copy shareable link"
                  title={copied === insight.id ? 'Copied!' : 'Copy shareable link'}
                  className="text-slate-600 hover:text-slate-300 transition-colors p-1"
                >
                  {copied === insight.id ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => dismiss(insight.id)}
                  aria-label="Dismiss insight"
                  className="text-slate-600 hover:text-slate-300 transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
