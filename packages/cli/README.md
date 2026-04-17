# linkrescue

Find broken affiliate links on any website. No signup, no API key, works on any stack.

```
npx linkrescue scan https://yoursite.com
```

## What it does

- Discovers pages via `sitemap.xml` (falls back to a 2-hop crawl if no sitemap)
- Extracts all outbound links from each page
- Checks each link with per-domain rate limiting
- Flags broken links (4xx/5xx/timeout), redirect chains, and **affiliate-specific issues** like lost tracking params or redirect-to-homepage

Polite by default:
- Respects `robots.txt`
- 10-second per-fetch timeout
- Per-domain pacing via internal rate limiter
- User-Agent: `LinkRescue-CLI/1.0 (+https://linkrescue.io)` — identifies itself, reachable

## Install

No install needed for one-offs:

```bash
npx linkrescue scan https://yoursite.com
```

Or install globally:

```bash
npm install -g linkrescue
linkrescue scan https://yoursite.com
```

## Commands

```bash
# Single-page quick check
linkrescue check https://yoursite.com/some-post

# Multi-page scan (sitemap + crawl, up to 20 pages on free CLI)
linkrescue scan https://yoursite.com
```

## Options

```bash
--json                Output JSON instead of pretty terminal (great for scripting)
--affiliate-only      Only show affiliate links in output
--verbose             Show all links, including OK ones
--max-pages <n>       Limit pages (1-20 in free CLI)
```

## Example output

```
🔍 LinkRescue — Scanning https://example.com

  ✅ 14 OK
  ⚠️  2 Redirects (possible param loss)
  ❌ 3 Broken (4xx)

BROKEN LINKS:
  Page: example.com/posts/best-hiking-gear
    ❌ 404 → https://shareasale.com/r.cfm?b=123&u=456  (affiliate)
    ❌ 404 → https://amazon.com/dp/B07XYZ  (affiliate)

AFFILIATE ISSUES:
  Page: example.com/posts/travel-tips
    ⚠️  LOST_PARAMS → https://skyscanner.pxf.io/c/214481/1027991/13416
         final: https://skyscanner.com/captcha

  Completed in 3.2s
  5 pages scanned, 24 links checked
```

## GitHub Action

For CI integration, see [`@linkrescue/github-action`](https://github.com/carsonlabs/linkrescue).

```yaml
- uses: carsonlabs/linkrescue-action@v1
  with:
    site: https://yoursite.com
    fail-on: broken
```

## Hosted version

The CLI is free and standalone. For scheduled scans, dashboard, multi-site monitoring, email alerts, revenue estimates, and 200+ pages per scan:

**[linkrescue.io](https://linkrescue.io)** — free tier, $29/mo Pro, $79/mo Agency.

## Why I built this

Existing affiliate link tools (LinkWhisper, Pretty Links) are WordPress plugins. I run Next.js sites. Others (Affilimate) do analytics and attribution, not monitoring. Nothing was dev-friendly: no CLI, no GitHub Action, no API.

Broken affiliate links are silent revenue loss — a click that should have paid $0.50–$2.00 in commission becomes $0. Most sites don't notice until monthly revenue is already down.

This is the tool I wanted. The CLI is MIT-licensed and free forever.

## License

MIT — see [LICENSE](./LICENSE).

## Contributing

Issues and PRs welcome at [github.com/carsonlabs/linkrescue](https://github.com/carsonlabs/linkrescue).

Questions? Reach me at `carson.roell@gmail.com` or file an issue.
