import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getUserPlan, PLAN_LIMITS } from '@linkrescue/types';
import { CheckoutButton, AgencyCheckoutButton } from '@/components/checkout-button';
import { CheckCircle2, ExternalLink, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentPlan = 'free';
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('stripe_price_id')
      .eq('id', user.id)
      .single();
    currentPlan = getUserPlan(profile?.stripe_price_id ?? null);
  }

  const plans = [
    {
      name: 'Free',
      description: 'Perfect for getting started',
      price: 0,
      popular: false,
      features: [
        `${PLAN_LIMITS.free.sites} site`,
        `${PLAN_LIMITS.free.pagesPerScan} pages per scan`,
        'Weekly email digests',
        'All issue types detected',
        'Site verification',
      ],
      cta: 'Get started free',
      ctaAction: '/signup',
    },
    {
      name: 'Pro',
      description: 'For serious affiliate sites',
      price: 29,
      popular: true,
      features: [
        `${PLAN_LIMITS.pro.sites} sites`,
        `${PLAN_LIMITS.pro.pagesPerScan} pages per scan`,
        'Daily scans',
        'Weekly email digests',
        'All issue types detected',
        'Site verification',
        'Priority support',
      ],
      cta: 'Start Pro trial',
      ctaAction: 'checkout-pro',
    },
    {
      name: 'Agency',
      description: 'For power users & agencies',
      price: 99,
      popular: false,
      features: [
        `${PLAN_LIMITS.agency.sites} sites`,
        'Unlimited pages per scan',
        'Daily scans',
        'Weekly email digests',
        'All issue types detected',
        'Site verification',
        'Priority support',
        'API access (coming soon)',
      ],
      cta: 'Start Agency trial',
      ctaAction: 'checkout-agency',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center">
              <ExternalLink className="w-4 h-4 text-slate-900" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">LinkRescue</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/sites"
                className="btn-primary text-sm"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="btn-primary text-sm"
                >
                  Get started free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-14">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Simple, transparent <span className="text-gradient">pricing</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Start free. Upgrade when your site grows. Cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`glass-card p-8 space-y-6 relative flex flex-col ${
                plan.popular ? 'border-green-500/30 md:-mt-4 md:mb-4' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="badge-green text-xs">Most popular</span>
                </div>
              )}
              
              <div>
                <h2 className="font-display text-xl font-bold">{plan.name}</h2>
                <p className="text-slate-400 text-sm mt-1">{plan.description}</p>
              </div>
              
              <div className="flex items-baseline gap-1">
                <span className="font-display text-5xl font-bold">
                  {plan.price === 0 ? '$0' : `$${plan.price}`}
                </span>
                <span className="text-slate-500">/month</span>
              </div>
              
              <ul className="space-y-3 text-sm flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5">
                    <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${
                      plan.popular ? 'text-green-400' : 'text-slate-500'
                    }`} />
                    <span className="text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {!user ? (
                <Link
                  href="/signup"
                  className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                    plan.popular
                      ? 'btn-primary'
                      : 'btn-secondary'
                  }`}
                >
                  {plan.cta}
                </Link>
              ) : currentPlan === plan.name.toLowerCase() ? (
                <div className="w-full text-center py-3 border border-white/10 rounded-xl text-slate-500 font-medium text-sm bg-white/5">
                  Current plan
                </div>
              ) : plan.ctaAction === 'checkout-pro' ? (
                <CheckoutButton />
              ) : plan.ctaAction === 'checkout-agency' ? (
                <AgencyCheckoutButton />
              ) : (
                <Link
                  href={plan.ctaAction}
                  className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition-all block ${
                    plan.popular
                      ? 'btn-primary'
                      : 'btn-secondary'
                  }`}
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Trust indicators */}
        <div className="mt-16 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
            <Sparkles className="w-4 h-4 text-green-400" />
            <span>14-day free trial on all paid plans. No credit card required.</span>
          </div>
          
          <div className="flex items-center justify-center gap-8 text-sm text-slate-500">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Cancel anytime
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Secure payment via Stripe
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
