import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DollarSign,
  Repeat,
  Clock,
  Gift,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Users,
  TrendingUp,
  Megaphone,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Affiliate Program — Earn 30% Recurring Commission',
  description:
    'Join the LinkRescue affiliate program and earn 30% recurring commission for 12 months on every referral. 90-day cookie, monthly payouts, and dedicated support.',
};

const highlights = [
  {
    icon: DollarSign,
    title: '30% Recurring',
    description: 'Earn 30% of every payment your referrals make — not just the first one.',
  },
  {
    icon: Repeat,
    title: '12-Month Duration',
    description: 'Commissions continue for a full 12 months after each referral signs up.',
  },
  {
    icon: Clock,
    title: '90-Day Cookie',
    description: 'Your referrals have 90 days to convert after clicking your link.',
  },
  {
    icon: Gift,
    title: 'Monthly Payouts',
    description: 'Get paid every month via PayPal or Wise. $50 minimum threshold.',
  },
];

const earningsExamples = [
  { referrals: 5, plan: 'Pro ($29/mo)', monthly: '$43.50', annual: '$522' },
  { referrals: 10, plan: 'Pro ($29/mo)', monthly: '$87', annual: '$1,044' },
  { referrals: 5, plan: 'Agency ($79/mo)', monthly: '$118.50', annual: '$1,422' },
  { referrals: 20, plan: 'Mixed', monthly: '$290', annual: '$3,480' },
];

const faq = [
  {
    q: 'Who can join the affiliate program?',
    a: 'Anyone! Bloggers, content creators, SEO professionals, and affiliate marketers are especially great fits. You don\'t need to be a LinkRescue customer.',
  },
  {
    q: 'How do I get paid?',
    a: 'Commissions are paid monthly via PayPal or Wise, with a $50 minimum payout threshold. You can track all earnings in real-time through your Rewardful dashboard.',
  },
  {
    q: 'How long does the cookie last?',
    a: '90 days. If someone clicks your link and signs up within 90 days, you get credit for the referral.',
  },
  {
    q: 'Do I earn on annual plans too?',
    a: 'Yes! You earn 30% of whatever the customer pays, including annual plans. Annual plan commissions are paid when the customer pays.',
  },
  {
    q: 'Is there a limit on how much I can earn?',
    a: 'No cap. Earn as much as you can. Our top affiliates earn over $1,000/month.',
  },
  {
    q: 'What marketing materials do you provide?',
    a: 'We provide banner ads, email templates, social media copy, and a detailed product overview. All available in your affiliate dashboard.',
  },
];

// TODO: Replace with actual Rewardful signup URL once account is set up
const REWARDFUL_SIGNUP_URL = process.env.NEXT_PUBLIC_REWARDFUL_SIGNUP_URL || '#';

export default function AffiliatesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="border-b border-white/5">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center">
              <ExternalLink className="w-4 h-4 text-slate-900" />
            </div>
            <span className="font-display font-bold text-lg">LinkRescue</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm text-slate-400 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">
              Log in
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-400 text-sm font-medium px-4 py-1.5 rounded-full mb-8 border border-green-500/20">
            <Gift className="w-4 h-4" />
            Affiliate Program
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Earn <span className="text-gradient">30% Recurring</span> Commission
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Recommend LinkRescue to your audience and earn 30% of every payment for 12 months.
            Join hundreds of affiliates earning passive income.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={REWARDFUL_SIGNUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-base px-8 py-4"
            >
              Join the Program
              <ArrowRight className="w-5 h-5" />
            </a>
            <Link
              href="#how-it-works"
              className="btn-secondary text-base px-8 py-4"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-16 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((item) => (
              <div key={item.title} className="glass-card p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 border-t border-white/5">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="space-y-8">
            {[
              { step: '1', title: 'Sign up', description: 'Create your free affiliate account through Rewardful. Takes 2 minutes.' },
              { step: '2', title: 'Share your link', description: 'Get your unique referral link and share it with your audience via blog posts, emails, social media, or YouTube.' },
              { step: '3', title: 'Earn commissions', description: 'When someone signs up for a paid plan through your link, you earn 30% of every payment they make for 12 months.' },
              { step: '4', title: 'Get paid', description: 'Track earnings in real-time and receive monthly payouts via PayPal or Wise.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-5">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0 font-display font-bold text-green-400">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                  <p className="text-slate-400 text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings Calculator */}
      <section className="py-16 border-t border-white/5">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-center mb-4">Earnings Potential</h2>
          <p className="text-center text-slate-400 mb-10">See how much you could earn with just a few referrals.</p>
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-5 text-slate-400 font-medium">Referrals</th>
                  <th className="text-left py-4 px-5 text-slate-400 font-medium">Plan</th>
                  <th className="text-right py-4 px-5 text-slate-400 font-medium">Monthly</th>
                  <th className="text-right py-4 px-5 text-slate-400 font-medium">Annual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {earningsExamples.map((row, i) => (
                  <tr key={i}>
                    <td className="py-4 px-5 font-medium">{row.referrals}</td>
                    <td className="py-4 px-5 text-slate-400">{row.plan}</td>
                    <td className="py-4 px-5 text-right text-green-400 font-semibold">{row.monthly}</td>
                    <td className="py-4 px-5 text-right text-green-400 font-semibold">{row.annual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Marketing Assets */}
      <section className="py-16 border-t border-white/5">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-center mb-4">Marketing Resources</h2>
          <p className="text-center text-slate-400 mb-10">
            Everything you need to promote LinkRescue effectively.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Megaphone, title: 'Banner Ads', description: 'Multiple sizes for your site sidebar, header, and content.' },
              { icon: Users, title: 'Email Templates', description: 'Pre-written emails to send to your newsletter subscribers.' },
              { icon: TrendingUp, title: 'Social Copy', description: 'Ready-to-post tweets, LinkedIn posts, and Facebook updates.' },
              { icon: CheckCircle2, title: 'Product Overview', description: 'Detailed feature breakdown and comparison charts.' },
            ].map((item) => (
              <div key={item.title} className="glass-card p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-500">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-600 mt-6">
            All resources available in your affiliate dashboard after signup.
          </p>
        </div>
      </section>

      {/* Sample Copy */}
      <section className="py-16 border-t border-white/5">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-center mb-4">Sample Copy</h2>
          <p className="text-center text-slate-400 mb-10">Use or adapt these for your promotions.</p>
          <div className="space-y-4">
            <div className="glass-card p-5">
              <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">Blog / Newsletter</p>
              <p className="text-sm text-slate-300 italic">
                &ldquo;I&apos;ve been using LinkRescue to monitor my affiliate links and it&apos;s already caught several broken Amazon links
                that were costing me commissions. If you rely on affiliate income, this tool pays for itself in the first week.
                Try it free at [your-link].&rdquo;
              </p>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">Tweet / Social</p>
              <p className="text-sm text-slate-300 italic">
                &ldquo;Just found 3 broken affiliate links on my site that were losing me money. @LinkRescue_io scans daily
                and alerts you instantly. Game changer for anyone doing affiliate marketing. [your-link]&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 border-t border-white/5">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faq.map((item) => (
              <div key={item.q} className="glass-card p-5">
                <h3 className="font-semibold mb-2">{item.q}</h3>
                <p className="text-sm text-slate-400">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-white/5">
        <div className="container mx-auto px-6 text-center max-w-2xl">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-lg text-slate-400 mb-10">
            Join our affiliate program today and start earning 30% recurring commissions.
            No minimum traffic requirements.
          </p>
          <a
            href={REWARDFUL_SIGNUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-base px-8 py-4"
          >
            Join the Affiliate Program
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center">
                <ExternalLink className="w-3.5 h-3.5 text-slate-900" />
              </div>
              <span className="font-display font-bold">LinkRescue</span>
            </Link>
            <div className="flex items-center gap-8 text-sm text-slate-500">
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
            <p className="text-sm text-slate-600">
              © {new Date().getFullYear()} LinkRescue
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
