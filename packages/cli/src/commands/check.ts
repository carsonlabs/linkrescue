import chalk from 'chalk';
import ora from 'ora';
import { checkSinglePage } from '../scanner.js';
import { renderReport } from '../reporter.js';
import type { CliOptions } from '../types.js';

export async function runCheck(rawUrl: string, options: CliOptions): Promise<void> {
  const url = normalizeUrl(rawUrl);

  console.log('');
  console.log(chalk.bold(`\ud83d\udd0d LinkRescue \u2014 Checking ${chalk.cyan(url)}`));
  console.log('');

  const spinner = options.json ? null : ora('Fetching page and extracting links...').start();

  let lastReported = 0;
  const { results, durationMs } = await checkSinglePage(url, (checked, total) => {
    if (spinner && checked !== lastReported) {
      spinner.text = `Checking links... ${checked}/${total}`;
      lastReported = checked;
    }
  });

  spinner?.stop();

  if (!options.json) {
    console.log(
      chalk.dim(`  Checking ${results.length} links on 1 page...`),
    );
  }

  renderReport(
    {
      url,
      pagesScanned: 1,
      totalLinks: results.length,
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
