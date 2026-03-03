'use client';

import { useState } from 'react';
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

type CalcState = 'idle' | 'revealing' | 'submitted';

function formatCurrency(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm text-slate-400">{label}</label>
        <span className="font-mono text-sm font-semibold text-white">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, hsl(145 100% 55%) 0%, hsl(145 100% 55%) ${pct}%, hsl(260 20% 22%) ${pct}%, hsl(260 20% 22%) 100%)`,
          accentColor: 'hsl(145 100% 55%)',
        }}
      />
    </div>
  );
}

export function RevenueCalculator() {
  const [state, setState] = useState<CalcState>('idle');
  const [monthlyViews, setMonthlyViews] = useState(100_000);
  const [rpm, setRpm] = useState(120);
  const [brokenRate, setBrokenRate] = useState(10);
  const [socialTrafficPct, setSocialTrafficPct] = useState(30);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Broken link loss (existing calculation)
  const brokenLinkLoss = Math.round((monthlyViews / 1000) * rpm * (brokenRate / 100));

  // Silent attribution failure loss (based on social traffic %)
  // Industry estimates suggest 15-25% attribution loss through in-app browsers. We use 20%.
  const attributionStripRate = 0.2;
  const socialViews = monthlyViews * (socialTrafficPct / 100);
  const attributionLoss = Math.round((socialViews / 1000) * rpm * attributionStripRate);

  // Combined total
  const totalMonthlyLoss = brokenLinkLoss + attributionLoss;
  const totalAnnualLoss = totalMonthlyLoss * 12;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/calculator-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, monthlyLoss: totalMonthlyLoss, annualLoss: totalAnnualLoss }),
      });
      if (!res.ok) throw new Error('failed');
      setState('submitted');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="glass-card p-8 max-w-2xl mx-auto">
      {/* Sliders */}
      <div className="space-y-6 mb-8">
        <SliderField
          label="Monthly page views"
          value={monthlyViews}
          min={10_000}
          max={1_000_000}
          step={10_000}
          onChange={setMonthlyViews}
          format={(v) =>
            v >= 1_000_000 ? '1M' : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v)
          }
        />
        <SliderField
          label="Affiliate RPM (revenue per 1,000 views)"
          value={rpm}
          min={10}
          max={500}
          step={5}
          onChange={setRpm}
          format={(v) => `$${v}`}
        />
        <SliderField
          label="Broken / expired affiliate link rate"
          value={brokenRate}
          min={1}
          max={30}
          step={1}
          onChange={setBrokenRate}
          format={(v) => `${v}%`}
        />
        <SliderField
          label="Traffic from social platforms (Instagram, TikTok, Facebook)"
          value={socialTrafficPct}
          min={0}
          max={80}
          step={5}
          onChange={setSocialTrafficPct}
          format={(v) => `${v}%`}
        />
      </div>

      {/* Two-part loss breakdown — always visible */}
      <div className="space-y-3 mb-4">
        {/* Broken link loss */}
        <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Loss from broken &amp; expired links</p>
          <div className="font-display text-3xl font-bold text-red-400">
            {formatCurrency(brokenLinkLoss)}
            <span className="text-sm text-slate-500 font-normal">/mo</span>
          </div>
        </div>

        {/* Attribution failure loss */}
        <div className="border border-red-500/30 bg-red-500/5 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">
            Additional loss from silent attribution failures
          </p>
          <div className="font-display text-3xl font-bold text-red-400">
            +{formatCurrency(attributionLoss)}
            <span className="text-sm text-slate-500 font-normal">/mo</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            In-app browsers (Instagram, TikTok, etc.) strip affiliate tags an estimated 15-25% of the time
          </p>
        </div>

        {/* Combined total */}
        <div className="border border-red-500/40 bg-red-500/10 rounded-xl p-5">
          <p className="text-sm text-slate-400 mb-1">Total estimated monthly loss</p>
          <div className="font-display text-5xl font-bold text-red-400">
            {formatCurrency(totalMonthlyLoss)}
            <span className="text-lg text-slate-500 font-normal">/mo</span>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[11px] text-slate-500 mb-6 leading-relaxed">
        These are estimates based on industry averages. Actual losses vary by niche, network, and traffic source.
      </p>

      {/* Annual loss teaser — blurred in idle */}
      {state === 'idle' && (
        <div className="relative border border-white/10 rounded-xl p-6 mb-6 overflow-hidden">
          {/* Blurred content */}
          <div className="blur-sm select-none pointer-events-none">
            <p className="text-sm text-slate-400 mb-1">Annual revenue loss</p>
            <div className="font-display text-4xl font-bold text-slate-200">$14,400/yr</div>
            <p className="text-xs text-slate-500 mt-2">Based on your inputs above</p>
          </div>
          {/* Lock overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-[2px] rounded-xl">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center mb-2">
              <Lock className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xs text-slate-400">Enter your email to unlock</p>
          </div>
        </div>
      )}

      {/* Email capture — revealing state */}
      {state === 'revealing' && (
        <form
          onSubmit={handleSubmit}
          className="border border-green-500/20 bg-green-500/5 rounded-xl p-6 mb-6 space-y-4"
        >
          <p className="text-sm font-medium text-slate-200">
            Get your full report — annual loss + fix checklist
          </p>
          <div className="flex gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-green-500/50 transition-colors"
            />
            <button type="submit" disabled={submitting} className="btn-primary whitespace-nowrap">
              {submitting ? 'Sending…' : 'Unlock'}
              {!submitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <p className="text-xs text-slate-500">No spam. Unsubscribe any time.</p>
        </form>
      )}

      {/* Submitted state */}
      {state === 'submitted' && (
        <div className="border border-green-500/20 bg-green-500/5 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
            <span className="text-sm font-semibold text-green-400">Report sent to {email}</span>
          </div>
          <p className="text-sm text-slate-400 mb-1">Your estimated annual revenue loss:</p>
          <div className="font-display text-4xl font-bold text-red-400 mb-2">
            {formatCurrency(totalAnnualLoss)}/yr
          </div>
          <p className="text-xs text-slate-500 mb-4">
            {formatCurrency(brokenLinkLoss * 12)}/yr from broken links +{' '}
            {formatCurrency(attributionLoss * 12)}/yr from silent attribution failures
          </p>
          <p className="text-sm text-slate-400 mb-5">
            LinkRescue catches both. Check your links across multiple browser environments for free.
          </p>
          <Link href="/link-checker" className="btn-primary w-full justify-center">
            Check your links free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Primary CTA — idle state */}
      {state === 'idle' && (
        <button onClick={() => setState('revealing')} className="btn-primary w-full justify-center">
          Get My Full Revenue Loss Report
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
