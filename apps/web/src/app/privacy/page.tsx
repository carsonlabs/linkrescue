import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | LinkRescue',
  description: 'How LinkRescue collects, uses, and protects your data.',
  alternates: { canonical: 'https://linkrescue.io/privacy' },
};

const EFFECTIVE_DATE = 'February 27, 2026';
const CONTACT_EMAIL = 'privacy@linkrescue.io';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:shadow-green-500/40 transition-shadow">
              <ExternalLink className="w-4 h-4 text-slate-900" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">LinkRescue</span>
          </Link>
          <div className="flex gap-6 text-sm text-slate-400">
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="text-white">
              Privacy
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-16 max-w-3xl">
        <div className="mb-10">
          <h1 className="font-display text-4xl font-bold mb-3">Privacy Policy</h1>
          <p className="text-slate-400 text-sm">Effective date: {EFFECTIVE_DATE}</p>
        </div>

        <div className="prose prose-invert prose-slate max-w-none space-y-8 text-slate-300 leading-relaxed">
          <Section title="1. Who we are">
            <p>
              LinkRescue (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the website
              linkrescue.io and the LinkRescue monitoring service (the &quot;Service&quot;). This
              Privacy Policy explains how we collect, use, disclose, and safeguard your information
              when you use our Service.
            </p>
            <p>
              Questions about this policy should be directed to{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-400 hover:text-green-300">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </Section>

          <Section title="2. Information we collect">
            <h3 className="font-semibold text-white mb-2">Information you provide</h3>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>
                <strong className="text-slate-300">Email address</strong> — used for authentication
                (magic link login), email digests, and transactional notifications.
              </li>
              <li>
                <strong className="text-slate-300">Website domains and URLs</strong> — the sites
                you add to LinkRescue for monitoring.
              </li>
              <li>
                <strong className="text-slate-300">Payment information</strong> — processed
                directly by Stripe. We never store your card details.
              </li>
            </ul>

            <h3 className="font-semibold text-white mt-4 mb-2">Information we collect automatically</h3>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>
                <strong className="text-slate-300">Scan data</strong> — URLs, HTTP status codes,
                redirect chains, and link metadata discovered while crawling your sites.
              </li>
              <li>
                <strong className="text-slate-300">Usage data</strong> — pages visited within the
                dashboard, features used, and scan history.
              </li>
              <li>
                <strong className="text-slate-300">Log data</strong> — IP addresses, browser type,
                and timestamps for security and debugging purposes.
              </li>
            </ul>
          </Section>

          <Section title="3. How we use your information">
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>To provide, operate, and improve the LinkRescue Service</li>
              <li>To authenticate your account and maintain sessions</li>
              <li>To send weekly digest emails and scan notifications</li>
              <li>To process payments and manage subscriptions via Stripe</li>
              <li>To detect and prevent fraud, abuse, or security incidents</li>
              <li>To respond to your support requests</li>
              <li>To comply with legal obligations</li>
            </ul>
            <p className="mt-3">
              We do not sell your personal information to third parties. We do not use your data for
              advertising purposes.
            </p>
          </Section>

          <Section title="4. Third-party services">
            <p>We share data with the following trusted third parties to operate the Service:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400 mt-2">
              <li>
                <strong className="text-slate-300">Supabase</strong> — our database and
                authentication provider. Your data is stored in Supabase&apos;s PostgreSQL
                infrastructure with row-level security. See{' '}
                <a
                  href="https://supabase.com/privacy"
                  className="text-green-400 hover:text-green-300"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Supabase Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong className="text-slate-300">Stripe</strong> — payment processing. Stripe
                handles all payment card data. See{' '}
                <a
                  href="https://stripe.com/privacy"
                  className="text-green-400 hover:text-green-300"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Stripe Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong className="text-slate-300">Resend</strong> — transactional email delivery.
                Your email address is shared with Resend to send you notifications.
              </li>
              <li>
                <strong className="text-slate-300">Vercel</strong> — hosting and edge network. See{' '}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  className="text-green-400 hover:text-green-300"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Vercel Privacy Policy
                </a>
                .
              </li>
            </ul>
          </Section>

          <Section title="5. Data retention">
            <p>
              We retain your account data for as long as your account is active. Scan results and
              issue history are retained for 90 days. If you close your account, we delete your
              personal data within 30 days, except where we are required by law to retain it longer.
            </p>
          </Section>

          <Section title="6. Cookies and tracking">
            <p>
              We use cookies solely for session authentication (Supabase auth tokens). We do not use
              advertising cookies, analytics cookies, or third-party tracking pixels.
            </p>
          </Section>

          <Section title="7. Your rights">
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 mt-2">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data (&quot;right to be forgotten&quot;)</li>
              <li>Object to or restrict certain processing</li>
              <li>Data portability</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-400 hover:text-green-300">
                {CONTACT_EMAIL}
              </a>
              . We will respond within 30 days.
            </p>
          </Section>

          <Section title="8. Security">
            <p>
              We implement industry-standard security measures including TLS encryption in transit,
              encrypted storage, row-level security policies on all database tables, and regular
              security reviews. However, no system is 100% secure and we cannot guarantee absolute
              security.
            </p>
          </Section>

          <Section title="9. Children">
            <p>
              The Service is not directed to children under 13. We do not knowingly collect personal
              information from children. If you believe a child has provided us with information,
              please contact us and we will delete it promptly.
            </p>
          </Section>

          <Section title="10. Changes to this policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material
              changes by email or by displaying a notice in the dashboard. The &quot;Effective
              date&quot; at the top of this page indicates when the policy was last revised.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              For privacy-related questions, requests, or complaints, contact us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-400 hover:text-green-300">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </Section>
        </div>
      </main>

      <footer className="border-t border-white/5 py-8">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <Link href="/" className="hover:text-white transition-colors">
            ← Back to LinkRescue
          </Link>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-white">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
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
