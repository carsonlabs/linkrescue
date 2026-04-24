import Link from 'next/link';
import { TrendingDown, ArrowRight, CheckCircle2 } from 'lucide-react';

interface Issue {
  issue_type: string;
  link: {
    href: string;
    is_affiliate: boolean;
  };
}

// Known affiliate-network hosts and their display names. Kept inline so this
// card stays server-renderable with no DB fetch. Matches the seeded set in
// full_rebuild.sql (affiliate_programs).
const NETWORK_RULES: Array<{ name: string; matches: (host: string, href: string) => boolean }> = [
  { name: 'Amazon', matches: (h, href) => h.includes('amzn.') || h.includes('amazon.') || href.includes('amazon.') },
  { name: 'ShareASale', matches: (h) => h.includes('shareasale.') },
  { name: 'CJ Affiliate', matches: (h) => /\b(anrdoezrs|dpbolvw|jdoqocy|kqzyfj|tkqlhce)\.net$/.test(h) },
  { name: 'Impact', matches: (h) => /\b(sjv|pntra|pntrs|pntrac)\./.test(h) },
  { name: 'Rakuten', matches: (h) => h.includes('linksynergy.') || h.includes('rakuten.') },
  { name: 'ClickBank', matches: (h) => h.includes('clickbank.') || h.includes('hop.clickbank.') },
  { name: 'Awin', matches: (h) => h.includes('awin1.') || h.includes('zenaps.') },
  { name: 'ShareASale/FlexOffers', matches: (h) => h.includes('flexlinkspro.') },
  { name: 'Impact.com', matches: (h) => h === 'prf.hn' },
  { name: 'Shopify', matches: (h) => h.includes('shopify.pxf.io') },
  { name: 'Bluehost', matches: (h) => h.includes('bluehost.com/track') },
  { name: 'SiteGround', matches: (h) => h.includes('siteground.com/go') },
  { name: 'NordVPN', matches: (h) => h.includes('go.nordvpn.net') },
];

function classifyHost(href: string): string {
  try {
    const host = new URL(href).hostname.toLowerCase();
    for (const rule of NETWORK_RULES) {
      if (rule.matches(host, href)) return rule.name;
    }
    // Bare root-domain fallback so "rawlinks" still bucket by publisher.
    const parts = host.split('.');
    return parts.length >= 2 ? parts.slice(-2).join('.') : host;
  } catch {
    return 'Other';
  }
}

export function ScanSynthesisCard({
  issues,
  siteId,
  linksChecked,
}: {
  issues: Issue[];
  siteId: string;
  linksChecked: number;
}) {
  if (linksChecked === 0) return null;

  const brokenCount = issues.length;

  if (brokenCount === 0) {
    return (
      <div className="glass-card p-5 flex items-start gap-4 border-green-500/20">
        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm mb-0.5">Clean scan</p>
          <p className="text-xs text-slate-400">
            {linksChecked.toLocaleString()} links checked, all healthy. No revenue at risk.
          </p>
        </div>
      </div>
    );
  }

  // Bucket by inferred network
  const byNetwork = new Map<string, number>();
  for (const issue of issues) {
    const href = (Array.isArray(issue.link) ? issue.link[0] : issue.link)?.href ?? '';
    if (!href) continue;
    const name = classifyHost(href);
    byNetwork.set(name, (byNetwork.get(name) ?? 0) + 1);
  }
  const topNetworks = Array.from(byNetwork.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Matches the existing revenue-calculator.tsx formula: 5% of revenue per
  // broken link, capped at 40%. Conservative default-profile revenue of
  // $1,440/mo (matches the "Niche Blogger (Small)" preset monthly revenue)
  // — users click through to the full calc for their own traffic profile.
  const RISK_PER_LINK = 0.05;
  const DEFAULT_MONTHLY_REV = 1440;
  const riskPct = Math.min(brokenCount * RISK_PER_LINK, 0.4);
  const estAtRisk = Math.round(DEFAULT_MONTHLY_REV * riskPct);

  const netFrag = topNetworks
    .map(([name, count]) => `${count} on ${name}`)
    .join(', ');

  return (
    <div className="glass-card p-5 border-red-500/20">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
          <TrendingDown className="w-5 h-5 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm mb-1">
            {brokenCount} broken link{brokenCount === 1 ? '' : 's'} this scan
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Concentrated in {netFrag || 'a mix of hosts'}.
            {' '}Est. revenue at risk:{' '}
            <span className="font-semibold text-red-300">
              ~${estAtRisk.toLocaleString()}/mo
            </span>{' '}
            <span className="text-slate-600">(niche-blogger baseline)</span>
          </p>
          <Link
            href={`/affiliate-link-revenue-calculator?broken=${brokenCount}&siteId=${siteId}`}
            className="inline-flex items-center gap-1 mt-3 text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            Estimate against your own traffic profile
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
