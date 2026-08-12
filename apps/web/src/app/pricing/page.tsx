import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, HelpCircle } from 'lucide-react';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';

export const metadata: Metadata = {
  title: 'Recovery Services',
  description:
    'LinkRescue offers a free leak snapshot, a fixed-price recovery sprint, and managed monitoring after a readiness review.',
  alternates: { canonical: 'https://www.linkrescue.io/pricing' },
};

const offers = [
  {
    name: 'Free Leak Snapshot',
    price: 'Free',
    detail: 'A limited browser-based review of publicly reachable pages and outbound links.',
    points: ['No account required', 'Technical issues only', 'No revenue estimates', 'Useful evidence for a follow-up'],
    href: '/free-scan',
    cta: 'Get a free snapshot',
    featured: false,
  },
  {
    name: 'Recovery Sprint',
    price: '$499',
    detail: 'A focused, human-led review for a single affiliate site after the free snapshot.',
    points: ['Prioritized repair list', 'Redirect and tracking review', 'Implementation notes', 'Clear scope before work begins'],
    href: '/free-scan',
    cta: 'Start with a snapshot',
    featured: true,
  },
  {
    name: 'Monitoring Desk',
    price: '$149/mo',
    detail: 'Managed monitoring for sites that have completed a readiness review.',
    points: ['One site', 'Human-reviewed issue queue', 'Monthly action summary', 'Available after approval'],
    href: '/free-scan',
    cta: 'Check readiness',
    featured: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="container mx-auto px-6 pt-28 pb-16 md:pt-32 md:pb-24">
        <div className="text-center mb-14">
          <p className="badge-green inline-flex mb-6">Service-led pilot</p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Recovery work with a <span className="text-gradient">clear scope</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            LinkRescue is accepting a small number of affiliate publisher sites. We begin with
            evidence, then agree on the work before a paid sprint or monitoring engagement starts.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {offers.map((offer) => (
            <section key={offer.name} className={offer.featured ? 'gradient-border p-8' : 'glass-card p-8'}>
              {offer.featured && <span className="badge-green text-xs">Best next step</span>}
              <h2 className="font-display text-2xl font-bold mt-4 mb-2">{offer.name}</h2>
              <p className="font-display text-4xl font-bold text-gradient mb-4">{offer.price}</p>
              <p className="text-sm text-slate-400 min-h-16">{offer.detail}</p>
              <ul className="space-y-3 my-7">
                {offer.points.map((point) => (
                  <li key={point} className="flex gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    {point}
                  </li>
                ))}
              </ul>
              <Link href={offer.href} className={offer.featured ? 'btn-primary w-full justify-center' : 'btn-secondary w-full justify-center'}>
                {offer.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </section>
          ))}
        </div>

        <section className="max-w-3xl mx-auto mt-20">
          <h2 className="font-display text-2xl font-bold text-center mb-8">Before you commit</h2>
          <div className="space-y-4">
            <Faq question="Can I buy online today?" answer="Not yet. Checkout is intentionally off while we validate the delivery workflow with a small pilot group. The free snapshot is the correct starting point." />
            <Faq question="Does the snapshot measure revenue?" answer="No. It reports technical evidence such as broken links, redirects, and visible tracking parameters. Revenue recovery depends on traffic, merchant terms, and many factors outside a link check." />
            <Faq question="What happens after the snapshot?" answer="We review whether the site is a fit, share the proposed scope, and only then invite it into a Recovery Sprint or managed monitoring." />
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

function Faq({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="glass-card group p-0 overflow-hidden">
      <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none">
        <span className="font-medium text-sm">{question}</span>
        <HelpCircle className="w-4 h-4 text-slate-500 group-open:text-green-400" />
      </summary>
      <p className="px-6 pb-4 text-sm text-slate-400 leading-relaxed">{answer}</p>
    </details>
  );
}
