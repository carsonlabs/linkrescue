#!/usr/bin/env node
/**
 * Aggregate scan results from 50-site data study.
 * Reads all JSON files in results/, parses, computes aggregate stats.
 *
 * Usage: node aggregate.js
 */

const fs = require('fs');
const path = require('path');

const RESULTS_DIR = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, 'results');
const SUMMARY_OUT = process.argv[3] ? path.resolve(process.argv[3]) : path.join(__dirname, 'aggregate-summary.json');
const SITES_FILE = path.join(__dirname, 'sites.txt');

// Niche classifications (matches sites.txt order-ish)
const NICHES = {
  'nomadicmatt.com': 'travel',
  'expertvagabond.com': 'travel',
  'onemileatatime.com': 'travel',
  'theplanetd.com': 'travel',
  'adventurouskate.com': 'travel',
  'travelfreak.com': 'travel',
  'camelsandchocolate.com': 'travel',
  'mywanderlust.com': 'travel',
  'financialsamurai.com': 'finance',
  'sidehustlenation.com': 'finance',
  'makingsenseofcents.com': 'finance',
  'millennialmoney.com': 'finance',
  'thewaystowealth.com': 'finance',
  'mrmoneymustache.com': 'finance',
  'ghacks.net': 'tech',
  'howtogeek.com': 'tech',
  'makeuseof.com': 'tech',
  'techboomers.com': 'tech',
  'digitaltrends.com': 'tech',
  'budgetbytes.com': 'food',
  'thekitchn.com': 'food',
  'cookieandkate.com': 'food',
  'seriouseats.com': 'food',
  'pinchofyum.com': 'food',
  'ana-white.com': 'home',
  'younghouselove.com': 'home',
  'thehandymansdaughter.com': 'home',
  'apartmenttherapy.com': 'home',
  'familyhandyman.com': 'home',
  'nerdfitness.com': 'fitness',
  'breakingmuscle.com': 'fitness',
  'stronglifts.com': 'fitness',
  'cleverhiker.com': 'outdoor',
  'thetrek.co': 'outdoor',
  'pmags.com': 'outdoor',
  'sectionhiker.com': 'outdoor',
  'outdoorgearlab.com': 'outdoor',
  'nichepursuits.com': 'marketing',
  'authorityhacker.com': 'marketing',
  'bloggingwizard.com': 'marketing',
  'smartpassiveincome.com': 'marketing',
  'shoutmeloud.com': 'marketing',
  'dogfoodadvisor.com': 'pet',
  'caninejournal.com': 'pet',
  'thephoblographer.com': 'misc',
  'lucieslist.com': 'misc',
  'perfectdailygrind.com': 'misc',
  'gardeningknowhow.com': 'misc',
  'mensjournal.com': 'misc',
  'the-sun-and-the-turtle.com': 'misc',
};

function parseJsonFromFile(filepath) {
  const raw = fs.readFileSync(filepath, 'utf-8');
  // Find first `{` and extract to the end
  const startIdx = raw.indexOf('{');
  if (startIdx === -1) return null;
  try {
    return JSON.parse(raw.slice(startIdx));
  } catch (e) {
    return null;
  }
}

function safeName(site) {
  return site.replace(/[^a-zA-Z0-9]/g, '_');
}

function main() {
  const sites = fs.readFileSync(SITES_FILE, 'utf-8').trim().split('\n');

  const perSite = [];
  let totalPages = 0;
  let totalLinks = 0;
  let totalBroken4xx = 0;
  let totalServer5xx = 0;
  let totalTimeouts = 0;
  let totalRedirectHome = 0;
  let totalLostParams = 0;
  let totalOk = 0;
  let completed = 0;
  let errored = 0;
  let timedOut = 0;
  let zeroBrokenSites = 0;
  let partialSites = 0;
  let totalLinksSkipped = 0;
  let totalLinksFound = 0;
  let totalBlocked = 0;
  let totalHard4xx = 0;
  let allRedirectHops = [];

  const nicheStats = {}; // niche -> { sites, pages, links, broken, lostParams }

  for (const site of sites) {
    const filepath = path.join(RESULTS_DIR, `${safeName(site)}.json`);
    if (!fs.existsSync(filepath)) {
      perSite.push({ site, status: 'missing' });
      continue;
    }

    const data = parseJsonFromFile(filepath);
    if (!data) {
      perSite.push({ site, status: 'unparseable' });
      errored++;
      continue;
    }

    if (data.error === 'timeout') {
      perSite.push({ site, status: 'timeout' });
      timedOut++;
      continue;
    }

    if (!data.summary) {
      perSite.push({ site, status: 'no-summary' });
      errored++;
      continue;
    }

    completed++;
    const s = data.summary;

    // Tally from issue-level data so bot-blocked responses (403/405/429 even
    // after a GET retry) can be separated from genuinely broken links. A
    // Cloudflare challenge is not a broken link, and counting it as one
    // inflated earlier runs badly (run 1: 1,000 of 1,474 "4xx" were 403s).
    const BLOCKED_STATUSES = new Set([403, 405, 429]);
    let hard4xx = 0;
    let blockedCount = 0;
    for (const iss of data.issues || []) {
      // New CLI builds emit issueType BLOCKED directly; older result files
      // classified bot-blocks as BROKEN_4XX — slice those by status code.
      if (iss.issueType === 'BLOCKED') {
        blockedCount++;
      } else if (iss.issueType === 'BROKEN_4XX') {
        if (BLOCKED_STATUSES.has(iss.status)) blockedCount++;
        else hard4xx++;
      }
    }
    const brokenHttp = hard4xx + (s.server5xx || 0) + (s.timeout || 0);
    const affiliateIssues = (s.redirectToHome || 0) + (s.lostParams || 0);
    const allIssues = brokenHttp + affiliateIssues;
    totalBlocked += blockedCount;
    totalHard4xx += hard4xx;

    // Budgeted scans return partial results: rates must use links CHECKED,
    // not links FOUND, or partial sites dilute every percentage.
    const linksSkipped = data.linksSkippedBudget || 0;
    const linksChecked = Math.max((data.totalLinks || 0) - linksSkipped, 0);
    if (data.budgetExhausted) partialSites++;
    totalLinksSkipped += linksSkipped;
    totalLinksFound += data.totalLinks || 0;

    if (brokenHttp === 0) zeroBrokenSites++;

    totalPages += data.pagesScanned || 0;
    totalLinks += linksChecked;
    totalBroken4xx += hard4xx;
    totalServer5xx += s.server5xx || 0;
    totalTimeouts += s.timeout || 0;
    totalRedirectHome += s.redirectToHome || 0;
    totalLostParams += s.lostParams || 0;
    totalOk += s.ok || 0;

    // Redirect hop distribution from issue-level data
    if (data.issues) {
      for (const issue of data.issues) {
        if (issue.redirectHops && issue.redirectHops > 0) {
          allRedirectHops.push(issue.redirectHops);
        }
      }
    }

    // Niche aggregation
    const niche = NICHES[site] || 'unknown';
    if (!nicheStats[niche]) {
      nicheStats[niche] = { sites: 0, pages: 0, links: 0, broken: 0, lostParams: 0 };
    }
    nicheStats[niche].sites++;
    nicheStats[niche].pages += data.pagesScanned || 0;
    nicheStats[niche].links += linksChecked;
    nicheStats[niche].broken += brokenHttp;
    nicheStats[niche].lostParams += affiliateIssues;

    perSite.push({
      site,
      status: 'ok',
      partial: Boolean(data.budgetExhausted),
      pages: data.pagesScanned,
      links: linksChecked,
      linksFound: data.totalLinks,
      brokenHttp,
      blocked: blockedCount,
      affiliateIssues,
      allIssues,
      durationMs: data.durationMs,
    });
  }

  // Compute derived stats
  const sitesWithData = perSite.filter((r) => r.status === 'ok');
  const brokenCounts = sitesWithData.map((r) => r.brokenHttp);
  const allIssueCounts = sitesWithData.map((r) => r.allIssues);

  // Crawl-success gate: a site passes only when it returned substantive data
  // (>=3 pages). "ok" with zero pages is a silent failure — bot wall, dead
  // domain, or discovery bug — and must not count toward the 80% gate.
  const zeroDataSites = sitesWithData.filter((r) => (r.pages || 0) === 0).map((r) => r.site);
  const thinDataSites = sitesWithData
    .filter((r) => (r.pages || 0) > 0 && r.pages < 3)
    .map((r) => r.site);
  const substantiveRows = sitesWithData.filter((r) => (r.pages || 0) >= 3);
  const substantiveSites = substantiveRows.length;
  const gateRatePct = (substantiveSites / Math.max(sites.length, 1)) * 100;

  const median = (arr) => {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const worstBroken = Math.max(0, ...brokenCounts);
  const worstTotal = Math.max(0, ...allIssueCounts);
  const worstSite = sitesWithData.find((r) => r.brokenHttp === worstBroken);

  const totalBrokenHttp = totalBroken4xx + totalServer5xx + totalTimeouts;
  const totalAffiliateIssues = totalRedirectHome + totalLostParams;
  const totalIssues = totalBrokenHttp + totalAffiliateIssues;

  // Output
  console.log('\n=== LINKRESCUE 50-SITE DATA STUDY — AGGREGATED RESULTS ===\n');

  console.log('OVERALL:');
  console.log(`  Sites targeted: 50`);
  console.log(`  Sites scanned successfully: ${completed} (${partialSites} partial via time budget)`);
  console.log(`  Sites timed out / killed: ${timedOut}`);
  console.log(`  Sites errored: ${errored}`);
  console.log(`  Total pages scanned: ${totalPages}`);
  console.log(`  Total outbound links found: ${totalLinksFound} (${totalLinksSkipped} beyond budget, not checked)`);
  console.log(`  Total outbound links checked: ${totalLinks}`);
  console.log(`  Total HTTP broken links (4xx/5xx/timeout): ${totalBrokenHttp}`);
  console.log(`  Total affiliate issues (redirect-home + lost-params): ${totalAffiliateIssues}`);
  console.log(`  Total issues (all categories): ${totalIssues}`);
  console.log(`  Overall HTTP broken rate: ${((totalBrokenHttp / Math.max(totalLinks, 1)) * 100).toFixed(2)}%`);
  console.log(`  Overall affiliate issue rate: ${((totalAffiliateIssues / Math.max(totalLinks, 1)) * 100).toFixed(2)}%`);
  console.log(`  Overall any-issue rate: ${((totalIssues / Math.max(totalLinks, 1)) * 100).toFixed(2)}%`);
  console.log('');

  console.log('CRAWL-SUCCESS GATE (target: >=80% of panel returning substantive data):');
  console.log(
    `  Sites with >=3 pages: ${substantiveSites} of ${sites.length} (${gateRatePct.toFixed(1)}%) ${gateRatePct >= 80 ? '✅ PASS' : '❌ FAIL'}`,
  );
  console.log(`  Zero-data sites (${zeroDataSites.length}): ${zeroDataSites.join(', ') || 'none'}`);
  console.log(`  Thin sites, 1-2 pages (${thinDataSites.length}): ${thinDataSites.join(', ') || 'none'}`);
  console.log('');

  console.log('PER-SITE DISTRIBUTION (HTTP broken only):');
  console.log(`  Median broken links per site: ${median(brokenCounts)}`);
  console.log(`  Mean broken links per site: ${(brokenCounts.reduce((a, b) => a + b, 0) / Math.max(brokenCounts.length, 1)).toFixed(1)}`);
  console.log(`  Sites with ZERO http-broken links: ${zeroBrokenSites} of ${completed}`);
  console.log(`  Worst offender (HTTP broken): ${worstBroken} on ${worstSite ? worstSite.site : 'N/A'}`);
  console.log('');

  console.log('PER-SITE DISTRIBUTION (all issues incl. affiliate):');
  console.log(`  Median issues per site: ${median(allIssueCounts)}`);
  console.log(`  Worst offender (all issues): ${worstTotal}`);
  console.log('');

  console.log('BROKEN LINK TYPE BREAKDOWN:');
  console.log(`  Bot-blocked (403/405/429 — EXCLUDED from broken): ${totalBlocked}`);
  console.log(`  4xx Not Found: ${totalBroken4xx} (${((totalBroken4xx / Math.max(totalIssues, 1)) * 100).toFixed(1)}% of issues)`);
  console.log(`  5xx Server Error: ${totalServer5xx} (${((totalServer5xx / Math.max(totalIssues, 1)) * 100).toFixed(1)}%)`);
  console.log(`  Timeout >10s: ${totalTimeouts} (${((totalTimeouts / Math.max(totalIssues, 1)) * 100).toFixed(1)}%)`);
  console.log(`  Redirect-to-home: ${totalRedirectHome} (${((totalRedirectHome / Math.max(totalIssues, 1)) * 100).toFixed(1)}%)`);
  console.log(`  Lost affiliate params: ${totalLostParams} (${((totalLostParams / Math.max(totalIssues, 1)) * 100).toFixed(1)}%)`);
  console.log('');

  console.log('REDIRECT CHAIN DEPTH:');
  if (allRedirectHops.length > 0) {
    const sortedHops = [...allRedirectHops].sort((a, b) => a - b);
    console.log(`  Redirect-chain links total: ${allRedirectHops.length}`);
    console.log(`  Median hops: ${median(allRedirectHops)}`);
    console.log(`  Max hops: ${Math.max(...allRedirectHops)}`);
    console.log(`  Chains with 3+ hops: ${allRedirectHops.filter((h) => h >= 3).length}`);
    console.log(`  Chains with 5+ hops: ${allRedirectHops.filter((h) => h >= 5).length}`);
  } else {
    console.log('  No redirect data captured.');
  }
  console.log('');

  console.log('BY NICHE:');
  const nicheOrder = ['travel', 'finance', 'tech', 'food', 'home', 'fitness', 'outdoor', 'marketing', 'pet', 'misc'];
  for (const n of nicheOrder) {
    const ns = nicheStats[n];
    if (!ns) continue;
    const rate = (((ns.broken + ns.lostParams) / Math.max(ns.links, 1)) * 100).toFixed(2);
    console.log(`  ${n.padEnd(12)} sites=${ns.sites}, pages=${ns.pages}, links=${ns.links}, issues=${ns.broken + ns.lostParams}, rate=${rate}%`);
  }
  console.log('');

  console.log('ALL SITES (raw table):');
  perSite.forEach((r, i) => {
    if (r.status === 'ok') {
      console.log(`  ${String(i + 1).padStart(2, ' ')}. ${r.site.padEnd(30)} pages=${String(r.pages).padStart(3)}  links=${String(r.links).padStart(4)}  broken=${r.brokenHttp}  affiliate=${r.affiliateIssues}`);
    } else {
      console.log(`  ${String(i + 1).padStart(2, ' ')}. ${r.site.padEnd(30)} [${r.status.toUpperCase()}]`);
    }
  });

  console.log('\n=== END ===\n');

  // Write a machine-readable summary too
  const summary = {
    scanDate: new Date().toISOString(),
    sitesTargeted: 50,
    sitesScanned: completed,
    sitesPartialBudget: partialSites,
    sitesTimedOut: timedOut,
    sitesErrored: errored,
    totalPages,
    totalLinksFound,
    totalLinksSkipped,
    totalLinks,
    totalBrokenHttp,
    totalAffiliateIssues,
    totalIssues,
    overallBrokenRate: (totalBrokenHttp / Math.max(totalLinks, 1)) * 100,
    overallAffiliateIssueRate: (totalAffiliateIssues / Math.max(totalLinks, 1)) * 100,
    overallAnyIssueRate: (totalIssues / Math.max(totalLinks, 1)) * 100,
    medianBrokenPerSite: median(brokenCounts),
    meanBrokenPerSite: brokenCounts.reduce((a, b) => a + b, 0) / Math.max(brokenCounts.length, 1),
    zeroBrokenSites,
    worstBroken,
    worstSite: worstSite ? worstSite.site : null,
    medianAllIssuesPerSite: median(allIssueCounts),
    errorBreakdown: {
      broken4xx: totalBroken4xx,
      server5xx: totalServer5xx,
      timeout: totalTimeouts,
      redirectToHome: totalRedirectHome,
      lostParams: totalLostParams,
      blocked: totalBlocked,
    },
    redirectHops: {
      total: allRedirectHops.length,
      median: median(allRedirectHops),
      max: allRedirectHops.length ? Math.max(...allRedirectHops) : 0,
      threePlusHops: allRedirectHops.filter((h) => h >= 3).length,
      fivePlusHops: allRedirectHops.filter((h) => h >= 5).length,
    },
    crawlGate: {
      substantiveSites,
      gateRatePct,
      pass: gateRatePct >= 80,
      zeroDataSites,
      thinDataSites,
    },
    medianIssuesPerSubstantiveSite: median(substantiveRows.map((r) => r.allIssues)),
    zeroBrokenSubstantiveSites: substantiveRows.filter((r) => r.brokenHttp === 0).length,
    byNiche: nicheStats,
    perSite,
  };

  fs.writeFileSync(SUMMARY_OUT, JSON.stringify(summary, null, 2));
  console.log(`\n✅ Machine-readable summary written to: ${SUMMARY_OUT}`);
}

main();
