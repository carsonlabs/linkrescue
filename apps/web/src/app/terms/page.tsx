import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms for the LinkRescue service-led recovery pilot.',
  alternates: { canonical: 'https://www.linkrescue.io/terms' },
};

const CONTACT_EMAIL = 'hello@freedomengineers.tech';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="container mx-auto px-6 pt-28 pb-16 max-w-3xl">
        <h1 className="font-display text-4xl font-bold mb-3">Terms of Service</h1>
        <p className="text-slate-400 text-sm mb-10">Effective date: August 12, 2026</p>
        <div className="space-y-8 text-slate-300 leading-relaxed">
          <Section title="1. The pilot service"><p>LinkRescue provides limited technical link snapshots and may offer human-led Recovery Sprints or managed monitoring after a readiness review. The current website does not offer self-serve subscriptions or automated billing.</p></Section>
          <Section title="2. No performance promise"><p>Technical checks can identify visible status errors, redirects, and standard URL parameters. They cannot determine traffic, conversion, merchant eligibility, or lost commissions. LinkRescue does not promise revenue recovery, a specific outcome, or that every link path is detected.</p></Section>
          <Section title="3. Acceptable use"><p>You may submit only public websites and URLs you own or are authorized to assess. You must not use the service to create excessive traffic, evade safeguards, or violate another party&apos;s rights.</p></Section>
          <Section title="4. Paid work"><p>Any paid Recovery Sprint or monitoring engagement requires a separate scope, price, and written agreement before work begins. A free snapshot does not create an obligation for either party.</p></Section>
          <Section title="5. Limitation of liability"><p>To the maximum extent permitted by law, LinkRescue is provided as available and is not liable for indirect, incidental, consequential, revenue, profit, or data losses arising from use of the pilot or technical results.</p></Section>
          <Section title="6. Privacy"><p>Your use is also governed by our <Link href="/privacy" className="text-green-400 hover:text-green-300">Privacy Policy</Link>.</p></Section>
          <Section title="7. Contact"><p>Questions about these terms can be sent to <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-400 hover:text-green-300">{CONTACT_EMAIL}</a>.</p></Section>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="font-display text-xl font-semibold text-white mb-3">{title}</h2>{children}</section>;
}
