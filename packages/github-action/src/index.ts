import * as core from '@actions/core';
import * as fs from 'fs';

interface LinkResult {
  url: string;
  status: 'ok' | 'broken' | 'redirect' | 'timeout' | 'error';
  status_code: number;
  final_url: string;
  redirect_count: number;
  is_affiliate: boolean;
  affiliate_params_preserved: boolean | null;
  params_lost: string[];
  issue: string | null;
}

interface CheckResponse {
  checked: number;
  summary: { broken: number; redirects: number; params_lost: number };
  results: LinkResult[];
}

async function checkLinks(
  apiUrl: string,
  apiKey: string,
  urls: string[],
): Promise<CheckResponse> {
  // Process in batches of 20 (API limit)
  const allResults: LinkResult[] = [];
  let totalBroken = 0;
  let totalRedirects = 0;
  let totalParamsLost = 0;

  for (let i = 0; i < urls.length; i += 20) {
    const batch = urls.slice(i, i + 20);
    core.info(`Checking batch ${Math.floor(i / 20) + 1}: ${batch.length} URLs`);

    const res = await fetch(`${apiUrl}/api/v1/check-links`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ urls: batch }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`API request failed (${res.status}): ${error}`);
    }

    const data: CheckResponse = await res.json();
    allResults.push(...data.results);
    totalBroken += data.summary.broken;
    totalRedirects += data.summary.redirects;
    totalParamsLost += data.summary.params_lost;
  }

  return {
    checked: allResults.length,
    summary: { broken: totalBroken, redirects: totalRedirects, params_lost: totalParamsLost },
    results: allResults,
  };
}

function collectUrls(): string[] {
  const urls: string[] = [];

  // From direct input
  const urlsInput = core.getInput('urls');
  if (urlsInput) {
    urls.push(...urlsInput.split('\n').map((u) => u.trim()).filter(Boolean));
  }

  // From file
  const urlsFile = core.getInput('urls-file');
  if (urlsFile && fs.existsSync(urlsFile)) {
    const content = fs.readFileSync(urlsFile, 'utf-8');
    urls.push(...content.split('\n').map((u) => u.trim()).filter(Boolean));
  }

  // Deduplicate
  return [...new Set(urls)];
}

async function run(): Promise<void> {
  try {
    const apiKey = core.getInput('api-key', { required: true });
    const apiUrl = core.getInput('api-url');
    const failOnBroken = core.getInput('fail-on-broken') === 'true';
    const failOnParamsLost = core.getInput('fail-on-params-lost') === 'true';

    const urls = collectUrls();

    if (urls.length === 0) {
      core.warning('No URLs provided. Set "urls", "urls-file", or "sitemap" input.');
      return;
    }

    core.info(`Checking ${urls.length} URLs via LinkRescue API...`);

    const data = await checkLinks(apiUrl, apiKey, urls);

    // Set outputs
    core.setOutput('total', data.checked);
    core.setOutput('broken', data.summary.broken);
    core.setOutput('redirects', data.summary.redirects);
    core.setOutput('params-lost', data.summary.params_lost);
    core.setOutput('results-json', JSON.stringify(data.results));

    // Create annotations for issues
    for (const result of data.results) {
      if (result.status === 'broken') {
        core.error(`Broken link: ${result.url} (${result.issue})`, {
          title: 'Broken Link',
        });
      } else if (result.params_lost.length > 0) {
        core.warning(
          `Affiliate params lost: ${result.url} — lost: ${result.params_lost.join(', ')}`,
          { title: 'Affiliate Params Lost' },
        );
      } else if (result.status === 'timeout') {
        core.warning(`Timeout: ${result.url}`, { title: 'Link Timeout' });
      }
    }

    // Summary
    core.info('');
    core.info('=== LinkRescue Results ===');
    core.info(`Checked: ${data.checked}`);
    core.info(`Broken:  ${data.summary.broken}`);
    core.info(`Redirects: ${data.summary.redirects}`);
    core.info(`Params lost: ${data.summary.params_lost}`);

    // Write job summary
    core.summary
      .addHeading('LinkRescue Link Check Results', 2)
      .addTable([
        [
          { data: 'Metric', header: true },
          { data: 'Count', header: true },
        ],
        ['Total checked', String(data.checked)],
        ['Broken', String(data.summary.broken)],
        ['Redirects', String(data.summary.redirects)],
        ['Params lost', String(data.summary.params_lost)],
      ]);

    if (data.summary.broken > 0) {
      core.summary.addHeading('Broken Links', 3);
      const brokenRows = data.results
        .filter((r) => r.status === 'broken')
        .map((r) => [r.url, String(r.status_code), r.issue ?? '']);
      core.summary.addTable([
        [
          { data: 'URL', header: true },
          { data: 'Status', header: true },
          { data: 'Issue', header: true },
        ],
        ...brokenRows,
      ]);
    }

    await core.summary.write();

    // Fail conditions
    if (failOnBroken && data.summary.broken > 0) {
      core.setFailed(`Found ${data.summary.broken} broken link(s)`);
    }
    if (failOnParamsLost && data.summary.params_lost > 0) {
      core.setFailed(`Found ${data.summary.params_lost} URL(s) with lost affiliate parameters`);
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();
