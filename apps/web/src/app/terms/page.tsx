import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';

export const metadata: Metadata = {
  title: 'Terms of Service | LinkRescue',
  description: 'Terms and conditions for using the LinkRescue service.',
  alternates: { canonical: 'https://www.linkrescue.io/terms' },
};

const EFFECTIVE_DATE = 'February 27, 2026';
const CONTACT_EMAIL = 'legal@linkrescue.io';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <main className="container mx-auto px-6 pt-28 pb-16 max-w-3xl">
        <div className="mb-10">
          <h1 className="font-display text-4xl font-bold mb-3">Terms of Service</h1>
          <p className="text-slate-400 text-sm">Effective date: {EFFECTIVE_DATE}</p>
        </div>

        <div className="space-y-8 text-slate-300 leading-relaxed">
          <Section title="1. Acceptance of terms">
            <p>
              By creating an account or using LinkRescue (&quot;Service&quot;, &quot;we&quot;,
              &quot;us&quot;), you agree to be bound by these Terms of Service and our{' '}
              <Link href="/privacy" className="text-green-400 hover:text-green-300">
                Privacy Policy
              </Link>
              . If you do not agree, do not use the Service.
            </p>
          </Section>

          <Section title="2. Description of service">
            <p>
              LinkRescue is a web-based monitoring service that crawls websites, detects broken and
              misconfigured affiliate links, and notifies users of issues. The Service includes link
              scanning, email digest notifications, redirect rule management, revenue analytics, and
              related features.
            </p>
          </Section>

          <Section title="3. Account registration">
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>You must provide a valid email address to create an account.</li>
              <li>
                You are responsible for all activity that occurs under your account and for
                maintaining the security of your login credentials.
              </li>
              <li>You must be at least 13 years old to use the Service.</li>
              <li>One person may not maintain more than one free account.</li>
            </ul>
          </Section>

          <Section title="4. Acceptable use">
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 mt-2">
              <li>
                Use the Service to crawl websites you do not own or have explicit permission to
                monitor
              </li>
              <li>
                Abuse the crawling infrastructure to generate excessive traffic to third-party
                servers
              </li>
              <li>
                Attempt to reverse-engineer, decompile, or extract the source code of the Service
              </li>
              <li>
                Resell, sublicense, or redistribute access to the Service without prior written
                consent
              </li>
              <li>Use the Service for any unlawful purpose</li>
              <li>
                Interfere with or disrupt the integrity or performance of the Service or its
                infrastructure
              </li>
            </ul>
            <p className="mt-3">
              We reserve the right to suspend or terminate accounts that violate these terms without
              notice.
            </p>
          </Section>

          <Section title="5. Free and paid plans">
            <p>
              The Service is offered on a free tier and paid subscription plans. Features available
              on each plan are described on the{' '}
              <Link href="/pricing" className="text-green-400 hover:text-green-300">
                Pricing page
              </Link>{' '}
              and are subject to change with reasonable notice.
            </p>
            <p className="mt-3">
              Paid subscriptions are billed monthly or annually through Stripe. You may cancel at
              any time; cancellation takes effect at the end of your current billing period. We do
              not provide refunds for partial billing periods.
            </p>
          </Section>

          <Section title="6. Intellectual property">
            <p>
              The Service, its interface, branding, and underlying software are the exclusive
              property of LinkRescue and its licensors. You retain ownership of the websites and
              data you provide to the Service.
            </p>
            <p className="mt-3">
              You grant us a limited, non-exclusive licence to crawl, analyse, and store data from
              the websites you add to your account solely for the purpose of providing the Service.
            </p>
          </Section>

          <Section title="7. Disclaimer of warranties">
            <p>
              The Service is provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; without
              warranties of any kind, either express or implied, including but not limited to
              warranties of merchantability, fitness for a particular purpose, or non-infringement.
            </p>
            <p className="mt-3">
              We do not warrant that the Service will be uninterrupted, error-free, or free of
              harmful components, or that the results obtained from using the Service will be
              accurate or reliable.
            </p>
          </Section>

          <Section title="8. Limitation of liability">
            <p>
              To the maximum extent permitted by law, LinkRescue shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages, including but not
              limited to loss of profits, revenue, data, or business opportunities arising from your
              use of the Service, even if we have been advised of the possibility of such damages.
            </p>
            <p className="mt-3">
              Our aggregate liability to you for any claim arising out of or related to the Service
              shall not exceed the amount you paid us in the 12 months preceding the claim.
            </p>
          </Section>

          <Section title="9. Indemnification">
            <p>
              You agree to indemnify, defend, and hold harmless LinkRescue and its officers,
              directors, employees, and agents from any claims, losses, damages, liabilities, and
              expenses (including reasonable attorneys&apos; fees) arising out of your use of the
              Service or violation of these Terms.
            </p>
          </Section>

          <Section title="10. Termination">
            <p>
              Either party may terminate this agreement at any time. We may suspend or terminate
              your account immediately if you violate these Terms. Upon termination, your right to
              use the Service ceases and we may delete your data in accordance with our{' '}
              <Link href="/privacy" className="text-green-400 hover:text-green-300">
                Privacy Policy
              </Link>
              .
            </p>
          </Section>

          <Section title="11. Changes to terms">
            <p>
              We reserve the right to modify these Terms at any time. We will provide at least 14
              days&apos; notice for material changes via email or a dashboard notice. Continued use
              of the Service after changes take effect constitutes acceptance of the new Terms.
            </p>
          </Section>

          <Section title="12. Governing law">
            <p>
              These Terms shall be governed by and construed in accordance with applicable law.
              Any disputes shall be resolved through binding arbitration except where prohibited.
            </p>
          </Section>

          <Section title="13. Contact">
            <p>
              For questions about these Terms, contact us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-400 hover:text-green-300">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </Section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-semibold text-white mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
