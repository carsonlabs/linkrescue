import type { Metadata } from 'next';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How LinkRescue handles pilot enquiries and limited scan data.',
  alternates: { canonical: 'https://www.linkrescue.io/privacy' },
};

const CONTACT_EMAIL = 'hello@freedomengineers.tech';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="container mx-auto px-6 pt-28 pb-16 max-w-3xl">
        <h1 className="font-display text-4xl font-bold mb-3">Privacy Policy</h1>
        <p className="text-slate-400 text-sm mb-10">Effective date: August 12, 2026</p>
        <div className="prose prose-invert prose-slate max-w-none space-y-8 text-slate-300 leading-relaxed">
          <Section title="1. What LinkRescue is">
            <p>LinkRescue is a service-led affiliate link recovery pilot. It provides limited technical snapshots and may offer human-led recovery work after a site is reviewed for fit.</p>
          </Section>
          <Section title="2. Information we collect">
            <p>When you use a free tool, we may collect the website URL you submit, URLs and technical link information found during a limited public review, your email address if you choose to unlock additional results, and basic request data used for security and abuse prevention.</p>
          </Section>
          <Section title="3. How we use it">
            <p>We use this information to run the requested technical check, evaluate whether your site is a fit for recovery work, respond personally to an enquiry, improve the service, and prevent abuse. We do not use a free snapshot to calculate or promise revenue outcomes.</p>
          </Section>
          <Section title="4. Email and service providers">
            <p>Lead details are stored in Supabase. When owner notifications are enabled, the submitted enquiry is sent to the LinkRescue operator through Resend. We do not automatically email visitors from the free snapshot form.</p>
          </Section>
          <Section title="5. Retention and sharing">
            <p>We retain pilot enquiry and limited scan data for up to 90 days for delivery and follow-up. We do not sell personal information or use it for advertising. We share it only with the service providers needed to operate the pilot, such as Supabase, Resend, and Vercel.</p>
          </Section>
          <Section title="6. Your choices">
            <p>You may request access, correction, or deletion of your personal information by emailing <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-400 hover:text-green-300">{CONTACT_EMAIL}</a>. We may retain limited information where legally required or necessary to prevent fraud and abuse.</p>
          </Section>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="font-display text-xl font-semibold text-white mb-3">{title}</h2>{children}</section>;
}
