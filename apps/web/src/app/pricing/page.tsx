import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getUserPlan, TIER_LIMITS } from '@linkrescue/types';
import { CheckCircle2, ExternalLink, Sparkles, X, HelpCircle, Shield, Zap } from 'lucide-react';
import { BRAND } from '@/config/brand';
import { PricingToggle } from './pricing-toggle';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pricing | LinkRescue',
  description: 'Simple, transparent pricing. Start free, upgrade when your site grows.',
};

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

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center">
              <ExternalLink className="w-4 h-4 text-slate-900" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">{BRAND.name}</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard/sites" className="btn-primary text-sm">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Sign in
                </Link>
                <Link href="/signup" className="btn-primary text-sm">
                  Get started free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-16 md:py-24">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Simple, transparent <span className="text-gradient">pricing</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Start free. Upgrade when your site grows. Cancel anytime.
          </p>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-6 mb-12 text-sm text-slate-500">
          <span className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-green-400" />
            Trusted by 500+ affiliate marketers
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-green-400" />
            1M+ links monitored
          </span>
        </div>

        {/* Pricing cards with toggle — client component */}
        <PricingToggle currentPlan={currentPlan} isLoggedIn={!!user} />

        {/* Feature comparison table */}
        <div className="max-w-5xl mx-auto mt-20">
          <h2 className="font-display text-2xl font-bold text-center mb-8">
            Compare plans
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-slate-400 font-medium">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold">{TIER_LIMITS.free.name}</th>
                  <th className="text-center py-4 px-4 font-semibold text-green-400">{TIER_LIMITS.pro.name}</th>
                  <th className="text-center py-4 px-4 font-semibold">{TIER_LIMITS.agency.name}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <ComparisonRow label="Sites" free="1" pro="5" agency="25" />
                <ComparisonRow label="Pages per scan" free="200" pro="2,000" agency="Unlimited" />
                <ComparisonRow label="Scan frequency" free="Weekly" pro="Daily" agency="Hourly" />
                <ComparisonRow label="Issue detection" free={true} pro={true} agency={true} />
                <ComparisonRow label="Basic alerts" free={true} pro={true} agency={true} />
                <ComparisonRow label="Weekly digest" free={false} pro={true} agency={true} />
                <ComparisonRow label="Revenue estimates" free={false} pro={true} agency={true} />
                <ComparisonRow label="Fix suggestions" free={false} pro={true} agency={true} />
                <ComparisonRow label="Realtime alerts" free={false} pro={false} agency={true} />
                <ComparisonRow label="API access" free={false} pro={false} agency={true} />
                <ComparisonRow label="Outbound webhooks" free={false} pro={false} agency={true} />
                <ComparisonRow label="White-label reports" free={false} pro={false} agency={true} />
                <ComparisonRow label="Slack integration" free={false} pro={false} agency={true} />
                <ComparisonRow label="Priority support" free={false} pro={false} agency={true} />
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mt-20">
          <h2 className="font-display text-2xl font-bold text-center mb-8">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            <FaqItem
              question="How does the free plan work?"
              answer="The Starter plan is free forever. You can monitor 1 site with up to 200 pages scanned weekly. No credit card required."
            />
            <FaqItem
              question="Can I switch plans at any time?"
              answer="Yes! You can upgrade, downgrade, or cancel anytime. When you upgrade, you'll be prorated for the remainder of your billing cycle. When you downgrade, the change takes effect at the end of your current period."
            />
            <FaqItem
              question="What counts as a 'page per scan'?"
              answer="Each unique URL on your site that we crawl and check for broken links counts as one page. We discover pages through your sitemap or by crawling your site structure."
            />
            <FaqItem
              question="How do annual plans work?"
              answer="Annual plans give you 2 months free compared to monthly billing. You pay upfront for the full year. You can still cancel anytime and receive a prorated refund."
            />
            <FaqItem
              question="What happens when I hit my plan limits?"
              answer="You'll receive a notification when approaching limits. Scans will stop at your page limit but still report all issues found. You can upgrade at any time to increase limits."
            />
            <FaqItem
              question="Do you offer refunds?"
              answer="Yes, we offer a 14-day money-back guarantee on all paid plans. If you're not satisfied, contact us for a full refund."
            />
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
            <Sparkles className="w-4 h-4 text-green-400" />
            <span>14-day money-back guarantee on all paid plans.</span>
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

function ComparisonRow({
  label,
  free,
  pro,
  agency,
}: {
  label: string;
  free: string | boolean;
  pro: string | boolean;
  agency: string | boolean;
}) {
  const renderCell = (value: string | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto" />
      ) : (
        <X className="w-5 h-5 text-slate-600 mx-auto" />
      );
    }
    return <span className="text-slate-300">{value}</span>;
  };

  return (
    <tr>
      <td className="py-3 px-4 text-slate-400">{label}</td>
      <td className="py-3 px-4 text-center">{renderCell(free)}</td>
      <td className="py-3 px-4 text-center">{renderCell(pro)}</td>
      <td className="py-3 px-4 text-center">{renderCell(agency)}</td>
    </tr>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group glass-card p-0 overflow-hidden">
      <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none">
        <span className="font-medium text-sm">{question}</span>
        <HelpCircle className="w-4 h-4 text-slate-500 group-open:text-green-400 transition-colors flex-shrink-0 ml-4" />
      </summary>
      <div className="px-6 pb-4 text-sm text-slate-400 leading-relaxed">
        {answer}
      </div>
    </details>
  );
}
