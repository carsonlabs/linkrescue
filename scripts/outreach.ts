#!/usr/bin/env npx tsx
/**
 * LinkRescue Outreach Pipeline
 *
 * Usage:
 *   cd linkrescue && npx tsx scripts/outreach.ts travelblog.com
 *   cd linkrescue && npx tsx scripts/outreach.ts travelblog.com --max-pages 50
 *   cd linkrescue && npx tsx scripts/outreach.ts travelblog.com --email owner@blog.com
 *
 * What it does:
 *   1. Crawls the blog and discovers pages (sitemap → fallback crawl)
 *   2. Extracts outbound links and checks each one
 *   3. Filters out non-affiliate domains (social, editorial, etc.)
 *   4. Generates a branded PDF report with paginated findings
 *   5. Drafts a personalized outreach email
 *   6. Saves everything to outreach-output/<domain>/
 */

import { crawlSite, discoverPages } from "@linkrescue/crawler";
import { extractOutboundLinks } from "@linkrescue/crawler";
import { checkLink } from "@linkrescue/crawler";
import { DomainLimiter } from "@linkrescue/crawler";
import PDFDocument from "pdfkit";
import { createWriteStream, mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";

// ── Config ──────────────────────────────────────────────────────────────────

const BRAND = {
  name: "Carson Roell",
  company: "LinkRescue",
  email: "carson@linkrescue.io",
  site: "linkrescue.io",
  calendarLink: "https://cal.com/carsonroell/linkrescue",
  tagline: "Systematic affiliate link auditing & recovery",
  color: { primary: "#2dd4a8", dark: "#1a2332", text: "#e2e8f0", muted: "#94a3b8" },
};

// ── Non-affiliate domain filter ─────────────────────────────────────────────
// These are social media, editorial, and utility sites — NOT affiliate links.
// Broken links to these are "site health" issues, not revenue issues.
const NON_AFFILIATE_DOMAINS = new Set([
  // Social media
  "twitter.com", "x.com", "facebook.com", "instagram.com", "tiktok.com",
  "linkedin.com", "pinterest.com", "threads.net", "mastodon.social",
  "youtube.com", "youtu.be", "reddit.com", "tumblr.com", "snapchat.com",
  // Media / editorial
  "medium.com", "substack.com", "wordpress.com", "blogger.com",
  "nytimes.com", "washingtonpost.com", "theguardian.com", "bbc.com",
  "cnn.com", "forbes.com", "usatoday.com", "huffpost.com",
  // Podcasts / music
  "podcasts.apple.com", "open.spotify.com", "soundcloud.com",
  "music.apple.com", "podcasts.google.com",
  // Utilities / tools
  "unsplash.com", "pexels.com", "canva.com", "docs.google.com",
  "drive.google.com", "maps.google.com", "google.com",
  // Portfolio / CV
  "read.cv", "about.me", "linktree.com", "linktr.ee", "bio.link",
  // Developer
  "github.com", "gitlab.com", "stackoverflow.com", "codepen.io",
  // News aggregators
  "travelpulse.com", "bestcompany.com", "ladiesgetpaid.com",
  "keh.com", "muckrack.com",
  // Misc
  "archive.org", "wikipedia.org", "wikimedia.org",
]);

// ── Known affiliate network domains ─────────────────────────────────────────
// If a link goes through one of these, it's definitely an affiliate link
const KNOWN_AFFILIATE_DOMAINS = new Set([
  // Affiliate networks & tracking
  "amzn.to", "amazon.com", "amazon.ca", "amazon.co.uk",
  "shareasale.com", "shrsl.com",
  "commission-junction.com", "anrdoezrs.net", "dpbolvw.net", "jdoqocy.com", "kqzyfj.com", "tkqlhce.com",
  "awin1.com", "zenaps.com",
  "avantlink.com",
  "partnerize.com", "prf.hn",
  "impact.com", "sjv.io",
  "linksynergy.com", "click.linksynergy.com",
  "flexoffers.com",
  "rakuten.com", "click.rakutenadvertising.com",
  // Travel affiliate
  "booking.com", "agoda.com", "hotels.com",
  "viator.com", "getyourguide.com",
  "hostelworld.com", "expedia.com",
  "rentalcars.com", "discovercars.com",
  "worldnomads.com", "safetywing.com",
  "skyscanner.com", "kayak.com", "kiwi.com",
  "stay22.com", "travelpayouts.com",
  // Link shorteners (affiliate-style)
  "geni.us", "tidd.ly", "rstyle.me", "go.magik.ly",
  "bit.ly", "tinyurl.com",
  // SaaS / tech affiliate
  "bluehost.com", "siteground.com", "hostinger.com",
  "semrush.com", "ahrefs.com",
  // E-commerce affiliate
  "shopify.com", "etsy.com",
  "bhphotovideo.com", "adorama.com",
]);

function isNonAffiliateDomain(href: string): boolean {
  try {
    const hostname = new URL(href).hostname.replace(/^www\./, "");
    return NON_AFFILIATE_DOMAINS.has(hostname);
  } catch {
    return false;
  }
}

function isKnownAffiliateDomain(href: string): boolean {
  try {
    const hostname = new URL(href).hostname.replace(/^www\./, "");
    // Check exact match
    if (KNOWN_AFFILIATE_DOMAINS.has(hostname)) return true;
    // Check parent domain (e.g., "shop.amazon.com" → "amazon.com")
    const parts = hostname.split(".");
    if (parts.length > 2) {
      const parent = parts.slice(-2).join(".");
      if (KNOWN_AFFILIATE_DOMAINS.has(parent)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Classify a link: "affiliate" (known network), "editorial" (local biz / direct link), or "non-affiliate" (social/media)
function classifyLink(href: string, crawlerSaysAffiliate: boolean): "affiliate" | "editorial" | "non-affiliate" {
  if (isNonAffiliateDomain(href)) return "non-affiliate";
  if (isKnownAffiliateDomain(href)) return "affiliate";
  if (crawlerSaysAffiliate) return "affiliate"; // crawler detected affiliate params
  return "editorial"; // direct link to a business — not an affiliate link
}

// Revenue estimates per issue type — CONSERVATIVE
// Only applied to confirmed affiliate links
const REVENUE_ESTIMATES: Record<string, { min: number; max: number; severity: string }> = {
  BROKEN_4XX: { min: 15, max: 60, severity: "High" },
  SERVER_5XX: { min: 10, max: 40, severity: "High" },
  TIMEOUT: { min: 5, max: 20, severity: "Medium" },
  REDIRECT_TO_HOME: { min: 8, max: 30, severity: "Medium" },
  LOST_PARAMS: { min: 10, max: 35, severity: "Medium" },
  SOFT_404: { min: 12, max: 50, severity: "High" },
  CONTENT_CHANGED: { min: 3, max: 15, severity: "Low" },
};

interface AuditIssue {
  pageUrl: string;
  linkHref: string;
  issueType: string;
  statusCode: number | null;
  isAffiliate: boolean;
  isNonAffiliate: boolean; // social/editorial — not revenue-impacting
  severity: string;
  estLossMin: number;
  estLossMax: number;
}

// ── Parse args ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const domain = args[0]?.replace(/^https?:\/\//, "").replace(/\/+$/, "");

if (!domain) {
  console.error("Usage: npx tsx scripts/outreach.ts <domain> [--max-pages N] [--email addr]");
  process.exit(1);
}

const maxPagesIdx = args.indexOf("--max-pages");
const maxPages = maxPagesIdx > -1 ? parseInt(args[maxPagesIdx + 1]!, 10) : 30;

const emailIdx = args.indexOf("--email");
const prospectEmail = emailIdx > -1 ? args[emailIdx + 1] : null;

const blogNameIdx = args.indexOf("--name");
const blogName = blogNameIdx > -1 ? args.slice(blogNameIdx + 1).join(" ") : domain;

main().catch((err) => { console.error(err); process.exit(1); });

async function main() {
// ── Step 1: Crawl ───────────────────────────────────────────────────────────

console.log(`\n🔍 LinkRescue Outreach Pipeline`);
console.log(`   Domain: ${domain}`);
console.log(`   Max pages: ${maxPages}\n`);

console.log(`[1/4] Discovering pages...`);
let urls: string[] = [];
try {
  urls = await discoverPages(domain, null, maxPages);
  console.log(`   Found ${urls.length} URLs from sitemap`);
} catch {
  console.log(`   No sitemap, falling back to crawl...`);
}

if (urls.length === 0) {
  urls = await crawlSite(domain, 2, maxPages);
  console.log(`   Crawled ${urls.length} URLs`);
}

if (urls.length === 0) {
  console.error("   No pages found. Check the domain and try again.");
  process.exit(1);
}

// ── Step 2: Extract & check links ───────────────────────────────────────────

console.log(`\n[2/4] Checking links across ${urls.length} pages...`);

const issues: AuditIssue[] = [];
let totalLinks = 0;
let pagesScanned = 0;
const domainLimiter = new DomainLimiter();

for (const pageUrl of urls) {
  try {
    const res = await fetch(pageUrl, {
      signal: AbortSignal.timeout(10_000),
      headers: { "User-Agent": "LinkRescue-Outreach/1.0 (+https://linkrescue.io)" },
    });
    if (!res.ok) continue;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html")) continue;

    const html = await res.text();
    const links = extractOutboundLinks(html, domain);
    totalLinks += links.length;
    pagesScanned++;

    process.stdout.write(`   [${pagesScanned}/${urls.length}] ${new URL(pageUrl).pathname} — ${links.length} links\r`);

    // Deduplicate: same URL on same page should only be checked/counted once
    const seenOnPage = new Set<string>();

    for (const link of links) {
      // Normalize URL for dedup (strip trailing slash, lowercase)
      let normalizedHref = link.href.toLowerCase().replace(/\/+$/, "");
      if (seenOnPage.has(normalizedHref)) continue;
      seenOnPage.add(normalizedHref);

      try {
        const hostname = new URL(link.href).hostname;
        await domainLimiter.acquire(hostname);
      } catch { /* skip invalid URLs */ }

      const result = await checkLink(link);

      if (result.issueType !== "OK") {
        const linkClass = classifyLink(link.href, result.isAffiliate);
        const rev = REVENUE_ESTIMATES[result.issueType] ?? { min: 3, max: 10, severity: "Low" };

        // Only confirmed affiliate links get revenue estimates
        // Editorial links (local businesses, direct links) = $0 revenue impact
        let estMin = 0;
        let estMax = 0;
        if (linkClass === "affiliate") {
          estMin = rev.min;
          estMax = rev.max;
        }

        issues.push({
          pageUrl,
          linkHref: link.href,
          issueType: result.issueType,
          statusCode: result.statusCode,
          isAffiliate: linkClass === "affiliate",
          isNonAffiliate: linkClass !== "affiliate",
          severity: linkClass === "affiliate" ? rev.severity : "Low",
          estLossMin: estMin,
          estLossMax: estMax,
        });
      }
    }
  } catch {
    // page fetch failed, skip
  }
}

console.log(`\n   Done: ${pagesScanned} pages, ${totalLinks} links, ${issues.length} issues found`);

// Sort: affiliate issues first (by revenue desc), then non-affiliate
issues.sort((a, b) => {
  if (a.isNonAffiliate !== b.isNonAffiliate) return a.isNonAffiliate ? 1 : -1;
  return b.estLossMax - a.estLossMax;
});

// ── Stats ───────────────────────────────────────────────────────────────────

const affiliateIssues = issues.filter((i) => !i.isNonAffiliate);
const nonAffiliateIssues = issues.filter((i) => i.isNonAffiliate);
const brokenAffiliateCount = affiliateIssues.filter((i) => ["BROKEN_4XX", "SERVER_5XX", "SOFT_404"].includes(i.issueType)).length;
const brokenNonAffiliateCount = nonAffiliateIssues.filter((i) => ["BROKEN_4XX", "SERVER_5XX", "SOFT_404"].includes(i.issueType)).length;
const expiredCount = affiliateIssues.filter((i) => i.issueType === "CONTENT_CHANGED").length;
const lostParamsCount = affiliateIssues.filter((i) => i.issueType === "LOST_PARAMS").length;
const redirectCount = affiliateIssues.filter((i) => i.issueType === "REDIRECT_TO_HOME").length;
const totalEstLoss = affiliateIssues.reduce((sum, i) => sum + Math.round((i.estLossMin + i.estLossMax) / 2), 0);

// Count unique pages with issues
const pagesWithIssues = new Set(issues.map((i) => i.pageUrl)).size;

console.log(`   Affiliate issues: ${affiliateIssues.length} (${brokenAffiliateCount} broken)`);
console.log(`   Site health issues: ${nonAffiliateIssues.length} (social/editorial broken links)`);
console.log(`   Estimated affiliate revenue at risk: $${totalEstLoss}/mo`);

// ── Step 3: Generate PDF ────────────────────────────────────────────────────

console.log(`\n[3/4] Generating PDF report...`);

const outDir = resolve(import.meta.dirname ?? ".", "outreach-output", domain.replace(/[^a-zA-Z0-9.-]/g, "_"));
mkdirSync(outDir, { recursive: true });

const pdfPath = resolve(outDir, `${domain}-audit-report.pdf`);
const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

await generatePDF(pdfPath, {
  blogName,
  domain,
  date: today,
  totalLinks,
  brokenAffiliateCount,
  brokenNonAffiliateCount,
  expiredCount,
  lostParamsCount,
  redirectCount,
  totalEstLoss,
  affiliateIssues,
  nonAffiliateIssues,
  pagesScanned,
  pagesWithIssues,
});

console.log(`   Saved: ${pdfPath}`);

// ── Step 4: Draft email ─────────────────────────────────────────────────────

console.log(`\n[4/4] Drafting outreach email...`);

const emailDraft = generateEmailDraft({
  blogName,
  domain,
  brokenAffiliateCount,
  brokenNonAffiliateCount,
  totalEstLoss,
  affiliateIssueCount: affiliateIssues.length,
  totalIssueCount: issues.length,
  prospectEmail,
  pagesWithIssues,
});

const emailPath = resolve(outDir, `email-draft.md`);
writeFileSync(emailPath, emailDraft, "utf-8");
console.log(`   Saved: ${emailPath}`);

// Also save raw data as JSON for reference
const dataPath = resolve(outDir, `audit-data.json`);
writeFileSync(dataPath, JSON.stringify({
  domain,
  scannedAt: new Date().toISOString(),
  pagesScanned,
  totalLinks,
  issues,
  stats: {
    brokenAffiliateCount,
    brokenNonAffiliateCount,
    expiredCount,
    lostParamsCount,
    redirectCount,
    totalEstLoss,
    pagesWithIssues,
    affiliateIssueCount: affiliateIssues.length,
    nonAffiliateIssueCount: nonAffiliateIssues.length,
  },
}, null, 2), "utf-8");

console.log(`\n✅ Outreach package ready: ${outDir}`);
console.log(`   📄 PDF Report: ${domain}-audit-report.pdf`);
console.log(`   📧 Email Draft: email-draft.md`);
console.log(`   📊 Raw Data: audit-data.json`);
if (prospectEmail) {
  console.log(`\n   To send: review the email draft, then use your email client.`);
}
console.log();
} // end main()

// ── PDF Generator ───────────────────────────────────────────────────────────

interface PDFData {
  blogName: string;
  domain: string;
  date: string;
  totalLinks: number;
  brokenAffiliateCount: number;
  brokenNonAffiliateCount: number;
  expiredCount: number;
  lostParamsCount: number;
  redirectCount: number;
  totalEstLoss: number;
  affiliateIssues: AuditIssue[];
  nonAffiliateIssues: AuditIssue[];
  pagesScanned: number;
  pagesWithIssues: number;
}

function generatePDF(path: string, data: PDFData): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50, autoFirstPage: false });
    const stream = createWriteStream(path);
    doc.pipe(stream);

    const W = 595.28; // A4 width
    const H = 841.89; // A4 height
    const M = 50;
    const CW = W - M * 2; // content width
    const FOOTER_Y = 800;
    let currentPage = 0;

    function newPage(bg: string = "#ffffff") {
      doc.addPage();
      currentPage++;
      doc.rect(0, 0, W, H).fill(bg);
    }

    function addFooter() {
      doc.save();
      doc.moveTo(M, FOOTER_Y).lineTo(W - M, FOOTER_Y).lineWidth(0.5).stroke("#e2e8f0");
      doc.fontSize(7).fillColor("#94a3b8")
        .text(`Affiliate Link Health Report  |  Prepared by ${BRAND.name}  |  ${BRAND.company}`, M, FOOTER_Y + 8, { lineBreak: false })
        .text(`Page ${currentPage}`, W - M - 30, FOOTER_Y + 8, { lineBreak: false });
      doc.restore();
    }

    // ── Page 1: Cover ─────────────────────────────────────────────────────

    newPage("#1a2332");

    // Accent bar at top
    doc.rect(0, 0, W, 6).fill("#2dd4a8");

    // Title
    doc.fontSize(36).fillColor("#ffffff").text("Affiliate Link", M, 160, { width: CW });
    doc.text("Health Report", M, 205, { width: CW });

    // Blog name
    doc.fontSize(20).fillColor("#2dd4a8").text(data.blogName, M, 280, { width: CW });

    // Date
    doc.fontSize(12).fillColor("#94a3b8").text(data.date, M, 315, { width: CW });

    // Divider
    doc.moveTo(M, 350).lineTo(M + 200, 350).lineWidth(2).stroke("#2dd4a8");

    // Prepared by
    doc.fontSize(10).fillColor("#94a3b8").text("Prepared by", M, 375);
    doc.fontSize(14).fillColor("#ffffff").text(BRAND.name, M, 392);
    doc.fontSize(11).fillColor("#2dd4a8").text(BRAND.company, M, 412);

    // Footer tagline
    doc.fontSize(9).fillColor("#64748b").text(BRAND.tagline, M, 780);

    // ── Page 2: Executive Summary ─────────────────────────────────────────

    newPage();

    // Section header
    sectionHeader(doc, "Executive Summary", M, 50);

    doc.fontSize(10).fillColor("#475569")
      .text(`This report summarizes the results of an automated link audit of ${data.blogName}.`, M, 100, { width: CW })
      .text(`We scanned ${data.pagesScanned} pages and checked ${data.totalLinks} outbound links for broken destinations, missing tracking, and redirect issues.`, M, 115, { width: CW });

    // Stat boxes — 2x2 grid
    const boxW = (CW - 20) / 2;
    const boxH = 65;
    const boxY = 155;

    statBox(doc, M, boxY, boxW, boxH, String(data.totalLinks), "Total Links Checked", "#f8fafc", "#1e293b");
    statBox(doc, M + boxW + 20, boxY, boxW, boxH, String(data.brokenAffiliateCount), "Broken Affiliate Links", "#fef2f2", "#dc2626");
    statBox(doc, M, boxY + boxH + 15, boxW, boxH, String(data.pagesWithIssues), "Pages With Issues", "#fefce8", "#ca8a04");
    statBox(doc, M + boxW + 20, boxY + boxH + 15, boxW, boxH, String(data.lostParamsCount), "Missing Tracking Tags", "#f0fdf4", "#16a34a");

    // Revenue at risk banner — only if there's actual affiliate revenue at risk
    const bannerY = boxY + (boxH + 15) * 2 + 20;
    if (data.totalEstLoss > 0) {
      doc.roundedRect(M, bannerY, CW, 70, 8).fill("#1a2332");
      doc.fontSize(8).fillColor("#2dd4a8").text("ESTIMATED MONTHLY AFFILIATE REVENUE AT RISK", M + 20, bannerY + 12);
      doc.fontSize(28).fillColor("#ffffff").text(`$${data.totalEstLoss.toLocaleString()}`, M + 20, bannerY + 28);
      doc.fontSize(10).fillColor("#94a3b8").text("per month", M + CW - 100, bannerY + 40);
    }

    // Issue breakdown table
    const tableY = (data.totalEstLoss > 0 ? bannerY + 95 : bannerY + 10);
    doc.fontSize(14).fillColor("#1e293b").text("Issue Breakdown", M, tableY);

    const tableStartY = tableY + 25;
    const cols = [M, M + 230, M + 290, M + 360, M + 430];
    const colLabels = ["Category", "Count", "Severity", "Status"];

    // Header row
    doc.rect(M, tableStartY, CW, 22).fill("#f1f5f9");
    doc.fontSize(8).fillColor("#64748b");
    colLabels.forEach((label, i) => doc.text(label, cols[i]! + 8, tableStartY + 7, { lineBreak: false }));

    const rows = [
      { cat: "Broken affiliate / partner links", count: data.brokenAffiliateCount, sev: "High", sevColor: "#dc2626", status: "Critical" },
      { cat: "Missing UTM / tracking parameters", count: data.lostParamsCount, sev: "Medium", sevColor: "#ca8a04", status: "Review" },
      { cat: "Redirect chain issues (3+ hops)", count: data.redirectCount, sev: "Medium", sevColor: "#ca8a04", status: "Monitor" },
      { cat: "Content changed (possible deprecation)", count: data.expiredCount, sev: "Low", sevColor: "#16a34a", status: "Review" },
      { cat: "Broken non-affiliate links (social, editorial)", count: data.brokenNonAffiliateCount, sev: "Low", sevColor: "#64748b", status: "Optional" },
    ];

    rows.forEach((row, i) => {
      const y = tableStartY + 22 + i * 24;
      if (i % 2 === 1) doc.rect(M, y, CW, 24).fill("#f8fafc");
      doc.fontSize(9).fillColor("#334155").text(row.cat, cols[0]! + 8, y + 7, { width: 220, lineBreak: false });
      doc.text(String(row.count), cols[1]! + 8, y + 7, { lineBreak: false });
      doc.fillColor(row.sevColor).text(row.sev, cols[2]! + 8, y + 7, { lineBreak: false });
      doc.fillColor("#475569").text(row.status, cols[3]! + 8, y + 7, { lineBreak: false });
    });

    addFooter();

    // ── Pages 3+: Detailed Findings (paginated) ──────────────────────────

    // Only show affiliate issues in the detailed table (the money issues)
    const displayIssues = data.affiliateIssues.length > 0 ? data.affiliateIssues : data.nonAffiliateIssues;
    const ROW_HEIGHT = 28;
    const HEADER_HEIGHT = 22;
    const TABLE_TOP = 135;
    const MAX_Y = FOOTER_Y - 40; // leave room for footer + total row
    let isFirstFindingsPage = true;

    let rowIdx = 0;
    while (rowIdx < displayIssues.length) {
      newPage();

      if (isFirstFindingsPage) {
        sectionHeader(doc, "Detailed Findings", M, 50);
        doc.fontSize(10).fillColor("#475569")
          .text("The following table lists each issue found during the audit, sorted by estimated revenue impact. Only affiliate and partner links are shown — social media and editorial links are excluded.", M, 100, { width: CW });
        isFirstFindingsPage = false;
      } else {
        doc.fontSize(12).fillColor("#94a3b8").text("Detailed Findings (continued)", M, 55, { width: CW });
      }

      const startY = isFirstFindingsPage ? TABLE_TOP : 85;
      const dCols = [M, M + 130, M + 270, M + 360, M + 430];
      const dLabels = ["Page URL", "Broken Link", "Issue Type", "Severity", "Est. Loss/mo"];

      // Table header
      doc.rect(M, startY, CW, HEADER_HEIGHT).fill("#f1f5f9");
      doc.fontSize(8).fillColor("#64748b");
      dLabels.forEach((label, i) => doc.text(label, dCols[i]! + 5, startY + 7, { lineBreak: false }));

      let y = startY + HEADER_HEIGHT;

      while (rowIdx < displayIssues.length && y + ROW_HEIGHT < MAX_Y) {
        const issue = displayIssues[rowIdx]!;
        const rowBg = rowIdx % 2 === 1;
        if (rowBg) doc.rect(M, y, CW, ROW_HEIGHT).fill("#f8fafc");

        // Page path
        let pagePath = issue.pageUrl;
        try { pagePath = new URL(issue.pageUrl).pathname; } catch {}
        if (pagePath.length > 30) pagePath = pagePath.slice(0, 28) + "...";
        doc.fontSize(7).fillColor("#2dd4a8").text(pagePath, dCols[0]! + 5, y + 5, { width: 120, lineBreak: false });
        doc.fontSize(6).fillColor("#94a3b8").text(data.domain, dCols[0]! + 5, y + 16, { width: 120, lineBreak: false });

        // Link domain
        let linkDisplay = issue.linkHref;
        try {
          const u = new URL(issue.linkHref);
          linkDisplay = u.hostname.replace(/^www\./, "") + u.pathname.slice(0, 25);
          if (u.pathname.length > 25) linkDisplay += "...";
        } catch {}
        doc.fontSize(7).fillColor("#334155").text(linkDisplay, dCols[1]! + 5, y + 10, { width: 135, lineBreak: false });

        // Issue type
        doc.fontSize(8).fillColor("#334155").text(formatIssueType(issue.issueType), dCols[2]! + 5, y + 10, { width: 85, lineBreak: false });

        // Severity with color
        const sevColor = issue.severity === "High" ? "#dc2626" : issue.severity === "Medium" ? "#ca8a04" : "#16a34a";
        doc.fillColor(sevColor).text(issue.severity, dCols[3]! + 5, y + 10, { lineBreak: false });

        // Revenue estimate — varied, not flat
        const estLoss = Math.round((issue.estLossMin + issue.estLossMax) / 2);
        doc.fontSize(9).fillColor("#1e293b").text(estLoss > 0 ? `$${estLoss}` : "—", dCols[4]! + 5, y + 10, { lineBreak: false });

        y += ROW_HEIGHT;
        rowIdx++;
      }

      // If this is the last page of findings, add the total row
      if (rowIdx >= displayIssues.length && y + 30 < MAX_Y) {
        y += 10;
        doc.fontSize(11).fillColor("#1e293b").text("Total Estimated Monthly Revenue at Risk:", M, y, { lineBreak: false });
        doc.fontSize(16).fillColor("#dc2626").text(`$${data.totalEstLoss.toLocaleString()}`, M + 310, y - 3, { lineBreak: false });

        doc.fontSize(7).fillColor("#94a3b8")
          .text("* Revenue estimates based on average affiliate conversion rates and traffic patterns.", M, y + 25, { width: CW })
          .text("  Actual figures may vary. A more precise estimate requires access to your affiliate dashboards.", M, y + 35, { width: CW });
      }

      addFooter();
    }

    // ── Recommendations Page ────────────────────────────────────────────

    newPage();
    sectionHeader(doc, "Recommendations & Next Steps", M, 50);

    doc.fontSize(14).fillColor("#1e293b").text("Priority Fixes", M, 100);

    const fixes = [
      { title: "Replace broken affiliate links", desc: "Update or remove links returning 404/500 errors. Redirect to current program landing pages where available. This directly recovers lost commission revenue." },
      { title: "Add UTM tracking parameters", desc: "Affiliate links without tracking tags make it impossible to attribute revenue. Add consistent UTM parameters across all outbound affiliate links." },
      { title: "Reduce redirect chains", desc: "Links passing through 3+ redirects hurt page speed and can drop tracking cookies. Replace with direct affiliate URLs." },
      { title: "Implement ongoing monitoring", desc: "Affiliate links break regularly due to program changes, URL updates, and merchant site changes. Automated scanning catches breaks before they cost you money." },
    ];

    let fixY = 125;
    fixes.forEach((fix, i) => {
      // Number circle
      doc.circle(M + 10, fixY + 8, 10).fill("#2dd4a8");
      doc.fontSize(10).fillColor("#ffffff").text(String(i + 1), M + 6, fixY + 3, { lineBreak: false });

      doc.fontSize(11).fillColor("#1e293b").text(fix.title, M + 30, fixY);
      doc.fontSize(9).fillColor("#64748b").text(fix.desc, M + 30, fixY + 16, { width: CW - 40 });
      fixY += 60;
    });

    // Pricing CTA
    const ctaY = fixY + 20;
    doc.roundedRect(M, ctaY, CW, 150, 8).fill("#1a2332");

    doc.fontSize(14).fillColor("#2dd4a8").text("What I Can Do For You", M + 25, ctaY + 18);

    // One-time fix
    doc.fontSize(22).fillColor("#ffffff").text("$150 - $300", M + 25, ctaY + 45);
    doc.fontSize(10).fillColor("#94a3b8").text("One-Time Fix", M + 25, ctaY + 72);
    doc.fontSize(8).fillColor("#64748b")
      .text("Fix all issues identified in this report.", M + 25, ctaY + 87)
      .text("Includes verification & testing.", M + 25, ctaY + 99);

    // Monthly monitoring
    doc.fontSize(22).fillColor("#ffffff").text("$49 - $99/mo", M + CW / 2, ctaY + 45);
    doc.fontSize(10).fillColor("#94a3b8").text("Monthly Monitoring", M + CW / 2, ctaY + 72);
    doc.fontSize(8).fillColor("#64748b")
      .text("Ongoing scanning + instant alerts.", M + CW / 2, ctaY + 87)
      .text("All fixes included. Cancel anytime.", M + CW / 2, ctaY + 99);

    // CTA button
    doc.roundedRect(M + 30, ctaY + 120, CW - 60, 22, 4).fill("#2dd4a8");
    doc.fontSize(9).fillColor("#1a2332").text(
      `Reply to this email or book a 15-min call at ${BRAND.calendarLink}`,
      M + 50, ctaY + 126, { width: CW - 80, align: "center" }
    );

    addFooter();

    // ── Finalize ──────────────────────────────────────────────────────────

    doc.end();
    stream.on("finish", resolvePromise);
    stream.on("error", reject);
  });
}

function sectionHeader(doc: PDFKit.PDFDocument, title: string, x: number, y: number) {
  doc.fontSize(22).fillColor("#1e293b").text(title, x, y, { lineBreak: false });
  const titleWidth = doc.widthOfString(title);
  doc.moveTo(x, y + 28).lineTo(x + Math.min(titleWidth, 200), y + 28).lineWidth(3).stroke("#2dd4a8");
}

function statBox(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, value: string, label: string, bgColor: string, valueColor: string) {
  doc.roundedRect(x, y, w, h, 6).fillAndStroke(bgColor, "#e2e8f0");
  doc.fontSize(24).fillColor(valueColor).text(value, x + 15, y + 12, { width: w - 30 });
  doc.fontSize(9).fillColor("#64748b").text(label, x + 15, y + 42, { width: w - 30 });
}

function formatIssueType(issueType: string): string {
  const map: Record<string, string> = {
    BROKEN_4XX: "Broken link (4xx)",
    SERVER_5XX: "Server error (5xx)",
    TIMEOUT: "Connection timeout",
    REDIRECT_TO_HOME: "Redirect to homepage",
    LOST_PARAMS: "Missing tracking params",
    SOFT_404: "Soft 404 page",
    CONTENT_CHANGED: "Content changed",
  };
  return map[issueType] ?? issueType;
}

// ── Email Draft Generator ───────────────────────────────────────────────────

function generateEmailDraft(opts: {
  blogName: string;
  domain: string;
  brokenAffiliateCount: number;
  brokenNonAffiliateCount: number;
  totalEstLoss: number;
  affiliateIssueCount: number;
  totalIssueCount: number;
  prospectEmail: string | null;
  pagesWithIssues: number;
}): string {
  const { blogName, domain, brokenAffiliateCount, totalEstLoss, affiliateIssueCount, totalIssueCount, pagesWithIssues } = opts;

  // Only mention affiliate issues in the email — that's what they care about
  let subjectLine: string;
  let openingLine: string;

  if (brokenAffiliateCount > 0) {
    subjectLine = `${brokenAffiliateCount} broken affiliate link${brokenAffiliateCount > 1 ? "s" : ""} on ${blogName} — ~$${totalEstLoss.toLocaleString()}/mo at risk`;
    openingLine = `I ran a quick link audit on ${blogName} and found ${brokenAffiliateCount} broken affiliate link${brokenAffiliateCount > 1 ? "s" : ""} across ${pagesWithIssues} page${pagesWithIssues > 1 ? "s" : ""}. These are links to affiliate programs and partners that are returning 404 errors, timeouts, or redirect loops — meaning you're likely losing commissions on clicks that should be converting.`;
  } else if (affiliateIssueCount > 0) {
    subjectLine = `${affiliateIssueCount} affiliate link issue${affiliateIssueCount > 1 ? "s" : ""} on ${blogName} worth checking`;
    openingLine = `I ran a quick link audit on ${blogName} and found ${affiliateIssueCount} issue${affiliateIssueCount > 1 ? "s" : ""} with your affiliate links — missing tracking parameters, redirect chains, and other problems that could be costing you around $${totalEstLoss.toLocaleString()}/month in lost or unattributed commissions.`;
  } else {
    // Only non-affiliate issues found — weaker pitch but still useful
    subjectLine = `${totalIssueCount} broken outbound link${totalIssueCount > 1 ? "s" : ""} on ${blogName}`;
    openingLine = `I ran a quick link audit on ${blogName} and found ${totalIssueCount} broken outbound link${totalIssueCount > 1 ? "s" : ""}. While these aren't directly affiliate links, broken links hurt your SEO and user experience — and they often signal that affiliate links on the same pages may also need attention.`;
  }

  const summaryBullets = [];
  if (brokenAffiliateCount > 0) {
    summaryBullets.push(`- **${brokenAffiliateCount} broken affiliate links** (404s, timeouts, redirect loops)`);
  }
  if (affiliateIssueCount > brokenAffiliateCount) {
    summaryBullets.push(`- **${affiliateIssueCount - brokenAffiliateCount} additional tracking/redirect issues** on affiliate links`);
  }
  if (opts.brokenNonAffiliateCount > 0) {
    summaryBullets.push(`- **${opts.brokenNonAffiliateCount} broken non-affiliate links** (social, editorial — included for completeness)`);
  }
  if (totalEstLoss > 0) {
    summaryBullets.push(`- **~$${totalEstLoss.toLocaleString()}/month** estimated affiliate revenue at risk`);
  }

  return `# Outreach Email Draft
**To:** ${opts.prospectEmail ?? `[find contact email for ${domain}]`}
**Subject:** ${subjectLine}
**Attachment:** ${domain}-audit-report.pdf

---

Hi there,

${openingLine}

I put together a quick report showing exactly which links are broken, which pages they're on, and how much revenue each one is likely costing you. It's attached.

Here's the quick summary:
${summaryBullets.join("\n")}

I built a tool called LinkRescue that monitors affiliate links automatically — but you could fix most of these manually with the report. The important thing is they get fixed before you lose more commissions.

If you'd like help:
- **One-time fix ($150-$300)** — I'll fix every issue in the report and verify they're working
- **Monthly monitoring ($49-$99/mo)** — Ongoing scanning so links never stay broken for more than a day

Either way, the report is yours. Happy to walk through the findings on a quick call: ${BRAND.calendarLink}

Best,
${BRAND.name}
${BRAND.company} — ${BRAND.site}

---

## Notes for Carson
- Personalize the opening — mention a specific post you liked
- Send from LinkRescue email, not personal
- Attach the PDF report before sending
`;
}
