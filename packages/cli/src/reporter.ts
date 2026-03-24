import chalk from 'chalk';
import type { CheckedLink, CliOptions, ScanReport } from './types.js';

/**
 * Render a beautiful terminal report from scan results.
 */
export function renderReport(report: ScanReport, options: CliOptions): void {
  if (options.json) {
    renderJson(report, options);
    return;
  }

  renderPretty(report, options);
}

function renderJson(report: ScanReport, options: CliOptions): void {
  let results = report.results;

  if (options.affiliateOnly) {
    results = results.filter((r) => r.isAffiliate);
  }

  if (!options.verbose) {
    results = results.filter((r) => r.issueType !== 'OK');
  }

  const output = {
    url: report.url,
    pagesScanned: report.pagesScanned,
    totalLinks: report.totalLinks,
    durationMs: report.durationMs,
    summary: {
      ok: report.results.filter((r) => r.issueType === 'OK').length,
      broken4xx: report.results.filter((r) => r.issueType === 'BROKEN_4XX').length,
      server5xx: report.results.filter((r) => r.issueType === 'SERVER_5XX').length,
      timeout: report.results.filter((r) => r.issueType === 'TIMEOUT').length,
      redirectToHome: report.results.filter((r) => r.issueType === 'REDIRECT_TO_HOME').length,
      lostParams: report.results.filter((r) => r.issueType === 'LOST_PARAMS').length,
    },
    issues: results.map((r) => ({
      page: r.pageUrl,
      link: r.href,
      status: r.statusCode,
      finalUrl: r.finalUrl,
      redirectHops: r.redirectHops,
      issueType: r.issueType,
      isAffiliate: r.isAffiliate,
    })),
  };

  console.log(JSON.stringify(output, null, 2));
}

function renderPretty(report: ScanReport, options: CliOptions): void {
  let results = report.results;

  if (options.affiliateOnly) {
    results = results.filter((r) => r.isAffiliate);
  }

  // Tally
  const ok = results.filter((r) => r.issueType === 'OK').length;
  const broken = results.filter((r) => r.issueType === 'BROKEN_4XX').length;
  const serverErrors = results.filter((r) => r.issueType === 'SERVER_5XX').length;
  const timeouts = results.filter((r) => r.issueType === 'TIMEOUT').length;
  const redirectsHome = results.filter((r) => r.issueType === 'REDIRECT_TO_HOME').length;
  const lostParams = results.filter((r) => r.issueType === 'LOST_PARAMS').length;
  const redirectIssues = redirectsHome + lostParams;

  console.log('');

  // Summary
  console.log(chalk.green(`  \u2705 ${ok} OK`));
  if (redirectIssues > 0) {
    console.log(chalk.yellow(`  \u26a0\ufe0f  ${redirectIssues} Redirects (possible param loss)`));
  }
  if (broken > 0) {
    console.log(chalk.red(`  \u274c ${broken} Broken (4xx)`));
  }
  if (serverErrors > 0) {
    console.log(chalk.red(`  \u274c ${serverErrors} Server errors (5xx)`));
  }
  if (timeouts > 0) {
    console.log(chalk.gray(`  \u23f1\ufe0f  ${timeouts} Timeout`));
  }

  console.log('');

  // Group issues by page
  const issueResults = results.filter((r) => r.issueType !== 'OK');
  const brokenResults = issueResults.filter(
    (r) => r.issueType === 'BROKEN_4XX' || r.issueType === 'SERVER_5XX' || r.issueType === 'TIMEOUT',
  );
  const affiliateIssues = issueResults.filter(
    (r) => r.issueType === 'LOST_PARAMS' || r.issueType === 'REDIRECT_TO_HOME',
  );

  // Broken Links Section
  if (brokenResults.length > 0) {
    console.log(chalk.bold.red('BROKEN LINKS:'));
    const groupedBroken = groupByPage(brokenResults);
    for (const [pageUrl, links] of Object.entries(groupedBroken)) {
      console.log(chalk.dim(`  Page: ${shortenUrl(pageUrl)}`));
      for (const link of links) {
        const icon = link.issueType === 'TIMEOUT' ? '\u23f1\ufe0f ' : '\u274c';
        const status = link.statusCode ? `${link.statusCode}` : link.issueType;
        const affiliateTag = link.isAffiliate ? chalk.magenta(' (affiliate)') : '';
        console.log(`    ${icon} ${chalk.red(status)} \u2192 ${chalk.underline(link.href)}${affiliateTag}`);
      }
    }
    console.log('');
  }

  // Affiliate Issues Section
  if (affiliateIssues.length > 0) {
    console.log(chalk.bold.yellow('AFFILIATE ISSUES:'));
    const groupedAffiliate = groupByPage(affiliateIssues);
    for (const [pageUrl, links] of Object.entries(groupedAffiliate)) {
      console.log(chalk.dim(`  Page: ${shortenUrl(pageUrl)}`));
      for (const link of links) {
        const label = link.issueType === 'LOST_PARAMS' ? 'LOST_PARAMS' : 'REDIRECT_HOME';
        console.log(
          `    \u26a0\ufe0f  ${chalk.yellow(label)} \u2192 ${chalk.underline(link.href)}`,
        );
        if (link.finalUrl && link.finalUrl !== link.href) {
          console.log(chalk.dim(`       final: ${link.finalUrl}`));
        }
      }
    }
    console.log('');
  }

  // Verbose: show OK links too
  if (options.verbose) {
    const okResults = results.filter((r) => r.issueType === 'OK');
    if (okResults.length > 0) {
      console.log(chalk.bold.green('OK LINKS:'));
      const groupedOk = groupByPage(okResults);
      for (const [pageUrl, links] of Object.entries(groupedOk)) {
        console.log(chalk.dim(`  Page: ${shortenUrl(pageUrl)}`));
        for (const link of links) {
          const affiliateTag = link.isAffiliate ? chalk.magenta(' (affiliate)') : '';
          console.log(`    \u2705 ${link.statusCode ?? '200'} \u2192 ${chalk.dim(link.href)}${affiliateTag}`);
        }
      }
      console.log('');
    }
  }

  // No issues at all
  if (issueResults.length === 0 && !options.verbose) {
    console.log(chalk.green.bold('  No issues found! All links are healthy.'));
    console.log('');
  }

  // Duration
  const seconds = (report.durationMs / 1000).toFixed(1);
  console.log(chalk.dim(`  Completed in ${seconds}s`));
  if (report.pagesScanned > 1) {
    console.log(
      chalk.dim(`  ${report.pagesScanned} pages scanned, ${report.totalLinks} links checked`),
    );
  }

  // CTA
  renderCta();
}

function renderCta(): void {
  console.log('');
  console.log(chalk.dim('\u2500'.repeat(50)));
  console.log(
    chalk.cyan.bold('  \ud83d\udca1 Want automated daily scans, alerts & fix suggestions?'),
  );
  console.log(chalk.cyan('     \u2192 https://linkrescue.io (free tier available)'));
  console.log(chalk.dim('\u2500'.repeat(50)));
  console.log('');
}

function groupByPage(results: CheckedLink[]): Record<string, CheckedLink[]> {
  const grouped: Record<string, CheckedLink[]> = {};
  for (const result of results) {
    const key = result.pageUrl;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(result);
  }
  return grouped;
}

function shortenUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname === '/' ? parsed.hostname : `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return url;
  }
}
