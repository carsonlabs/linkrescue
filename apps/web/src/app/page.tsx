import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Mail,
  Search,
  Shield,
  Zap,
  ArrowRight,
  Globe,
  ExternalLink,
  Plus,
  BarChart2,
  Building2,
  Webhook,
  Users,
  Star,
  MessageSquare,
  EyeOff,
  Layers,
} from 'lucide-react';
import { CalculatorTeaser } from '@/components/CalculatorTeaser';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import { ParallaxBlobs, ParallaxFloat } from '@/components/HeroParallax';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Broken Affiliate Link Monitoring & Detection',
  description:
    'LinkRescue monitors your affiliate links across every network — catching broken links, stripped tracking parameters, and silent attribution failures before they cost you money.',
  alternates: {
    canonical: 'https://www.linkrescue.io',
  },
  openGraph: {
    title: 'LinkRescue — Stop Losing Revenue to Broken Affiliate Links',
    description:
      'Monitor affiliate links across every network. Catch broken links, stripped parameters, and attribution failures automatically.',
    url: 'https://www.linkrescue.io',
    siteName: 'LinkRescue',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LinkRescue — Stop Losing Revenue to Broken Affiliate Links',
    description:
      'Monitor affiliate links across every network. Catch broken links, stripped parameters, and attribution failures automatically.',
  },
};

const features = [
  {
    icon: Search,
    title: 'Deep Link Scanning',
    description:
      'Crawls every page of your site and checks every outbound link — not just your sitemap.',
    color: 'green',
  },
  {
    icon: AlertTriangle,
    title: 'Broken Link Detection',
    description:
      'Find 404s, 500s, timeouts, and expired merchant pages across your entire site before they cost you.',
    color: 'purple',
  },
  {
    icon: EyeOff,
    title: 'Parameter Strip Detection',
    description:
      'Catch when redirects silently drop your affiliate tags. The link works, the page loads, but you don\'t get paid.',
    color: 'green',
  },
  {
    icon: Layers,
    title: 'Cross-Network Coverage',
    description:
      'Not just Amazon. ShareASale, Impact, CJ, Awin, Rakuten, PartnerStack, and more — all monitored.',
    color: 'purple',
  },
  {
    icon: Mail,
    title: 'Email Digests',
    description:
      'Get a weekly summary of all new issues with direct links to the affected pages so you can fix fast.',
    color: 'green',
  },
  {
    icon: Zap,
    title: 'Daily Automatic Scans',
    description:
      'Set it and forget it. LinkRescue scans your sites every night and only notifies you when something breaks.',
    color: 'purple',
  },
];

const steps = [
  {
    number: '01',
    title: 'Add your site',
    description: 'Enter your domain and optional sitemap URL. We find every page automatically.',
  },
  {
    number: '02',
    title: 'Verify ownership',
    description: 'Add a simple meta tag to your site to prove ownership. Takes less than a minute.',
  },
  {
    number: '03',
    title: 'Get alerts & fix issues',
    description:
      'Receive email digests when broken links are found. Click to see exactly which pages are affected.',
  },
  {
    number: '04',
    title: 'Track your health score',
    description:
      'Monitor your site health over time with monthly reports, trend charts, and affiliate program analytics.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <PublicNav />

      {/* Hero Section - Asymmetric Layout */}
      <section className="relative min-h-screen pt-24 pb-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <ParallaxBlobs />

        <div className="container mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center min-h-[calc(100vh-8rem)]">
            {/* Left Column - Text */}
            <div className="space-y-8 lg:pr-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 badge-green">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Built for affiliate marketers
              </div>

              {/* Headline */}
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.95] tracking-tight">
                Your links look fine.{' '}
                <span className="text-gradient">Your commissions aren&apos;t.</span>
              </h1>

              {/* Subhead */}
              <p className="text-lg md:text-xl text-slate-400 max-w-xl leading-relaxed">
                LinkRescue monitors your affiliate links across every network — catching broken
                links, stripped tracking parameters, and silent attribution failures before they
                cost you money.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/link-checker" className="btn-primary justify-center">
                  Check your links free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="#features" className="btn-secondary justify-center">
                  See how it works
                </Link>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-slate-900 bg-gradient-to-br from-slate-700 to-slate-600"
                    />
                  ))}
                </div>
                <div className="text-sm">
                  <span className="text-white font-semibold">1,000+</span>
                  <span className="text-slate-500"> sites protected</span>
                </div>
              </div>
            </div>

            {/* Right Column - Dashboard Mockup */}
            <div className="relative lg:pl-8">
              <ParallaxFloat>
                {/* Glow Behind */}
                <div className="absolute -inset-4 bg-gradient-to-r from-green-500/20 to-purple-500/20 rounded-3xl blur-2xl" />

                {/* Dashboard Card */}
                <div className="relative glass-card overflow-hidden" aria-hidden="true">
                  {/* Header Bar */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/5">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="bg-slate-800/50 border border-white/10 rounded-md px-3 py-1 text-xs text-slate-500 text-center max-w-xs mx-auto">
                        linkrescue.io/dashboard
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex text-left">
                    {/* Sidebar */}
                    <div className="w-44 border-r border-white/5 bg-white/5 p-4 hidden md:block">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center">
                          <ExternalLink className="w-3 h-3 text-slate-900" />
                        </div>
                        <span className="font-semibold text-sm">LinkRescue</span>
                      </div>
                      <nav className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 px-2 py-1.5 bg-green-500/10 text-green-400 rounded-md font-medium border border-green-500/20">
                          <Globe className="w-4 h-4" />
                          Sites
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1.5 text-slate-500 rounded-md">
                          <Mail className="w-4 h-4" />
                          Alerts
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1.5 text-slate-500 rounded-md">
                          <Shield className="w-4 h-4" />
                          Settings
                        </div>
                      </nav>
                    </div>

                    {/* Main */}
                    <div className="flex-1 p-5">
                      <div className="flex items-center justify-between mb-5">
                        <h2 className="font-semibold text-sm">Your Sites</h2>
                        <div className="text-xs bg-green-500 text-slate-900 px-3 py-1.5 rounded-md font-semibold flex items-center gap-1">
                          <Plus className="w-3.5 h-3.5" />
                          Add Site
                        </div>
                      </div>

                      {/* Site Cards */}
                      <div className="space-y-2.5">
                        {[
                          { domain: 'my-affiliate-blog.com', issues: 12, pages: 847, verified: true },
                          { domain: 'deals.example.com', issues: 3, pages: 234, verified: true },
                          { domain: 'review-site.io', issues: 0, pages: 156, verified: false },
                        ].map((site) => (
                          <div
                            key={site.domain}
                            className="border border-white/10 rounded-lg p-3.5 flex items-center justify-between hover:border-green-500/30 hover:bg-green-500/5 transition-all"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{site.domain}</span>
                                {site.verified ? (
                                  <span className="badge-green text-[10px] px-2 py-0.5">Verified</span>
                                ) : (
                                  <span className="badge-amber text-[10px] px-2 py-0.5">Unverified</span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                {site.pages} pages · Last scanned today
                              </p>
                            </div>
                            <div className="text-right">
                              {site.issues > 0 ? (
                                <>
                                  <span className="text-lg font-bold text-red-400">
                                    {site.issues}
                                  </span>
                                  <p className="text-xs text-slate-500">issues</p>
                                </>
                              ) : (
                                <span className="text-xs text-green-400 font-medium flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  All good
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Issues Table */}
                      <div className="mt-4 border border-white/10 rounded-lg overflow-hidden">
                        <div className="bg-white/5 px-3 py-2 text-xs font-medium text-slate-500 flex gap-4">
                          <span className="flex-1">Broken Link</span>
                          <span className="w-24">Type</span>
                          <span className="w-16">Code</span>
                        </div>
                        {[
                          { url: 'amzn.to/3abc123', type: '4xx Broken', code: '404', color: 'text-red-400 bg-red-500/10' },
                          { url: 'shareasale.com/r/xyz...', type: 'Lost Params', code: '301', color: 'text-blue-400 bg-blue-500/10' },
                          { url: 'partner.shop/deal-...', type: 'Redirect', code: '302', color: 'text-purple-400 bg-purple-500/10' },
                        ].map((row, i) => (
                          <div
                            key={i}
                            className="px-3 py-2 text-xs border-t border-white/5 flex gap-4 items-center hover:bg-white/5"
                          >
                            <span className="flex-1 text-green-400/80 truncate font-mono">{row.url}</span>
                            <span className={`w-24 px-1.5 py-0.5 rounded text-center ${row.color}`}>
                              {row.type}
                            </span>
                            <span className="w-16 text-slate-500">{row.code}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Scanning Animation */}
                  <div className="scan-line" />
                </div>
              </ParallaxFloat>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-16 border-y border-white/5 bg-white/[0.02]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {[
              { stat: '1M+', label: 'Links monitored' },
              { stat: '< 24h', label: 'Detection time' },
              { stat: '$50K+', label: 'Revenue protected' },
              { stat: '12K+', label: 'Attribution failures caught' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="font-display text-4xl md:text-5xl font-bold text-gradient mb-2">
                  {item.stat}
                </div>
                <div className="text-sm text-slate-500">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calculator Teaser */}
      <section className="py-10">
        <div className="container mx-auto px-6">
          <CalculatorTeaser />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 md:py-32">
        <div className="absolute inset-0 bg-dot-pattern opacity-30" />

        <div className="container mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Everything you need to{' '}
              <span className="text-gradient-purple">protect your attribution</span>
            </h2>
            <p className="text-lg text-slate-400">
              From dead links to silently stripped parameters — a complete monitoring solution
              purpose-built for affiliate marketers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto stagger-children">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="feature-card group"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors ${
                    feature.color === 'green'
                      ? 'bg-green-500/10 group-hover:bg-green-500/20'
                      : 'bg-purple-500/10 group-hover:bg-purple-500/20'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      feature.color === 'green' ? 'text-green-400' : 'text-purple-400'
                    }`} />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-3">{feature.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="relative py-24 md:py-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent" />

        <div className="container mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Get started in <span className="text-gradient">minutes</span>
            </h2>
            <p className="text-lg text-slate-400">
              No complex setup. No code to deploy. Just add your site and we handle the rest.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {/* Connector line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-1/6 right-1/6 h-px">
              <div className="h-full bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
            </div>

            {steps.map((step, index) => (
              <div key={step.number} className="relative text-center group">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center mx-auto mb-6 relative z-10 group-hover:border-green-500/30 transition-colors">
                  <span className="font-display text-2xl font-bold text-gradient">
                    {index + 1}
                  </span>
                </div>
                <h3 className="font-display font-semibold text-xl mb-3">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative py-24 md:py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Simple, transparent <span className="text-gradient-purple">pricing</span>
            </h2>
            <p className="text-lg text-slate-400">Start free. Upgrade when you need more.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <div className="glass-card p-8">
              <div className="mb-6">
                <h3 className="font-display text-xl font-bold mb-2">Starter</h3>
                <p className="text-slate-400 text-sm">Perfect for getting started</p>
              </div>
              <div className="mb-8">
                <span className="font-display text-5xl font-bold">$0</span>
                <span className="text-slate-500">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['1 site', '200 pages per scan', 'Weekly scans', 'Basic broken link alerts'].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                      {item}
                    </li>
                  ),
                )}
              </ul>
              <Link href="/signup" className="btn-secondary w-full justify-center">
                Get started free
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="relative gradient-border p-8 md:-mt-4 md:mb-4">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="badge-green text-xs">Most popular</span>
              </div>
              <div className="mb-6">
                <h3 className="font-display text-xl font-bold mb-2">Pro</h3>
                <p className="text-slate-400 text-sm">For serious affiliate marketers</p>
              </div>
              <div className="mb-8">
                <span className="font-display text-5xl font-bold text-gradient">$29</span>
                <span className="text-slate-500">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  '5 sites',
                  '2,000 pages per scan',
                  'Daily scans',
                  'Revenue estimates',
                  'Fix suggestions',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn-primary w-full justify-center">
                Start free trial
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Agency Plan */}
            <div className="glass-card p-8">
              <div className="mb-6">
                <h3 className="font-display text-xl font-bold mb-2">Agency</h3>
                <p className="text-slate-400 text-sm">For agencies & power users</p>
              </div>
              <div className="mb-8">
                <span className="font-display text-5xl font-bold">$79</span>
                <span className="text-slate-500">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  '25 sites',
                  'Unlimited pages per scan',
                  'Hourly scans',
                  'API access & webhooks',
                  'Slack integration',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn-secondary w-full justify-center border-green-500/30">
                Start Agency trial
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="relative py-24 md:py-32 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Trusted by <span className="text-gradient">affiliate marketers</span>
            </h2>
            <p className="text-lg text-slate-400">
              See what our users say about protecting their affiliate revenue.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                quote: "LinkRescue caught 14 broken Amazon links on my site that had been losing me commissions for months. Paid for itself in the first week.",
                name: 'Sarah M.',
                role: 'Tech Review Blogger',
                rating: 5,
              },
              {
                quote: "The health score reports are fantastic. I can see at a glance which of my 12 sites need attention, and the affiliate parameter tracking is a game changer.",
                name: 'James K.',
                role: 'Affiliate Agency Owner',
                rating: 5,
              },
              {
                quote: "I used to manually check links every quarter. Now I get notified the same day something breaks. My earnings are up 20% since I stopped losing clicks to dead links.",
                name: 'Maria L.',
                role: 'Travel Content Creator',
                rating: 5,
              },
            ].map((testimonial, i) => (
              <div key={i} className="glass-card p-6 flex flex-col">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed flex-1 mb-4">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-sm font-bold">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{testimonial.name}</p>
                    <p className="text-xs text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Agencies */}
      <section className="relative py-24 md:py-32 border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent" />
        <div className="container mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 badge-green mb-6">
              <Building2 className="w-4 h-4" />
              For Agencies
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Scale affiliate monitoring{' '}
              <span className="text-gradient-purple">across all your clients</span>
            </h2>
            <p className="text-lg text-slate-400">
              The Agency plan gives you everything you need to manage affiliate link health at scale.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Globe,
                title: '25 Sites',
                description: 'Monitor up to 25 client sites from a single dashboard with unlimited pages per scan.',
              },
              {
                icon: Zap,
                title: 'Hourly Scans',
                description: 'Catch issues within the hour, not overnight. Critical for high-traffic affiliate sites.',
              },
              {
                icon: Webhook,
                title: 'API & Webhooks',
                description: 'Integrate with your existing tools. Trigger scans programmatically and receive real-time alerts.',
              },
              {
                icon: MessageSquare,
                title: 'Slack Integration',
                description: 'Get broken link alerts and scan summaries directly in your team Slack channels.',
              },
              {
                icon: BarChart2,
                title: 'Health Reports',
                description: 'Monthly health reports with trend data, affiliate program analytics, and revenue impact estimates.',
              },
              {
                icon: Users,
                title: 'Priority Support',
                description: 'Dedicated support with faster response times and help setting up complex integrations.',
              },
            ].map((item, i) => (
              <div key={i} className="glass-card p-6 group hover:border-purple-500/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 flex items-center justify-center mb-4 transition-colors">
                  <item.icon className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/signup" className="btn-primary text-base px-8 py-4">
              Start Agency trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-slate-500 mt-3">$79/month or $790/year (save 17%)</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-purple-500/10 to-transparent" />
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />

        <div className="container mx-auto px-6 relative text-center">
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 max-w-3xl mx-auto">
            Start monitoring your{' '}
            <span className="text-gradient">affiliate links</span> today
          </h2>
          <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto">
            Free forever for one site. No credit card required. Takes less than 5 minutes to set up.
          </p>
          <Link href="/signup" className="btn-primary text-base px-8 py-4">
            Get started free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
