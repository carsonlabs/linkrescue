# LinkRescue GitHub Action

Check URLs for broken links, stripped affiliate parameters, and redirect chain issues in your CI/CD pipeline.

## Usage

```yaml
- uses: linkrescue/check-links@v1
  with:
    api-key: ${{ secrets.LINKRESCUE_API_KEY }}
    urls: |
      https://amzn.to/abc123
      https://example.com/affiliate-page
      https://shareasale.com/r.cfm?b=12345
```

### Check URLs from a file

```yaml
- uses: linkrescue/check-links@v1
  with:
    api-key: ${{ secrets.LINKRESCUE_API_KEY }}
    urls-file: urls.txt
```

### Full workflow example

```yaml
name: Check Links
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 8 * * 1' # Every Monday at 8am

jobs:
  check-links:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: linkrescue/check-links@v1
        id: linkcheck
        with:
          api-key: ${{ secrets.LINKRESCUE_API_KEY }}
          urls-file: affiliate-links.txt
          fail-on-broken: 'true'
          fail-on-params-lost: 'true'

      - name: Print summary
        if: always()
        run: |
          echo "Checked: ${{ steps.linkcheck.outputs.total }}"
          echo "Broken: ${{ steps.linkcheck.outputs.broken }}"
          echo "Params lost: ${{ steps.linkcheck.outputs.params-lost }}"
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `api-key` | Yes | — | LinkRescue API key (`lr_...`) |
| `urls` | No | — | Newline-separated URLs to check |
| `urls-file` | No | — | Path to file with URLs (one per line) |
| `fail-on-broken` | No | `true` | Fail if broken links found |
| `fail-on-params-lost` | No | `true` | Fail if affiliate params are lost |

## Outputs

| Output | Description |
|--------|-------------|
| `total` | Total URLs checked |
| `broken` | Number of broken URLs |
| `redirects` | Number of redirect URLs |
| `params-lost` | URLs with lost affiliate parameters |
| `results-json` | Full JSON results array |

## Get an API Key

API access starts at $29/mo (Pro plan). Sign up at [linkrescue.io](https://linkrescue.io).
