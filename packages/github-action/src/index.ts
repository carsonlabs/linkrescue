import * as core from '@actions/core';
import { spawn } from 'node:child_process';
import * as fs from 'node:fs';

/**
 * LinkRescue GitHub Action
 *
 * Free, no signup, no API key. Runs the linkrescue CLI (npm)
 * inside the workflow runner and reports the results as action outputs.
 *
 * Source: https://github.com/carsonlabs/linkrescue
 */

interface ScanIssue {
  page: string;
  link: string;
  status: number | null;
  finalUrl: string | null;
  redirectHops: number;
  issueType: string;
  isAffiliate: boolean;
}

interface ScanResult {
  url: string;
  pagesScanned: number;
  totalLinks: number;
  durationMs: number;
  summary: {
    ok: number;
    broken4xx: number;
    server5xx: number;
    timeout: number;
    redirectToHome: number;
    lostParams: number;
  };
  issues: ScanIssue[];
}

// Pin CLI major version for reproducibility. Bump when CLI ships a new major.
// Requires CLI v1.1.0+ (v1.0.0 was broken on install — workspace:* refs unreachable).
const CLI_PIN = 'linkrescue@^1.1.0';

function runCli(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const isWin = process.platform === 'win32';
    const npxBin = isWin ? 'npx.cmd' : 'npx';
    const child = spawn(npxBin, ['--yes', CLI_PIN, ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '0' },
      shell: isWin, // Windows needs shell to resolve .cmd files
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => {
      stdout += d.toString();
    });
    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    child.on('error', (err) => reject(err));
    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(
          new Error(
            `linkrescue exited with code ${code}\nstderr: ${stderr}\nstdout: ${stdout}`,
          ),
        );
      }
    });
  });
}

/**
 * CLI emits a decorative banner before the JSON when --json is passed.
 * Locate the first `{` to cleanly parse.
 */
function parseJsonOutput(raw: string): ScanResult {
  const startIdx = raw.indexOf('{');
  if (startIdx === -1) {
    throw new Error(`No JSON found in CLI output:\n${raw}`);
  }
  try {
    return JSON.parse(raw.slice(startIdx)) as ScanResult;
  } catch (err) {
    throw new Error(
      `Failed to parse CLI JSON output: ${err instanceof Error ? err.message : String(err)}\nRaw: ${raw.slice(startIdx, startIdx + 500)}`,
    );
  }
}

function splitUrlList(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('#'));
}

/**
 * Lenient boolean parser. core.getBooleanInput() is too strict — trips on
 * whitespace, line endings, and empty defaults. This tolerates those.
 */
function parseBool(key: string, defaultVal: boolean): boolean {
  const raw = core.getInput(key).trim().toLowerCase();
  if (raw === '') return defaultVal;
  if (raw === 'true' || raw === '1' || raw === 'yes') return true;
  if (raw === 'false' || raw === '0' || raw === 'no') return false;
  return defaultVal;
}

async function main(): Promise<void> {
  try {
    const site = core.getInput('site').trim();
    const urlsRaw = core.getInput('urls');
    const urlsFile = core.getInput('urls-file').trim();
    const maxPages = core.getInput('max-pages').trim() || '20';
    const affiliateOnly = parseBool('affiliate-only', false);
    const failOnBroken = parseBool('fail-on-broken', true);
    const failOnParamsLost = parseBool('fail-on-params-lost', false);

    if (!site && !urlsRaw && !urlsFile) {
      throw new Error(
        'You must provide at least one of: `site`, `urls`, or `urls-file`.',
      );
    }

    const scanResults: ScanResult[] = [];

    // Mode 1: full-site scan
    if (site) {
      core.info(`Scanning ${site} (max ${maxPages} pages)…`);
      const args = ['scan', site, '--json', '--max-pages', maxPages];
      if (affiliateOnly) args.push('--affiliate-only');
      const raw = await runCli(args);
      scanResults.push(parseJsonOutput(raw));
    }

    // Mode 2 + 3: URL lists (check each individually)
    let urlList: string[] = [];
    if (urlsFile) {
      if (!fs.existsSync(urlsFile)) {
        throw new Error(`urls-file not found at path: ${urlsFile}`);
      }
      urlList = splitUrlList(fs.readFileSync(urlsFile, 'utf-8'));
      core.info(`Loaded ${urlList.length} URL(s) from ${urlsFile}`);
    } else if (urlsRaw) {
      urlList = splitUrlList(urlsRaw);
      core.info(`Checking ${urlList.length} URL(s) from input`);
    }

    for (const url of urlList) {
      core.info(`  → ${url}`);
      const args = ['check', url, '--json'];
      if (affiliateOnly) args.push('--affiliate-only');
      try {
        const raw = await runCli(args);
        scanResults.push(parseJsonOutput(raw));
      } catch (err) {
        core.warning(
          `Failed to check ${url}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    // Aggregate
    let totalLinks = 0;
    let brokenHttp = 0;
    let redirectToHome = 0;
    let lostParams = 0;
    const allIssues: ScanIssue[] = [];

    for (const r of scanResults) {
      totalLinks += r.totalLinks;
      brokenHttp += r.summary.broken4xx + r.summary.server5xx + r.summary.timeout;
      redirectToHome += r.summary.redirectToHome;
      lostParams += r.summary.lostParams;
      allIssues.push(...r.issues);
    }

    // Emit outputs
    core.setOutput('total', String(totalLinks));
    core.setOutput('broken', String(brokenHttp));
    core.setOutput('redirects', String(redirectToHome));
    core.setOutput('params-lost', String(lostParams));
    core.setOutput('results-json', JSON.stringify(allIssues));

    // GitHub summary (markdown)
    try {
      await core.summary
        .addHeading('🔍 LinkRescue Scan Results')
        .addTable([
          [
            { data: 'Metric', header: true },
            { data: 'Count', header: true },
          ],
          ['Total links checked', String(totalLinks)],
          ['Broken (4xx/5xx/timeout)', String(brokenHttp)],
          ['Redirect to homepage', String(redirectToHome)],
          ['Affiliate params lost', String(lostParams)],
        ])
        .addRaw(
          `\nFound via the free [\`linkrescue\` CLI](https://www.npmjs.com/package/linkrescue) (no API key required).`,
        )
        .write();
    } catch {
      // Summary write can fail in local testing — non-critical
    }

    core.info('');
    core.info(`Checked ${totalLinks} links across ${scanResults.length} target(s)`);
    core.info(`  Broken: ${brokenHttp}`);
    core.info(`  Redirects to home: ${redirectToHome}`);
    core.info(`  Affiliate params lost: ${lostParams}`);

    // Fail logic
    if (failOnBroken && brokenHttp > 0) {
      core.setFailed(`Found ${brokenHttp} broken link(s). Failing workflow.`);
      return;
    }
    if (failOnParamsLost && lostParams > 0) {
      core.setFailed(
        `Found ${lostParams} link(s) with lost affiliate parameters. Failing workflow.`,
      );
      return;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    core.setFailed(msg);
  }
}

main();
