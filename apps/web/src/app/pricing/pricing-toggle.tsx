'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { TIER_LIMITS } from '@linkrescue/types';
import { CheckoutButton } from '@/components/checkout-button';

interface PricingToggleProps {
  currentPlan: string;
  isLoggedIn: boolean;
}

export function PricingToggle({ currentPlan, isLoggedIn }: PricingToggleProps) {
  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly');

  const plans = [
    {
      key: 'free' as const,
      tier: TIER_LIMITS.free,
      description: 'Try it on one site, free',
      popular: false,
      features: [
        `${TIER_LIMITS.free.sites} site`,
        `${TIER_LIMITS.free.pagesPerScan} pages per scan`,
        'Weekly scans',
        'Broken link & attribution alerts',
        'Monthly email digest',
      ],
      cta: 'Get started free',
    },
    {
      key: 'pro' as const,
      tier: TIER_LIMITS.pro,
      description: 'For publishers who care about revenue',
      popular: true,
      features: [
        `${TIER_LIMITS.pro.sites} sites`,
        `${TIER_LIMITS.pro.pagesPerScan.toLocaleString()} pages per scan`,
        'Daily scans',
        'Weekly digests with fix links',
        'Revenue impact estimates',
        'Prioritized fix suggestions',
      ],
      cta: 'Start Pro Trial',
    },
    {
      key: 'agency' as const,
      tier: TIER_LIMITS.agency,
      description: 'For teams managing multiple sites',
      popular: false,
      features: [
        `${TIER_LIMITS.agency.sites} sites`,
        'Unlimited pages per scan',
        'Hourly scans',
        'Realtime alerts',
        'API access & webhooks',
        'Slack integration',
        'White-label reports',
        'Priority support',
      ],
      cta: 'Start Agency Trial',
    },
  ];

  const getPrice = (plan: (typeof plans)[number]) => {
    if (plan.key === 'free') return 0;
    return interval === 'annual'
      ? Math.round(plan.tier.annualPrice / 12)
      : plan.tier.price;
  };

  return (
    <>
      {/* Monthly/Annual toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <span
          className={`text-sm font-medium transition-colors ${
            interval === 'monthly' ? 'text-white' : 'text-slate-500'
          }`}
        >
          Monthly
        </span>
        <button
          role="switch"
          aria-checked={interval === 'annual'}
          onClick={() => setInterval(interval === 'monthly' ? 'annual' : 'monthly')}
          className={`relative w-14 h-7 rounded-full transition-colors ${
            interval === 'annual' ? 'bg-green-500' : 'bg-slate-700'
          }`}
          aria-label="Toggle billing interval"
        >
          <span
            className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
              interval === 'annual' ? 'translate-x-7' : 'translate-x-0.5'
            }`}
          />
        </button>
        <span
          className={`text-sm font-medium transition-colors ${
            interval === 'annual' ? 'text-white' : 'text-slate-500'
          }`}
        >
          Annual
        </span>
        {interval === 'annual' && (
          <span className="text-xs font-semibold bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
            Save 17%
          </span>
        )}
      </div>

      {/* Pricing cards */}
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => {
          const price = getPrice(plan);
          const isCurrent = currentPlan === plan.key;

          return (
            <div
              key={plan.key}
              className={`glass-card p-8 space-y-6 relative flex flex-col ${
                plan.popular ? 'border-green-500/30 md:-mt-4 md:mb-4 shadow-lg shadow-green-500/5' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="badge-green text-xs">Most Popular</span>
                </div>
              )}

              <div>
                <h2 className="font-display text-xl font-bold">{plan.tier.name}</h2>
                <p className="text-slate-400 text-sm mt-1">{plan.description}</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="font-display text-5xl font-bold">
                  ${price}
                </span>
                <span className="text-slate-500">/mo</span>
                {plan.key !== 'free' && interval === 'annual' && (
                  <span className="text-xs text-slate-500 ml-1">
                    billed annually
                  </span>
                )}
              </div>

              {plan.key !== 'free' && interval === 'annual' && (
                <p className="text-xs text-green-400">
                  ${plan.tier.annualPrice}/yr — save ${plan.tier.price * 12 - plan.tier.annualPrice}/yr
                </p>
              )}

              <ul className="space-y-3 text-sm flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5">
                    <CheckCircle2
                      className={`w-5 h-5 flex-shrink-0 ${
                        plan.popular ? 'text-green-400' : 'text-slate-500'
                      }`}
                    />
                    <span className="text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="w-full text-center py-3 border border-white/10 rounded-xl text-slate-500 font-medium text-sm bg-white/5">
                  Current plan
                </div>
              ) : plan.key === 'free' ? (
                <Link
                  href={isLoggedIn ? '/dashboard/sites' : '/signup'}
                  className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition-all block btn-secondary`}
                >
                  {plan.cta}
                </Link>
              ) : isLoggedIn ? (
                <CheckoutButton plan={plan.key} interval={interval}>
                  {plan.cta}
                </CheckoutButton>
              ) : (
                <Link
                  href="/signup"
                  className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition-all block ${
                    plan.popular ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
