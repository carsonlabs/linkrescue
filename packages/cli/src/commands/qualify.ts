import chalk from 'chalk';
import { qualifySite } from '@linkrescue/crawler';
import type { CliOptions } from '../types.js';

export async function runQualify(rawUrl: string, options: CliOptions): Promise<void> {
  const budgetSeconds = options.budget ? Number.parseInt(options.budget, 10) : 600;
  const budgetMs =
    Number.isFinite(budgetSeconds) && budgetSeconds > 0
      ? Math.min(budgetSeconds, 600) * 1000
      : 600_000;
  const result = await qualifySite(rawUrl, { maxDurationMs: budgetMs });

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    const passed = result.decision === 'PASS';
    console.log('');
    console.log(
      chalk.bold(
        `${passed ? chalk.green('PASS') : chalk.yellow('FAIL')} — LinkRescue Sprint qualification`
      )
    );
    console.log(`  Route: ${routeLabel(result.route)}`);
    console.log(
      `  Archive candidates: ${result.evidence.archivePageCandidates}/${result.thresholds.minimumArchivePages}`
    );
    console.log(
      `  Sampled pages: ${result.evidence.pagesFetched}/${result.evidence.probePagesAttempted} fetched · ${result.evidence.substantivePagesSampled} substantive`
    );
    console.log(
      `  Affiliate links: ${result.evidence.affiliateLinkOccurrences}/${result.thresholds.minimumAffiliateLinks} occurrences · ${result.evidence.uniqueAffiliateLinks} unique`
    );
    console.log(
      `  Crawl friction: ${result.evidence.botBlockedPages} blocked · ${result.evidence.failedPages} failed · ${formatDuration(result.evidence.durationMs)}`
    );
    console.log('');
    for (const reason of result.reasons) console.log(`  - ${reason}`);
    console.log('');
    console.log(
      chalk.dim(
        '  Qualification evidence only. This command does not create leads, check destination links, estimate revenue, or edit a site.'
      )
    );
  }

  if (result.decision === 'FAIL') process.exitCode = 2;
}

function routeLabel(route: 'start_sprint' | 'manual_review' | 'decline'): string {
  if (route === 'start_sprint') return 'Start fixed-scope Sprint';
  if (route === 'manual_review') {
    return 'Manual coverage conversation; do not send a thin report';
  }
  return 'Decline fixed-scope Sprint';
}

function formatDuration(durationMs: number): string {
  return `${(durationMs / 1000).toFixed(1)}s`;
}
