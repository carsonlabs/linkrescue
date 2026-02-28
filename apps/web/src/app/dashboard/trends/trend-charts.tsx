'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HealthScoreGauge } from '@/components/dashboard/health-score-gauge';

interface TrendChartsProps {
  healthChartData: Array<{ date: string; score: number }>;
  brokenChartData: Array<{ month: string; count: number }>;
  topRotPrograms: Array<{ domain: string; total: number; broken: number }>;
  siteScores: Array<{ domain: string; siteId: string; score: number | null }>;
}

type TimeRange = '30' | '60' | '90';

export function TrendCharts({
  healthChartData,
  brokenChartData,
  topRotPrograms,
  siteScores,
}: TrendChartsProps) {
  const [range, setRange] = useState<TimeRange>('30');

  // Filter health data by range
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - parseInt(range));
  const filteredHealth = healthChartData.filter(
    (d) => new Date(d.date) >= cutoffDate
  );

  const maxScore = 100;
  const maxBroken = Math.max(...brokenChartData.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Health Score Over Time */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-semibold text-lg">Health Score Over Time</h2>
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            {(['30', '60', '90'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  range === r
                    ? 'bg-green-500 text-slate-900'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r}d
              </button>
            ))}
          </div>
        </div>

        {filteredHealth.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No health score data for this period yet.
          </div>
        ) : (
          <div className="h-48 flex items-end gap-[2px]">
            {filteredHealth.map((d, i) => {
              const height = (d.score / maxScore) * 100;
              const color =
                d.score >= 80 ? 'bg-green-500' :
                d.score >= 60 ? 'bg-yellow-500' :
                d.score >= 40 ? 'bg-orange-500' : 'bg-red-500';
              return (
                <div
                  key={i}
                  className="flex-1 min-w-[3px] group relative"
                  title={`${d.date}: ${d.score}`}
                >
                  <div
                    className={`${color} rounded-t-sm transition-all hover:opacity-80`}
                    style={{ height: `${height}%` }}
                  />
                </div>
              );
            })}
          </div>
        )}
        <div className="flex justify-between mt-2 text-xs text-slate-600">
          <span>{filteredHealth[0]?.date ?? ''}</span>
          <span>{filteredHealth[filteredHealth.length - 1]?.date ?? ''}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Broken Links Per Month */}
        <div className="glass-card p-6">
          <h2 className="font-display font-semibold text-lg mb-6">Broken Links by Month</h2>
          {brokenChartData.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No data yet.
            </div>
          ) : (
            <div className="space-y-3">
              {brokenChartData.map((d) => (
                <div key={d.month} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-16 flex-shrink-0">
                    {new Date(d.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                  </span>
                  <div className="flex-1 h-6 bg-white/5 rounded-md overflow-hidden">
                    <div
                      className="h-full bg-red-500/60 rounded-md transition-all"
                      style={{ width: `${(d.count / maxBroken) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-10 text-right">{d.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Per-Site Health Scores */}
        <div className="glass-card p-6">
          <h2 className="font-display font-semibold text-lg mb-6">Site Health</h2>
          {siteScores.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No sites with health data.
            </div>
          ) : (
            <div className="space-y-3">
              {siteScores.map((s) => (
                <Link
                  key={s.siteId}
                  href={`/dashboard/sites/${s.siteId}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <HealthScoreGauge score={s.score ?? 0} size="sm" />
                  <span className="text-sm font-medium truncate flex-1">{s.domain}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Affiliate Program Link Rot Table */}
      {topRotPrograms.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="font-display font-semibold text-lg mb-4">
            Affiliate Programs with Most Link Rot
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-3 text-slate-400 font-medium">Program Domain</th>
                  <th className="text-right py-3 px-3 text-slate-400 font-medium">Broken Links</th>
                  <th className="text-right py-3 px-3 text-slate-400 font-medium">Rot Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {topRotPrograms.map((p) => (
                  <tr key={p.domain}>
                    <td className="py-3 px-3 font-medium">{p.domain}</td>
                    <td className="py-3 px-3 text-right text-red-400">{p.broken}</td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          p.broken / p.total > 0.1
                            ? 'bg-red-500/20 text-red-400'
                            : p.broken / p.total > 0.05
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-green-500/20 text-green-400'
                        }`}
                      >
                        {((p.broken / p.total) * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
