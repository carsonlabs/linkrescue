import Link from 'next/link';
import { Shield, TrendingUp, TrendingDown, Heart, AlertTriangle, Brain, Lock, ArrowRight } from 'lucide-react';
import {
  formatCentsWhole,
  formatCents,
  monthOverMonthDelta,
  type UserScoreboard,
} from '@linkrescue/types';
import type { CuratorInsight } from './insights-panel';

interface ScoreboardHeroProps {
  scoreboard: UserScoreboard | null;
  plan: 'free' | 'pro' | 'agency';
  /** Optional curator pick — first recommendation insight */
  curatorPick?: CuratorInsight | null;
}

export function ScoreboardHero({ scoreboard, plan, curatorPick }: ScoreboardHeroProps) {
  const protectedCents = scoreboard?.revenue_protected_cents ?? 0;
  const lastMonthCents = scoreboard?.revenue_protected_last_month_cents ?? 0;
  const issuesCaught = scoreboard?.issues_caught_this_month ?? 0;
  const issuesResolved = scoreboard?.issues_resolved_this_month ?? 0;
  const healthScore = scoreboard?.avg_health_score_7d ?? null;
  const topProgram = scoreboard?.top_at_risk_program ?? null;
  const topProgramCount = scoreboard?.top_program_issue_count ?? 0;

  const delta = monthOverMonthDelta(protectedCents, lastMonthCents);
  const isFree = plan === 'free';
  const hasData = (scoreboard?.issues_caught_this_month ?? 0) > 0 || protectedCents > 0;

  const monthLabel = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Empty state — first-time user, no scans yet
  if (!hasData) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-green-500/5 via-slate-900/50 to-purple-500/5 p-6 md:p-8">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" aria-hidden />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
              Your scoreboard
            </p>
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
              Starts the moment we catch your first issue.
            </h2>
            <p className="text-sm text-slate-400 max-w-md">
              Run a scan to see commissions protected, issues caught, and Curator picks — all in one place.
            </p>
          </div>
          <Link href="/dashboard/sites" className="btn-primary whitespace-nowrap flex-shrink-0">
            Run a scan now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-green-500/5 via-slate-900/50 to-purple-500/5">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" aria-hidden />

      <div className="relative p-6 md:p-8">
        {/* Header row: month label */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-400" />
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              This month · {monthLabel}
            </p>
          </div>
          {scoreboard && scoreboard.revenue_protected_all_time_cents > 0 && (
            <p className="text-[11px] text-slate-500">
              All-time: <span className="text-slate-300 font-mono">
                {formatCents(scoreboard.revenue_protected_all_time_cents)}
              </span>
            </p>
          )}
        </div>

        {/* Hero number row */}
        <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-8 mb-6">
          <div className="flex-1">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span
                className={`font-display text-5xl md:text-6xl font-bold ${
                  isFree ? 'blur-md select-none' : 'text-gradient'
                }`}
                aria-label={
                  isFree ? 'Hidden — upgrade to Pro' : `${formatCents(protectedCents)} protected`
                }
              >
                {isFree ? '$•••••' : formatCentsWhole(protectedCents)}
              </span>
              {!isFree && delta && (
                <DeltaBadge delta={delta} />
              )}
            </div>
            <p className="text-sm text-slate-400 mt-2">
              {isFree
                ? 'Pro unlocks revenue tracking — see what your sites are losing.'
                : 'in affiliate commissions protected'}
            </p>
          </div>

          {isFree && (
            <Link href="/pricing" className="btn-primary flex-shrink-0">
              <Lock className="w-4 h-4" />
              Unlock revenue tracking
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 pt-6 border-t border-white/5">
          <StatPill
            icon={Shield}
            iconColor="text-blue-400"
            label="Issues caught"
            value={String(issuesCaught)}
          />
          <StatPill
            icon={TrendingUp}
            iconColor="text-green-400"
            label="Fixed"
            value={String(issuesResolved)}
            sub={
              issuesCaught > 0
                ? `${Math.round((issuesResolved / issuesCaught) * 100)}% rate`
                : undefined
            }
          />
          <StatPill
            icon={Heart}
            iconColor={
              healthScore === null
                ? 'text-slate-500'
                : healthScore >= 80
                  ? 'text-green-400'
                  : healthScore >= 60
                    ? 'text-yellow-400'
                    : 'text-red-400'
            }
            label="Health (7d)"
            value={healthScore !== null ? String(healthScore) : '—'}
            sub={healthScore !== null ? '/ 100' : undefined}
          />
          <StatPill
            icon={AlertTriangle}
            iconColor="text-amber-400"
            label="Top risk"
            value={topProgram ?? '—'}
            sub={topProgramCount > 0 ? `${topProgramCount} in 7d` : undefined}
            valueSize="small"
          />
        </div>

        {/* Curator pick row */}
        {curatorPick && (
          <Link
            href={`/dashboard/sites`}
            className="mt-5 flex items-start gap-3 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 hover:border-purple-500/40 hover:bg-purple-500/10 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <Brain className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-purple-300 font-semibold mb-1">
                Curator&apos;s pick
              </p>
              <p className="text-sm text-slate-200 leading-snug">{curatorPick.headline}</p>
              {curatorPick.body && (
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{curatorPick.body}</p>
              )}
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-300 transition-colors flex-shrink-0 mt-1" />
          </Link>
        )}
      </div>
    </div>
  );
}

function DeltaBadge({ delta }: { delta: { sign: 'up' | 'down' | 'flat'; pct: number; absCents: number } }) {
  if (delta.sign === 'flat') {
    return <span className="text-xs text-slate-500">— flat vs last month</span>;
  }
  const isUp = delta.sign === 'up';
  const Icon = isUp ? TrendingUp : TrendingDown;
  const color = isUp ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${color}`}>
      <Icon className="w-3 h-3" />
      {isUp ? '+' : '−'}
      {formatCents(Math.abs(delta.absCents))} vs last month
    </span>
  );
}

interface StatPillProps {
  icon: typeof Shield;
  iconColor: string;
  label: string;
  value: string;
  sub?: string;
  valueSize?: 'normal' | 'small';
}

function StatPill({ icon: Icon, iconColor, label, value, sub, valueSize = 'normal' }: StatPillProps) {
  const valueClass = valueSize === 'small' ? 'text-base font-semibold' : 'font-display text-2xl font-bold';
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3 md:p-4">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{label}</p>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`${valueClass} truncate`}>{value}</span>
        {sub && <span className="text-[10px] text-slate-500 truncate">{sub}</span>}
      </div>
    </div>
  );
}
