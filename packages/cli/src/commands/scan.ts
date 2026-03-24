import chalk from 'chalk';
import ora from 'ora';
import { scanSite } from '../scanner.js';
import { renderReport } from '../reporter.js';
import type { CliOptions } from '../types.js';

const FREE_MAX_PAGES = 20;

export async function runScan(rawUrl: string, options: CliOptions): Promise<void> {
  const url = normalizeUrl(rawUrl);
  const requestedMaxPages = parseInt(options.maxPages ?? '20', 10);
  const maxPages = Math.min(
    isNaN(requestedMaxPages) ? FREE_MAX_PAGES : requestedMaxPages,
    FREE_MAX_PAGES,
  );

  console.log('');
  console.log(chalk.bold(`\ud83d\udd0d LinkRescue \u2014 Scanning ${chalk.cyan(url)}`));
  console.log('');

  if (requestedMaxPages > FREE_MAX_PAGES) {
    console.log(
      chalk.yellow(
        `  Note: Free CLI is limited to ${FREE_MAX_PAGES} pages. Upgrade at https://linkrescue.io for unlimited scans.`,
      ),
    );
    console.log('');
  }

  const spinner = options.json ? null : ora('Discovering pages...').start();

  const { results, pagesScanned, totalLinks, durationMs } = await scanSite(
    url,
    maxPages,
    (pageCount) => {
      if (spinner) {
        spinner.text = `Found ${pageCount} pages. Fetching content...`;
      }
    },
    (checked, total) => {
      if (spinner) {
        spinner.text = `Checking links... ${checked}/${total}`;
      }
    },
  );

  spinner?.stop();

  if (!options.json) {
    console.log(
      chalk.dim(
        `  Checking ${totalLinks} links across ${pagesScanned} pages...`,
      ),
    );
  }

  renderReport(
    {
      url,
      pagesScanned,
      totalLinks,
      results,
      durationMs,
    },
    options,
  );
}

function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  return url;
}
