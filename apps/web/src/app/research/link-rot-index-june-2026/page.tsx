import type { Metadata } from 'next';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  FileSearch,
  GitBranch,
  Scale,
  ShieldAlert,
} from 'lucide-react';
import { PublicFooter } from '@/components/PublicFooter';
import { PublicNav } from '@/components/PublicNav';
import {
  JUNE_2026_LINK_ROT_STUDY as study,
  percentage,
} from '@/lib/research/link-rot-index';

const PAGE_URL = 'https://www.linkrescue.io/research/link-rot-index-june-2026';
const number = new Intl.NumberFormat('en-US');

export const metadata: Metadata = {
  title: 'June 2026 Affiliate Link Study Methodology',
  description:
    'Methods, counted results, and limitations for LinkRescue’s June 11, 2026 research scan of 50 affiliate publisher sites.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'June 2026 Affiliate Link Study Methodology',
    description:
      'How LinkRescue counted visible breaks, expired affiliate programs, bot blocks, and incomplete coverage in one bounded research scan — corrected September 2026.',
    url: PAGE_URL,
    type: 'article',
    publishedTime: study.observedOn,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  name: 'LinkRescue June 2026 affiliate link research scan',
  description:
    'A bounded, non-random research scan of public pages on 50 established affiliate publisher sites.',
  url: PAGE_URL,
  datePublished: study.observedOn,
  temporalCoverage: study.observedOn,
  creator: {
    '@type': 'Organization',
    name: 'LinkRescue',
    url: 'https://www.linkrescue.io',
  },
};

const headlineMetrics = [
  {
    value: number.format(study.linksChecked),
    label: 'outbound links checked',
    note: `${number.format(study.linksFound)} found; ${number.format(study.linksSkippedByBudget)} outside the time budget`,
  },
  {
    value: percentage(study.visibleBreaks, study.linksChecked),
    label: 'visibly broken',
    note: `${number.format(study.visibleBreaks)} non-blocked 4xx, 5xx, or timeout observations`,
  },
  {
    value: percentage(study.blockedResponses, study.linksChecked),
    label: 'could not be verified automatically',
    note: `${number.format(study.blockedResponses)} links where the destination blocked or throttled the checker`,
  },
  {
    value: `${study.substantiveSites}/${study.panelSites}`,
    label: 'sites with substantive coverage',
    note: 'The other 16 returned fewer than three public pages and limit site-level conclusions',
  },
] as const;

const methodSteps = [
  {
    icon: FileSearch,
    title: '1. Build a fixed research panel',
    text: 'The panel contained 50 established affiliate publisher sites across several niches. It was curated, not randomly sampled, so it does not represent every publisher or the whole market.',
  },
  {
    icon: GitBranch,
    title: '2. Discover a bounded set of pages',
    text: `The crawler checked sitemap entries first, then used a same-site crawl when needed. It respected robots.txt and capped each site at ${study.limits.maxPagesPerSite} public pages.`,
  },
  {
    icon: Scale,
    title: '3. Enforce the same time limits',
    text: `Each site received a ${study.limits.softBudgetSecondsPerSite}-second soft budget and a ${study.limits.hardStopSecondsPerSite}-second safety stop. ${study.partialBudgetSites} sites returned partial results; skipped links never entered a rate denominator.`,
  },
  {
    icon: CheckCircle2,
    title: '4. Follow each checked link',
    text: `The checker started with HEAD, retried suspicious responses with GET, allowed up to ${study.limits.maxRedirectHops} redirect hops, and used a ${study.limits.requestTimeoutSeconds}-second request timeout.`,
  },
  {
    icon: Bot,
    title: '5. Keep blocks separate from breaks',
    text: `${number.format(study.blockedResponses)} links returned 403, 405 or 429 after the fallback, landed on a bot or captcha page, or were throttled by Amazon with a 5xx. They were labelled unverifiable and excluded from the visibly-broken count. Share buttons and photo credits are not outbound content and are excluded from findings.`,
  },
] as const;

const breakdown = [
  {
    label: 'Non-blocked 4xx',
    count: study.issueBreakdown.broken4xx,
    rate: percentage(study.issueBreakdown.broken4xx, study.linksChecked),
    group: 'Visible break',
  },
  {
    label: '5xx server response',
    count: study.issueBreakdown.server5xx,
    rate: percentage(study.issueBreakdown.server5xx, study.linksChecked),
    group: 'Visible break',
  },
  {
    label: 'Timeout',
    count: study.issueBreakdown.timeout,
    rate: percentage(study.issueBreakdown.timeout, study.linksChecked),
    group: 'Visible break',
  },
  {
    label: 'Affiliate link to an expired partner program',
    count: study.issueBreakdown.expiredProgram,
    rate: percentage(study.issueBreakdown.expiredProgram, study.linksChecked),
    group: 'Affiliate dead end',
  },
  {
    label: 'Tracking tag never reached network or merchant',
    count: study.issueBreakdown.lostParams,
    rate: percentage(study.issueBreakdown.lostParams, study.linksChecked),
    group: 'Affiliate dead end',
  },
  {
    label: 'Deep link redirected to homepage',
    count: study.issueBreakdown.redirectToHome,
    rate: percentage(study.issueBreakdown.redirectToHome, study.linksChecked),
    group: 'Lost context',
  },
  {
    label: 'Bot-blocked or rate-limited',
    count: study.blockedResponses,
    rate: percentage(study.blockedResponses, study.linksChecked),
    group: 'Reported separately',
  },
] as const;

export default function June2026LinkRotMethodologyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen overflow-x-hidden bg-background">
        <PublicNav />
        <main>
          <header className="relative overflow-hidden pb-20 pt-32 md:pb-24 md:pt-40">
            <div className="absolute inset-0 bg-grid-pattern opacity-20" />
            <div className="container relative mx-auto px-6">
              <div className="mx-auto max-w-4xl">
                <div className="badge-green mb-6">Research record · June 11, 2026</div>
                <h1 className="max-w-3xl font-display text-4xl font-bold leading-tight md:text-6xl">
                  What we checked, what we counted, and{' '}
                  <span className="text-gradient">where the data stops.</span>
                </h1>
                <p className="mt-7 max-w-3xl text-lg leading-relaxed text-slate-300 md:text-xl">
                  This is the methodology and limitation record for one bounded scan of 50
                  affiliate publisher sites. It documents observable link behaviour—not market-wide
                  prevalence, customer outcomes, or revenue impact.
                </p>
                <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-400">
                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                    One observed sample
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                    Checked-link denominator only
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                    No revenue estimates
                  </span>
                </div>
              </div>
            </div>
          </header>

          <section className="border-y border-white/5 bg-white/[0.015] py-16">
            <div className="container mx-auto px-6">
              <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {headlineMetrics.map((metric) => (
                  <MetricCard key={metric.label} {...metric} />
                ))}
              </div>
              <p className="mx-auto mt-7 max-w-4xl text-center text-sm leading-relaxed text-slate-500">
                All rates above use the {number.format(study.linksChecked)} links actually checked
                within budget. The {number.format(study.linksSkippedByBudget)} skipped links are not
                silently treated as healthy.
              </p>
            </div>
          </section>

          <section className="py-20 md:py-24">
            <div className="container mx-auto px-6">
              <div className="mx-auto max-w-3xl text-center">
                <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-green-400">
                  Collection method
                </p>
                <h2 className="font-display text-3xl font-bold md:text-4xl">
                  A repeatable crawl, with the shortfalls left visible
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-slate-400">
                  The process was deliberately bounded. Partial coverage is part of the result, not
                  a reason to convert missing observations into zeros.
                </p>
              </div>
              <ol className="mx-auto mt-12 grid max-w-6xl gap-5 md:grid-cols-2">
                {methodSteps.map((step) => (
                  <MethodStep key={step.title} {...step} />
                ))}
              </ol>
            </div>
          </section>

          <section className="border-y border-white/5 bg-white/[0.015] py-20 md:py-24">
            <div className="container mx-auto px-6">
              <div className="mx-auto max-w-3xl text-center">
                <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-green-400">
                  Counting rules
                </p>
                <h2 className="font-display text-3xl font-bold md:text-4xl">
                  Six labels, three reporting groups
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-slate-400">
                  A status-code failure and a tracking failure answer different questions. They are
                  shown separately and never converted into a financial claim.
                </p>
              </div>
              <div className="mx-auto mt-12 max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-slate-950/30">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left text-sm">
                    <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th scope="col" className="px-6 py-4 font-medium">
                          Observation
                        </th>
                        <th scope="col" className="px-6 py-4 text-right font-medium">
                          Count
                        </th>
                        <th scope="col" className="px-6 py-4 text-right font-medium">
                          Checked links
                        </th>
                        <th scope="col" className="px-6 py-4 font-medium">
                          Reporting group
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {breakdown.map((row) => (
                        <tr key={row.label} className="text-slate-300">
                          <th scope="row" className="px-6 py-4 font-medium text-white">
                            {row.label}
                          </th>
                          <td className="px-6 py-4 text-right font-mono">
                            {number.format(row.count)}
                          </td>
                          <td className="px-6 py-4 text-right font-mono">{row.rate}</td>
                          <td className="px-6 py-4 text-slate-400">{row.group}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mx-auto mt-8 max-w-5xl rounded-2xl border border-green-500/20 bg-green-500/[0.06] p-6 md:p-8">
                <p className="font-display text-xl font-semibold text-white">
                  Correction, September 21, 2026
                </p>
                <p className="mt-3 leading-relaxed text-slate-300">
                  This page originally reported{' '}
                  {number.format(study.originallyPublished.attributionFailures)} attribution
                  failures, {number.format(study.originallyPublished.lostParams)} of them tracking
                  parameters that disappeared by the final URL. That was wrong. Our classifier
                  counted any missing parameter as lost — including social share buttons, photo
                  credits, and affiliate networks that consume their own parameters and record the
                  click, which is how they are meant to work. Re-checking the same stored
                  observations with corrected rules found no case of a tracking tag failing to
                  reach the network or merchant. What did hold up:{' '}
                  {number.format(study.issueBreakdown.expiredProgram)} affiliate links sent
                  readers to an expired partner program while still loading normally, and{' '}
                  {number.format(study.visibleBreaks)} links were visibly broken (originally
                  reported as {number.format(study.originallyPublished.visibleBreaks)}; Amazon
                  throttling responses are now counted as unverifiable). The{' '}
                  {number.format(study.linksChecked)}-link denominator still includes the excluded
                  share buttons, so the corrected rates are slightly understated.
                </p>
              </div>
            </div>
          </section>

          <section className="py-20 md:py-24">
            <div className="container mx-auto px-6">
              <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
                <div>
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                    <ShieldAlert className="h-6 w-6 text-amber-400" />
                  </div>
                  <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-amber-400">
                    Read before citing
                  </p>
                  <h2 className="font-display text-3xl font-bold md:text-4xl">
                    What this study cannot establish
                  </h2>
                  <p className="mt-5 leading-relaxed text-slate-400">
                    The honest use of a bounded study is narrow. These findings describe the links
                    observed on this panel, on this date, under these crawl limits.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <LimitCard
                    title="Not a representative sample"
                    text="The 50 sites were curated. The percentages are not a universal rate for publishers, niches, or the web."
                  />
                  <LimitCard
                    title="Not complete site inventories"
                    text={`${study.partialBudgetSites} sites exhausted the soft budget, and only ${study.substantiveSites} returned at least three pages. Results are bounded observations, not full audits.`}
                  />
                  <LimitCard
                    title="Not proof of revenue impact"
                    text="The crawler did not have commission rates, traffic, conversion data, account access, or customer outcomes. No dollar inference is supported."
                  />
                  <LimitCard
                    title="Not permanently current"
                    text="Links, redirects, servers, and bot rules change. The record describes June 11, 2026 and should not be presented as a live measurement."
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="pb-24">
            <div className="container mx-auto px-6 text-center">
              <div className="gradient-border mx-auto max-w-3xl p-8 md:p-10">
                <p className="badge-green mb-5">Apply the same evidence standard</p>
                <h2 className="font-display text-3xl font-bold md:text-4xl">
                  Check a site without pretending the crawler knows its revenue.
                </h2>
                <p className="mx-auto mb-8 mt-5 max-w-2xl leading-relaxed text-slate-400">
                  The free leak snapshot reviews a limited set of public pages and reports observable
                  link behaviour. Fit for deeper work is reviewed separately.
                </p>
                <Link href="/free-scan" className="btn-primary px-8 py-4 text-base">
                  Get a free leak snapshot <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </section>
        </main>
        <PublicFooter />
      </div>
    </>
  );
}

function MetricCard({ value, label, note }: (typeof headlineMetrics)[number]) {
  return (
    <article className="glass-card p-6">
      <p className="font-display text-4xl font-bold text-white">{value}</p>
      <h2 className="mt-2 font-semibold text-slate-200">{label}</h2>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">{note}</p>
    </article>
  );
}

function MethodStep({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <li className="glass-card flex gap-5 p-6 md:p-7">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-500/10">
        <Icon className="h-5 w-5 text-green-400" />
      </div>
      <div>
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">{text}</p>
      </div>
    </li>
  );
}

function LimitCard({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
      <h3 className="font-display font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">{text}</p>
    </article>
  );
}
