import { createAdminClient } from '@linkrescue/database';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Brain, TrendingUp, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Kind = 'summary' | 'recommendation' | 'alert_suppression' | 'program_risk';

interface PublicInsight {
  id: string;
  kind: Kind;
  headline: string;
  body: string | null;
  created_at: string;
}

async function fetchInsight(id: string): Promise<PublicInsight | null> {
  // Service role bypasses RLS — safe here because the insight shape doesn't
  // contain user PII (no email, no domain, no user_id in the payload). UUIDs
  // are unguessable, so the URL itself acts as the access token.
  const admin = createAdminClient();
  const { data } = await admin
    .from('curator_insights')
    .select('id, kind, headline, body, created_at')
    .eq('id', id)
    .single();
  return (data as PublicInsight | null) ?? null;
}

const KIND_META: Record<Kind, { label: string; accent: string }> = {
  summary: { label: 'Summary', accent: 'text-blue-400' },
  recommendation: { label: 'Recommendation', accent: 'text-purple-400' },
  alert_suppression: { label: 'Auto-suppressed', accent: 'text-amber-400' },
  program_risk: { label: 'Program risk', accent: 'text-red-400' },
};

const KIND_ICON: Record<Kind, typeof Brain> = {
  summary: Sparkles,
  recommendation: Brain,
  alert_suppression: TrendingUp,
  program_risk: ShieldAlert,
};

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const insight = await fetchInsight(params.id);
  if (!insight) {
    return { title: 'Insight not found · LinkRescue' };
  }
  return {
    title: `${insight.headline} · LinkRescue Curator`,
    description:
      insight.body?.slice(0, 160) ??
      'Weekly insight from the LinkRescue Curator — your per-site AI analyst for affiliate link health.',
    openGraph: {
      title: insight.headline,
      description: insight.body ?? undefined,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: insight.headline,
      description: insight.body ?? undefined,
    },
  };
}

export default async function PublicInsightPage({ params }: { params: { id: string } }) {
  const insight = await fetchInsight(params.id);
  if (!insight) notFound();

  const meta = KIND_META[insight.kind];
  const Icon = KIND_ICON[insight.kind];
  const date = new Date(insight.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-slate-100 flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <div className="glass-card p-8 md:p-10 border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${meta.accent}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-[10px] uppercase tracking-wider font-semibold ${meta.accent}`}>
                {meta.label}
              </p>
              <p className="text-xs text-slate-500">{date}</p>
            </div>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold leading-tight mb-4">
            {insight.headline}
          </h1>
          {insight.body && (
            <p className="text-slate-300 leading-relaxed">{insight.body}</p>
          )}
          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-green-400 to-purple-500" />
              <span className="text-sm font-semibold">LinkRescue Curator</span>
            </div>
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1"
            >
              What is this?
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
        <p className="text-center text-xs text-slate-600 mt-6">
          Weekly AI insights from{' '}
          <Link href="/" className="underline hover:text-slate-400">
            linkrescue.io
          </Link>{' '}
          — your per-site analyst for affiliate link health.
        </p>
      </div>
    </div>
  );
}
