import { Command } from 'commander';
import { runCheck } from './commands/check.js';
import { runScan } from './commands/scan.js';

const program = new Command();

program
  .name('linkrescue')
  .description('Find broken links and affiliate parameter issues on any website')
  .version('1.0.0');

program
  .command('check <url>')
  .description('Quick check: fetch a single page and check all outbound links')
  .option('--json', 'Output as JSON instead of pretty terminal')
  .option('--affiliate-only', 'Only show affiliate links')
  .option('--verbose', 'Show all links including OK ones')
  .action(async (url: string, options) => {
    try {
      await runCheck(url, options);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`\nError: ${msg}`);
      process.exit(1);
    }
  });

program
  .command('scan <url>')
  .description('Full scan: discover pages via sitemap/crawl, then check all links')
  .option('--max-pages <n>', 'Limit pages to scan (default: 20, max: 20 for free CLI)', '20')
  .option('--json', 'Output as JSON instead of pretty terminal')
  .option('--affiliate-only', 'Only show affiliate links')
  .option('--verbose', 'Show all links including OK ones')
  .action(async (url: string, options) => {
    try {
      await runScan(url, options);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`\nError: ${msg}`);
      process.exit(1);
    }
  });

program.parse();
