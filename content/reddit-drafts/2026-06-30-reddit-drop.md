---
target: r/juststart
date: 2026-06-30
topic: broken affiliate link monitor
---

Ran a broken link scan across 25 affiliate sites (mixed niches, mostly 50–300 pages). 27% of outbound affiliate links were broken at the HTTP level — not soft 404s, not out-of-stocks, but genuinely dead links.

The finding that surprised me: roundup posts had 2–3x the breakage rate of single-product reviews. More products per post, and trending picks have a shorter shelf life than evergreen recommendations. If your site is roundup-heavy, the math gets ugly fast.

The other pattern: page-1 content from 18+ months ago, still getting steady traffic, with 30%+ broken links. Google doesn't care. Traffic keeps coming. The clicks are just quietly converting to nothing.

Most of these site owners had no idea. The sites looked healthy from the outside.

Free CLI if you want to check your own: `npx linkrescue scan yoursite.com` — no account, takes about 3 minutes. Curious what broken-link rates others are seeing, especially in Amazon-heavy niches where product churn seems worst.
