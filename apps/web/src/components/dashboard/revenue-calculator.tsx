'use client';

import { useState, useMemo } from 'react';
import { DollarSign, TrendingDown, TrendingUp, Calculator, Sparkles } from 'lucide-react';

interface RevenueCalculatorProps {
  brokenLinkCount?: number;
}

// Preset scenarios for different affiliate types
const PRESETS = [
  {
    name: 'Amazon Affiliate (Physical)',
    monthlyPageViews: 50000,
    ctrPercent: 3,
    conversionPercent: 8,
    commissionPerSale: 12,
    description: 'Typical for review sites promoting physical products'
  },
  {
    name: 'Software/SAAS',
    monthlyPageViews: 20000,
    ctrPercent: 5,
    conversionPercent: 4,
    commissionPerSale: 50,
    description: 'Higher commissions, lower volume'
  },
  {
    name: 'Niche Blogger (Small)',
    monthlyPageViews: 10000,
    ctrPercent: 2.5,
    conversionPercent: 5,
    commissionPerSale: 15,
    description: 'Starting out, building traffic'
  },
  {
    name: 'Authority Site',
    monthlyPageViews: 200000,
    ctrPercent: 4,
    conversionPercent: 6,
    commissionPerSale: 20,
    description: 'Established site with strong SEO'
  }
];

export function RevenueCalculator({ brokenLinkCount = 0 }: RevenueCalculatorProps) {
  const [monthlyPageViews, setMonthlyPageViews] = useState<number>(50000);
  const [ctrPercent, setCtrPercent] = useState<number>(3);
  const [commissionPerSale, setCommissionPerSale] = useState<number>(12);
  const [conversionPercent, setConversionPercent] = useState<number>(8);
  const [showPresets, setShowPresets] = useState(false);

  // Calculate metrics
  const monthlyClicks = monthlyPageViews * (ctrPercent / 100);
  const monthlyConversions = monthlyClicks * (conversionPercent / 100);
  const monthlyRevenue = monthlyConversions * commissionPerSale;
  const annualRevenue = monthlyRevenue * 12;

  // Revenue at risk calculation
  // Assume each broken link affects a portion of traffic
  // Conservative: each broken link = 5% of affected page's revenue
  const riskPerLink = 0.05;
  const totalRiskPercent = Math.min(brokenLinkCount * riskPerLink * 100, 40); // Cap at 40%
  const monthlyLostRevenue = monthlyRevenue * (totalRiskPercent / 100);
  const annualLostRevenue = monthlyLostRevenue * 12;

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setMonthlyPageViews(preset.monthlyPageViews);
    setCtrPercent(preset.ctrPercent);
    setConversionPercent(preset.conversionPercent);
    setCommissionPerSale(preset.commissionPerSale);
    setShowPresets(false);
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount.toFixed(0)}`;
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <Calculator className="w-5 h-5 text-green-400" />
              Revenue Impact Calculator
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              See how much broken links are costing you
            </p>
          </div>
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            {showPresets ? 'Hide Presets' : 'Use Preset'}
          </button>
        </div>
      </div>

      {/* Presets */}
      {showPresets && (
        <div className="p-4 border-b border-white/5 bg-slate-800/30">
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className="text-left p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
              >
                <div className="text-sm font-medium text-white">{preset.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Input Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 flex justify-between">
              Monthly Page Views
              <span className="text-slate-600">{monthlyPageViews.toLocaleString()}</span>
            </label>
            <input
              type="range"
              min="1000"
              max="500000"
              step="1000"
              value={monthlyPageViews}
              onChange={(e) => setMonthlyPageViews(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-400"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 flex justify-between">
              Click-Through Rate
              <span className="text-slate-600">{ctrPercent}%</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={ctrPercent}
              onChange={(e) => setCtrPercent(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-400"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 flex justify-between">
              Avg Commission
              <span className="text-slate-600">${commissionPerSale}</span>
            </label>
            <input
              type="range"
              min="1"
              max="200"
              step="1"
              value={commissionPerSale}
              onChange={(e) => setCommissionPerSale(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-400"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 flex justify-between">
              Conversion Rate
              <span className="text-slate-600">{conversionPercent}%</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="20"
              step="0.1"
              value={conversionPercent}
              onChange={(e) => setConversionPercent(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-400"
            />
          </div>
        </div>

        {/* Main Results */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs font-medium text-green-400 uppercase tracking-wide">
                Annual Revenue
              </span>
            </div>
            <div className="text-3xl font-bold font-display text-white">
              {formatCurrency(annualRevenue)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {monthlyConversions.toFixed(0)} sales/month @ ${commissionPerSale}
            </div>
          </div>

          {brokenLinkCount > 0 ? (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-xs font-medium text-red-400 uppercase tracking-wide">
                  Lost to Broken Links
                </span>
              </div>
              <div className="text-3xl font-bold font-display text-red-400">
                {formatCurrency(annualLostRevenue)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {brokenLinkCount} broken link{brokenLinkCount !== 1 ? 's' : ''} × {totalRiskPercent.toFixed(0)}% of revenue
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-800/50 border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-green-400" />
                <span className="text-xs font-medium text-green-400 uppercase tracking-wide">
                  Status
                </span>
              </div>
              <div className="text-2xl font-bold font-display text-white">
                All Clear
              </div>
              <div className="text-xs text-slate-500 mt-1">
                No broken links detected
              </div>
            </div>
          )}
        </div>

        {/* Per-link breakdown if there are broken links */}
        {brokenLinkCount > 0 && annualLostRevenue > 0 && (
          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white font-medium">
                  Each broken link costs you ~{formatCurrency(annualLostRevenue / brokenLinkCount)}/year
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Based on {totalRiskPercent.toFixed(0)}% of affected page revenue being lost. 
                  This assumes visitors who click broken links don't convert.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CTA when there are broken links */}
        {brokenLinkCount > 0 && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <p className="text-sm text-amber-400 text-center">
              <span className="font-semibold">Fix these {brokenLinkCount} links</span> and potentially 
              recover <span className="font-semibold">{formatCurrency(annualLostRevenue)}/year</span> in lost commissions
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
