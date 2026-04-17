# LinkRescue GitHub Action

Find broken affiliate links in your CI/CD. **Free, no signup, no API key.**

Wraps the open-source [`linkrescue` CLI](https://www.npmjs.com/package/linkrescue). Same engine, same output — just inside your workflow.

## Quick start — scan an entire site

```yaml
- uses: carsonlabs/linkrescue-action@v2
  with:
    site: https://yoursite.com
    fail-on-broken: true
```

## Check specific URLs

```yaml
- uses: carsonlabs/linkrescue-action@v2
  with:
    urls: |
      https://amzn.to/abc123
      https://example.com/page
      https://shareasale.com/r.cfm?b=12345
```

## Check URLs from a file

```yaml
- uses: carsonlabs/linkrescue-action@v2
  with:
    urls-file: affiliate-links.txt
```

## Full workflow example

```yaml
name: Check Links
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 8 * * 1'  # every Monday 8 AM UTC

jobs:
  check-links:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: carsonlabs/linkrescue-action@v2
        id: linkcheck
        with:
          site: https://yoursite.com
          fail-on-broken: true
          fail-on-params-lost: false

      - name: Print summary
        if: always()
        run: |
          echo "Checked: ${{ steps.linkcheck.outputs.total }}"
          echo "Broken:  ${{ steps.linkcheck.outputs.broken }}"
          echo "Redirects: ${{ steps.linkcheck.outputs.redirects }}"
          echo "Params lost: ${{ steps.linkcheck.outputs.params-lost }}"
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `site` | No* | — | URL to scan (crawls up to `max-pages` pages) |
| `urls` | No* | — | Newline-separated URLs to check individually |
| `urls-file` | No* | — | Path to file with URLs (one per line, `#` comments supported) |
| `max-pages` | No | `20` | Max pages when using `site` (free-tier CLI caps at 20) |
| `affiliate-only` | No | `false` | Only report issues on affiliate links |
| `fail-on-broken` | No | `true` | Fail workflow if broken links found |
| `fail-on-params-lost` | No | `false` | Fail workflow if affiliate tracking params are lost in redirects |

\* You must provide at least one of `site`, `urls`, or `urls-file`.

## Outputs

| Output | Description |
|--------|-------------|
| `total` | Total links checked |
| `broken` | Broken links (4xx/5xx/timeout) |
| `redirects` | Links that redirected to the homepage (lost context) |
| `params-lost` | Affiliate links that lost tracking params in redirects |
| `results-json` | Full issues as a JSON array for further processing |

## How it works

On each run, this Action invokes `npx linkrescue` (pinned to `^1.1.0`) inside your workflow runner:

- **`site` mode** → runs `linkrescue scan <site> --json`
- **`urls` / `urls-file` mode** → runs `linkrescue check <url> --json` per URL

No hosted API, no authentication, no per-workflow cost. The CLI is MIT-licensed.

**Polite by default:** respects `robots.txt`, uses a 10-second per-link timeout, and rate-limits per-domain.

## Hosted version (optional)

If you want scheduled scans with email alerts, multi-site dashboards, longer page budgets (up to 2,000 pages/scan), and affiliate platform integrations, the hosted service at [linkrescue.io](https://linkrescue.io) offers those starting at $29/month. The hosted service is completely separate from this Action — this Action does **not** require any linkrescue.io account.

## License

[MIT](./LICENSE). Source: [github.com/carsonlabs/linkrescue](https://github.com/carsonlabs/linkrescue).

Issues: [github.com/carsonlabs/linkrescue/issues](https://github.com/carsonlabs/linkrescue/issues)
