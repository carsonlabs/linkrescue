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
  TrendingDown,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';

const features = [
  {
    icon: Search,
    title: 'Deep Link Scanning',
    description:
      'Crawls every page of your site and checks every outbound link — not just your sitemap.',
  },
  {
    icon: AlertTriangle,
    title: 'Broken Link Detection',
    description:
      'Catches 4xx errors, 5xx server failures, timeouts, and unexpected redirects before readers hit them.',
  },
  {
    icon: TrendingDown,
    title: 'Affiliate-Aware',
    description:
      'Detects when affiliate tracking parameters are stripped by redirects, protecting your commissions.',
  },
  {
    icon: Mail,
    title: 'Email Digests',
    description:
      'Get a weekly summary of all new issues with direct links to the affected pages so you can fix fast.',
  },
  {
    icon: Shield,
    title: 'Site Verification',
    description:
      'Ownership verification via meta tag keeps your account secure and prevents unauthorized scans.',
  },
  {
    icon: Zap,
    title: 'Daily Automatic Scans',
    description:
      'Set it and forget it. LinkRescue scans your sites every night and only notifies you when something breaks.',
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
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
              <ExternalLink className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">LinkRescue</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How it works
            </Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-accent/30 to-background pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            Built for affiliate bloggers & content creators
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-3xl mx-auto leading-tight">
            Stop losing revenue to{' '}
            <span className="text-primary">broken affiliate links</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            LinkRescue scans your entire site daily and alerts you the moment an affiliate link
            breaks, expires, or redirects incorrectly. Fix issues before they cost you commissions.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start monitoring free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/pricing">
                View pricing
              </Link>
            </Button>
          </div>

          {/* Dashboard Mockup */}
          <div className="relative mx-auto max-w-4xl">
            <div className="rounded-xl border shadow-2xl bg-card overflow-hidden">
              {/* Mockup header bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/40">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-background border rounded-md px-3 py-1 text-xs text-muted-foreground max-w-xs mx-auto text-center">
                    link-rescue.vercel.app/sites
                  </div>
                </div>
              </div>

              {/* Mockup content */}
              <div className="flex text-left">
                {/* Sidebar */}
                <div className="w-48 border-r bg-muted/20 p-4 hidden md:block">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
                      <ExternalLink className="w-3 h-3 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-sm">LinkRescue</span>
                  </div>
                  <nav className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-accent text-accent-foreground rounded-md font-medium">
                      <Globe className="w-4 h-4" />
                      Sites
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 text-muted-foreground rounded-md">
                      <Mail className="w-4 h-4" />
                      Alerts
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 text-muted-foreground rounded-md">
                      <Shield className="w-4 h-4" />
                      Settings
                    </div>
                  </nav>
                </div>

                {/* Main content */}
                <div className="flex-1 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-sm">Your Sites</h2>
                    <div className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-md font-medium">
                      + Add Site
                    </div>
                  </div>

                  {/* Site cards */}
                  <div className="space-y-2">
                    {[
                      { domain: 'my-affiliate-blog.com', issues: 12, pages: 847, verified: true },
                      { domain: 'deals.example.com', issues: 3, pages: 234, verified: true },
                      { domain: 'review-site.io', issues: 0, pages: 156, verified: false },
                    ].map((site) => (
                      <div
                        key={site.domain}
                        className="border rounded-lg p-3 flex items-center justify-between hover:bg-muted/30 cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{site.domain}</span>
                            {site.verified ? (
                              <Badge variant="success" size="sm">Verified</Badge>
                            ) : (
                              <Badge variant="warning" size="sm">Unverified</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {site.pages} pages · Last scanned today
                          </p>
                        </div>
                        <div className="text-right">
                          {site.issues > 0 ? (
                            <>
                              <span className="text-base font-bold text-destructive">
                                {site.issues}
                              </span>
                              <p className="text-xs text-muted-foreground">issues</p>
                            </>
                          ) : (
                            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              All good
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Issues table preview */}
                  <div className="mt-4 border rounded-lg overflow-hidden">
                    <div className="bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground flex gap-4">
                      <span className="flex-1">Broken Link</span>
                      <span className="w-24">Type</span>
                      <span className="w-16">Code</span>
                    </div>
                    {[
                      {
                        url: 'amzn.to/3abc123',
                        type: '4xx Broken',
                        code: '404',
                        color: 'bg-red-100 text-red-700',
                      },
                      {
                        url: 'shareasale.com/r/xyz...',
                        type: 'Lost Params',
                        code: '301',
                        color: 'bg-blue-100 text-blue-700',
                      },
                      {
                        url: 'partner.shop/deal-...',
                        type: 'Redirect →Home',
                        code: '302',
                        color: 'bg-purple-100 text-purple-700',
                      },
                    ].map((row, i) => (
                      <div
                        key={i}
                        className="px-3 py-2 text-xs border-t flex gap-4 items-center hover:bg-muted/20"
                      >
                        <span className="flex-1 text-blue-600 truncate font-mono">{row.url}</span>
                        <span className={`w-24 px-1.5 py-0.5 rounded-full text-center ${row.color}`}>
                          {row.type}
                        </span>
                        <span className="w-16 text-muted-foreground">{row.code}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-primary/5 rounded-2xl -z-10 blur-2xl" />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-y bg-muted/30 py-12">
        <div className="container mx-auto px-6">
          <p className="text-center text-sm text-muted-foreground mb-8 font-medium uppercase tracking-wider">
            Built to solve real affiliate revenue loss
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto text-center">
            {[
              { stat: '1M+', label: 'Links checked per month' },
              { stat: '< 24h', label: 'Time to detect broken links' },
              { stat: '$0', label: 'To get started — free forever' },
            ].map((item) => (
              <div key={item.stat}>
                <div className="text-3xl font-bold text-primary">{item.stat}</div>
                <div className="text-sm text-muted-foreground mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to keep links healthy
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A complete monitoring solution purpose-built for affiliate marketers and content creators.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="border rounded-xl p-6 hover:border-primary/50 hover:shadow-sm transition-all group"
                >
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Get started in minutes</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              No complex setup. No code to deploy. Just add your site and we handle the rest.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-1/3 right-1/3 h-px bg-border" />
            {steps.map((step, index) => (
              <div key={step.number} className="text-center relative">
                <div className="w-16 h-16 bg-background border-2 border-primary rounded-full flex items-center justify-center mx-auto mb-4 relative z-10">
                  <span className="text-lg font-bold text-primary">{index + 1}</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-muted-foreground text-lg">Start free. Upgrade when you need more.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free */}
            <div className="border rounded-xl p-8 space-y-5">
              <div>
                <h3 className="text-xl font-bold">Free</h3>
                <p className="text-muted-foreground text-sm mt-1">Perfect for getting started</p>
              </div>
              <div className="text-4xl font-bold">
                $0
                <span className="text-base font-normal text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-2.5 text-sm">
                {['1 site', '50 pages per scan', 'Weekly email digests', 'All issue types'].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {item}
                    </li>
                  ),
                )}
              </ul>
              <Link
                href="/signup"
                className="block w-full text-center bg-secondary text-secondary-foreground py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Get started free
              </Link>
            </div>

            {/* Pro */}
            <div className="border-2 border-primary rounded-xl p-8 space-y-5 relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                Most popular
              </div>
              <div>
                <h3 className="text-xl font-bold">Pro</h3>
                <p className="text-muted-foreground text-sm mt-1">For serious affiliate sites</p>
              </div>
              <div className="text-4xl font-bold">
                $29
                <span className="text-base font-normal text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-2.5 text-sm">
                {[
                  '5 sites',
                  '500 pages per scan',
                  'Weekly email digests',
                  'All issue types',
                  'Priority support',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block w-full text-center bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Start monitoring your affiliate links today
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            Free forever for one site. No credit card required. Takes less than 5 minutes to set up.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3.5 rounded-lg font-semibold hover:bg-white/90 transition-colors"
          >
            Get started free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 bg-background">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <ExternalLink className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="font-bold">LinkRescue</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/pricing" className="hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="/login" className="hover:text-foreground transition-colors">
                Sign in
              </Link>
              <Link href="/signup" className="hover:text-foreground transition-colors">
                Sign up
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} LinkRescue. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
