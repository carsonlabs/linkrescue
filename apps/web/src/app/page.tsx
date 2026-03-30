import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Mail,
  Search,
  ArrowRight,
  Globe,
  ExternalLink,
  Plus,
  BarChart2,
  Building2,
  EyeOff,
  Layers,
  FileSearch,
  TrendingDown,
  Archive,
} from 'lucide-react';
import { CalculatorTeaser } from '@/components/CalculatorTeaser';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import { ParallaxBlobs, ParallaxFloat } from '@/components/HeroParallax';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recover Lost Affiliate Commissions — Broken Link & Attribution Monitoring',
  description:
    'Find broken affiliate links, stripped tracking params, and silent attribution failures costing you commissions. Daily scans, instant alerts.',
  alternates: {
    canonical: 'https://www.linkrescue.io',
  },
  openGraph: {
    title: 'LinkRescue — Recover Lost Affiliate Commissions',
    description:
      'Your old content is still getting traffic. LinkRescue finds the broken links, stripped parameters, and dead merchant pages that are silently leaking your affiliate revenue.',
    url: 'https://www.linkrescue.io',
    siteName: 'LinkRescue',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LinkRescue — Recover Lost Affiliate Commissions',
    description:
      'Your old content is still getting traffic. LinkRescue finds the broken links and attribution failures that are silently leaking your revenue.',
  },
};

const features = [
  {
    icon: Search,
    title: 'Full-Archive Crawling',
    description:
      'Scans every page on your site — not just your sitemap. Old reviews, roundups, and tutorials that still rank get checked too.',
    color: 'green',
  },
  {
    icon: EyeOff,
    title: 'Attribution Failure Detection',
    description:
      'Catches redirects that silently strip your affiliate tags. The link works, the page loads, but you don\'t get credited.',
    color: 'purple',
  },
  {
    icon: AlertTriangle,
    title: 'Dead Link & Merchant Alerts',
    description:
      'Finds 404s, expired merchant pages, and program shutdowns across your entire content archive before they keep costing you.',
    color: 'green',
  },
  {
    icon: Layers,
    title: 'Every Affiliate Network',
    description:
      'Amazon, ShareASale, Impact, CJ, Awin, Rakuten, PartnerStack — all monitored in one place.',
    color: 'purple',
  },
  {
    icon: BarChart2,
    title: 'Revenue Impact Estimates',
    description:
      'See which broken links are on your highest-traffic pages so you know what to fix first for maximum recovery.',
    color: 'green',
  },
  {
    icon: Mail,
    title: 'Actionable Digests',
    description:
      'Weekly reports with direct links to affected pages. Fix the issues that matter, skip the noise.',
    color: 'purple',
  },
];

const steps = [
  {
    number: '01',
    title: 'Add your site',
    description: 'Enter your domain. We discover every page automatically, including deep archive content.',
  },
  {
    number: '02',
    title: 'Verify ownership',
    description: 'Add a simple meta tag to prove it\'s yours. Takes less than a minute.',
  },
  {
    number: '03',
    title: 'Review your first scan',
    description:
      'See exactly which pages have broken links, stripped parameters, or dead merchant destinations.',
  },
  {
    number: '04',
    title: 'Fix and recover revenue',
    description:
      'Prioritized by traffic and estimated impact. Update the links that matter most first.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <PublicNav />

      {/* Hero Section */}
      <section className="relative min-h-screen pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <ParallaxBlobs />

        <div className="container mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center min-h-[calc(100vh-8rem)]">
            {/* Left Column - Text */}
            <div className="space-y-8 lg:pr-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 badge-green">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Built for affiliate publishers
              </div>

              {/* Headline */}
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.95] tracking-tight">
                Find the broken affiliate links{' '}
                <span className="text-gradient">silently costing you commissions.</span>
              </h1>

              {/* Subhead */}
              <p className="text-lg md:text-xl text-slate-400 max-w-xl leading-relaxed">
                LinkRescue crawls your entire site archive to find broken affiliate links,
                stripped tracking parameters, and silent attribution failures before they
                keep costing you commissions.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/link-checker" className="btn-primary justify-center">
                  Scan your site for leaks
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="#how-it-works" className="btn-secondary justify-center">
                  See how it works
                </Link>
              </div>

              {/* Value prop bullets instead of fake social proof */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  Free for 1 site
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  No credit card required
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  Results in minutes
                </span>
              </div>

              {/* Credibility bar */}
              <div className="border-t border-white/5 pt-6 mt-2">
                <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-medium">
                  Built by an affiliate publisher tired of losing commissions to dead links
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
                  <span>38+ affiliate networks</span>
                  <span className="text-white/10">|</span>
                  <span>6 issue types detected</span>
                  <span className="text-white/10">|</span>
                  <span>Daily autopilot scans</span>
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
                          { domain: 'best-gear-reviews.com', issues: 14, pages: 847, verified: true },
                          { domain: 'deals.niche-blog.com', issues: 3, pages: 234, verified: true },
                          { domain: 'compare-tools.io', issues: 0, pages: 156, verified: false },
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

      {/* Calculator Teaser */}
      <section className="py-10">
        <div className="container mx-auto px-6">
          <CalculatorTeaser />
        </div>
      </section>

      {/* Problem: Old Content Archives */}
      <section className="relative py-24 md:py-32 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 badge-green mb-6">
                <Archive className="w-4 h-4" />
                The hidden problem
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                Your biggest revenue leak is hiding in{' '}
                <span className="text-gradient-purple">old posts</span>
              </h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                Your top leak is rarely this week&apos;s article. It&apos;s usually an old review,
                roundup, or tutorial still getting organic traffic with affiliate links you
                haven&apos;t checked in months.
              </p>
              <p className="text-slate-400 leading-relaxed">
                Merchants change URLs, programs shut down, redirects strip your tracking
                parameters — and the page keeps ranking while you stop earning.
              </p>
            </div>
            <div className="space-y-4">
              {[
                {
                  icon: TrendingDown,
                  title: 'Silent revenue decay',
                  desc: 'Links break gradually as merchants update their sites. No error, no alert — just lost commissions.',
                },
                {
                  icon: FileSearch,
                  title: 'Buried in your archive',
                  desc: 'A 2-year-old review ranking on page 1 with a dead affiliate link is actively losing you money.',
                },
                {
                  icon: EyeOff,
                  title: 'Invisible to you',
                  desc: 'The page loads fine for visitors. The link redirects. But your affiliate tag got stripped along the way.',
                },
              ].map((item) => (
                <div key={item.title} className="glass-card p-5 flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                    <p className="text-sm text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Differentiation: Not Just Broken Links */}
      <section className="relative py-24 md:py-32 border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent" />
        <div className="container mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
              Generic link checkers{' '}
              <span className="text-gradient">miss what matters</span>
            </h2>
            <p className="text-lg text-slate-400">
              Most tools stop at 404s. LinkRescue catches the problems that actually cost
              affiliate publishers money.
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
            {[
              {
                bad: 'Flags broken links on any page',
                good: 'Prioritizes affiliate links on pages that actually get traffic',
              },
              {
                bad: 'Only checks HTTP status codes',
                good: 'Detects redirects that drop tracking parameters mid-chain',
              },
              {
                bad: 'Treats your whole site the same',
                good: 'Understands affiliate URLs from Amazon, ShareASale, Impact, CJ, and more',
              },
              {
                bad: 'Gives you a list of broken URLs',
                good: 'Shows the page, the link, the problem type, and estimated revenue impact',
              },
            ].map((item, i) => (
              <div key={i} className="glass-card p-6 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-400 text-xs font-bold">&times;</span>
                  </span>
                  <p className="text-sm text-slate-500">{item.bad}</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300">{item.good}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 md:py-32">
        <div className="absolute inset-0 bg-dot-pattern opacity-30" />

        <div className="container mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Purpose-built for{' '}
              <span className="text-gradient-purple">affiliate revenue protection</span>
            </h2>
            <p className="text-lg text-slate-400">
              Everything you need to find, fix, and prevent affiliate link failures across your
              content archive.
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
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent" />

        <div className="container mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Get started in <span className="text-gradient">minutes</span>
            </h2>
            <p className="text-lg text-slate-400">
              No code to deploy. Add your site and get your first scan results today.
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

      {/* ICP: Built for Publishers & Agencies */}
      <section className="relative py-24 md:py-32 border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent" />
        <div className="container mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 badge-green mb-6">
              <Building2 className="w-4 h-4" />
              Who it&apos;s for
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
              Built for affiliate publishers{' '}
              <span className="text-gradient-purple">and the agencies that manage them</span>
            </h2>
            <p className="text-lg text-slate-400">
              If you manage a content archive, comparison pages, or multiple affiliate sites,
              LinkRescue shows where revenue is slipping and what to fix first.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: FileSearch,
                title: 'Review & comparison sites',
                description: 'Large archives of product reviews with dozens of affiliate links per page. One broken link per post adds up fast.',
              },
              {
                icon: Layers,
                title: 'Niche content publishers',
                description: 'Hundreds of tutorials, guides, and roundups with embedded affiliate links that quietly decay over time.',
              },
              {
                icon: Globe,
                title: 'Agencies managing client sites',
                description: 'Monitor multiple client sites from one dashboard. Catch issues before your clients notice their revenue dropping.',
              },
            ].map((item, i) => (
              <div key={i} className="glass-card p-6 group hover:border-green-500/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 flex items-center justify-center mb-4 transition-colors">
                  <item.icon className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.description}</p>
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
            <p className="text-lg text-slate-400">Start free with one site. Upgrade when you need more coverage.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <div className="glass-card p-8">
              <div className="mb-6">
                <h3 className="font-display text-xl font-bold mb-2">Starter</h3>
                <p className="text-slate-400 text-sm">Try it on one site, free</p>
              </div>
              <div className="mb-8">
                <span className="font-display text-5xl font-bold">$0</span>
                <span className="text-slate-500">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['1 site', '200 pages per scan', 'Weekly scans', 'Broken link alerts'].map(
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
                <p className="text-slate-400 text-sm">For publishers who care about revenue</p>
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
                  'Revenue impact estimates',
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
                <p className="text-slate-400 text-sm">For teams managing multiple sites</p>
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

      {/* Final CTA */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-purple-500/10 to-transparent" />
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />

        <div className="container mx-auto px-6 relative text-center">
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 max-w-3xl mx-auto">
            Find out what your{' '}
            <span className="text-gradient">content archive</span> is leaking
          </h2>
          <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto">
            Free for one site. No credit card required. First scan results in minutes.
          </p>
          <Link href="/signup" className="btn-primary text-base px-8 py-4">
            Scan your site free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
