import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Handshake, ShieldCheck } from 'lucide-react';
import { PublicFooter } from '@/components/PublicFooter';
import { PublicNav } from '@/components/PublicNav';

export const metadata: Metadata = {
  title: 'Partner Referrals',
  description:
    'LinkRescue is running a small service-led pilot for affiliate publishers. Affiliate commissions and self-serve subscriptions are not available.',
  alternates: { canonical: 'https://www.linkrescue.io/affiliates' },
  robots: { index: false, follow: true },
  openGraph: {
    title: 'Partner referrals are paused | LinkRescue',
    description:
      'LinkRescue is running a small service-led pilot for affiliate publishers. Affiliate commissions and self-serve subscriptions are not available.',
    url: 'https://www.linkrescue.io/affiliates',
    siteName: 'LinkRescue',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Partner referrals are paused | LinkRescue',
    description:
      'LinkRescue is running a small service-led pilot for affiliate publishers. Affiliate commissions and self-serve subscriptions are not available.',
  },
};

const pilotPoints = [
  'A free, limited technical snapshot for a public content site.',
  'A human-scoped Recovery Sprint only after the site is a fit.',
  'A Monitoring Desk conversation only after a readiness review.',
];

const questions = [
  {
    question: 'Can I join an affiliate program today?',
    answer:
      'No. LinkRescue is not accepting affiliate-program sign-ups or offering referral commissions while the service-led pilot is being validated.',
  },
  {
    question: 'Can I refer someone I know?',
    answer:
      'Yes. If the person manages an established affiliate-content site, share the free snapshot. We will review the site personally before suggesting any paid work.',
  },
  {
    question: 'What is available now?',
    answer:
      'The free snapshot is available for public sites. A $499 fixed-scope Recovery Sprint and $149/month Monitoring Desk are discussed only after a human review.',
  },
];

export default function AffiliatesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <PublicNav />

      <main>
        <section className="pt-28 pb-20 md:pt-36 md:pb-28">
          <div className="container mx-auto max-w-3xl px-6 text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-200">
              <Handshake className="h-4 w-4" />
              Service-led pilot
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
              Partner referrals are <span className="text-gradient">paused for now</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 md:text-xl">
              We are validating LinkRescue with a small group of affiliate publishers before opening an affiliate program, automated subscriptions, or recurring commissions.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/free-scan" className="btn-primary px-8 py-4 text-base">
                Get a free snapshot <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/pricing" className="btn-secondary px-8 py-4 text-base">
                See the pilot offer
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-white/5 py-16">
          <div className="container mx-auto max-w-3xl px-6">
            <div className="glass-card p-7 md:p-9">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-500/10">
                  <ShieldCheck className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-semibold">What is live today</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    LinkRescue starts with observable technical evidence. We do not promise recovered revenue, send automatic customer email, or offer self-serve checkout during this pilot.
                  </p>
                </div>
              </div>
              <ul className="mt-7 space-y-4">
                {pilotPoints.map((point) => (
                  <li key={point} className="flex gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-t border-white/5 py-16">
          <div className="container mx-auto max-w-3xl px-6">
            <h2 className="font-display text-center text-3xl font-bold">Questions about referrals</h2>
            <div className="mt-10 space-y-4">
              {questions.map((item) => (
                <article key={item.question} className="glass-card p-5">
                  <h3 className="font-semibold">{item.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/5 py-20">
          <div className="container mx-auto max-w-2xl px-6 text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">Have a relevant affiliate site?</h2>
            <p className="mt-4 text-lg text-slate-400">
              Start with the limited, no-account technical snapshot. If the evidence is useful, we can decide together whether a human review makes sense.
            </p>
            <Link href="/free-scan" className="btn-primary mt-8 px-8 py-4 text-base">
              Check a public site <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
