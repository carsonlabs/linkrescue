import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getUserPlan, TIER_LIMITS } from '@linkrescue/types';
import { CheckCircle2, Sparkles, X, HelpCircle, Shield, Zap } from 'lucide-react';
import { PricingToggle } from './pricing-toggle';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Recover lost affiliate commissions starting free. Pro ($29/mo) for daily scans, Agency ($79/mo) for multi-site monitoring. No credit card.',
  alternates: { canonical: 'https://www.linkrescue.io/pricing' },
  openGraph: {
    title: 'Pricing — LinkRescue',
    description:
      'Affiliate revenue protection for publishers and agencies. Start free, upgrade when your content archive grows.',
    url: 'https://www.linkrescue.io/pricing',
    siteName: 'LinkRescue',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing — LinkRescue',
    description:
      'Affiliate revenue protection for publishers and agencies. Start free, upgrade when your content archive grows.',
  },
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
      <PublicNav />

      <div className="container mx-auto px-6 pt-28 pb-16 md:pt-32 md:pb-24">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Simple, transparent <span className="text-gradient">pricing</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Start free with one site. Upgrade when your content archive needs more coverage.
          </p>
        </div>

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-6 mb-12 text-sm text-slate-500">
          <span className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-green-400" />
            14-day money-back guarantee
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-green-400" />
            No credit card required to start
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
                <ComparisonRow label="Broken link & attribution detection" free={true} pro={true} agency={true} />
                <ComparisonRow label="Email alerts on new issues" free={true} pro={true} agency={true} />
                <ComparisonRow label="Weekly digest with fix links" free={false} pro={true} agency={true} />
                <ComparisonRow label="Revenue impact estimates" free={false} pro={true} agency={true} />
                <ComparisonRow label="Prioritized fix suggestions" free={false} pro={true} agency={true} />
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
              question="How does the free Starter plan work?"
              answer="Starter is free forever for one site with up to 200 pages scanned weekly. It's a real scan — you'll see broken links, stripped parameters, and attribution issues. No credit card required."
            />
            <FaqItem
              question="What's the difference between Starter and Pro?"
              answer="Pro scans daily instead of weekly, covers up to 5 sites and 2,000 pages per scan, and adds revenue impact estimates and fix suggestions so you can prioritize which links to repair first."
            />
            <FaqItem
              question="What counts as a 'page per scan'?"
              answer="Each unique URL on your site that we crawl counts as one page. We discover pages through your sitemap and by crawling your site structure — including old archive content that other tools skip."
            />
            <FaqItem
              question="Who is the Agency plan for?"
              answer="Agency is for teams managing multiple affiliate sites — whether your own portfolio or client sites. You get 25 sites, hourly scans, API access, webhooks, and Slack integration."
            />
            <FaqItem
              question="Can I switch plans at any time?"
              answer="Yes. Upgrade, downgrade, or cancel anytime. Upgrades are prorated immediately. Downgrades take effect at the end of your current billing period."
            />
            <FaqItem
              question="Do you offer refunds?"
              answer="Yes, all paid plans include a 14-day money-back guarantee. If LinkRescue isn't right for you, contact us for a full refund."
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

      <PublicFooter />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: 'LinkRescue',
            description: 'Affiliate revenue protection for publishers. Crawls your content archive to find broken links, stripped parameters, and attribution failures.',
            brand: { '@type': 'Organization', name: 'LinkRescue' },
            offers: [
              { '@type': 'Offer', name: 'Starter (Free)', price: '0', priceCurrency: 'USD', description: '1 site, 200 pages/scan, weekly scans' },
              { '@type': 'Offer', name: 'Pro', price: '29', priceCurrency: 'USD', priceSpecification: { '@type': 'UnitPriceSpecification', billingDuration: 'P1M' }, description: '5 sites, 2000 pages/scan, daily scans' },
              { '@type': 'Offer', name: 'Agency', price: '79', priceCurrency: 'USD', priceSpecification: { '@type': 'UnitPriceSpecification', billingDuration: 'P1M' }, description: '25 sites, unlimited pages, hourly scans, API access' },
            ],
          }),
        }}
      />
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
