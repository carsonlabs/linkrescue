---
title: "Before I Published the 50-Site Study, I Ran LinkRescue On My Own 7 Sites. Here's What It Found."
date: 2026-04-17
author: "Carson Roell"
tags: ["self-audit", "dogfood", "transparency", "linkrescue", "credibility"]
category: "data studies"
seo_title: "I Scanned My Own Sites With LinkRescue First — Honest Self-Audit"
meta_description: "Before publishing a link-rot study, I turned the scanner on my own 7 live products. Found one embarrassing placeholder issue, one scanner bug, and confirmed zero real HTTP-broken links on healthy sites."
---

# Before I Published the 50-Site Study, I Ran LinkRescue On My Own 7 Sites. Here's What It Found.

You can't publish a data study on broken affiliate links without first checking your own house. Before running LinkRescue against 50 external affiliate sites, I turned the scanner on all 7 of my own live products.

The result was humbling in three different ways.

## The sites I scanned

All 7 production URLs in the Freedom Engineers portfolio:

1. `paint-pulse-eight.vercel.app` (PaintPulse — SMS-first painter SaaS)
2. `selfheal.dev` (SelfHeal — self-healing API proxy)
3. `linkrescue.io` (the hosted version of the tool doing the scanning)
4. `yorklivingcost.ca` (York Region housing calculator)
5. `freedomengineers.tech` (studio brand site)
6. `demodraft-gamma.vercel.app` (DemoDraft — outreach tool)
7. `agentready.tools` (AgentReady — AI readiness scanner)

Command used (same as the upcoming 50-site study):

```
npx linkrescue scan <site> --json
```

## Headline results

| Site | Pages | Links | OK | HTTP broken | Redirect-to-home flags |
|---|---:|---:|---:|---:|---:|
| paint-pulse-eight.vercel.app | 0 | 0 | 0 | 0 | 0 |
| selfheal.dev | 6 | 12 | 6 | 6 | 0 |
| linkrescue.io | 20 | 89 | 26 | 2 | 61 |
| yorklivingcost.ca | 15 | 52 | 13 | 0 | 39 |
| freedomengineers.tech | 14 | 0 | 0 | 0 | 0 |
| demodraft-gamma.vercel.app | 4 | 0 | 0 | 0 | 0 |
| agentready.tools | 10 | 19 | 0 | 12 | 0 |
| **Totals** | **69** | **172** | **45** | **20** | **100** |

Three things jumped out.

---

## Issue 1 (embarrassing): agentready.tools has template placeholder content that was never replaced

The scanner found 19 outbound links on agentready.tools — and all of them are broken. Samples:

```
TIMEOUT   https://yourdomain.com/page
TIMEOUT   https://yourdomain.com/another
BROKEN_4XX [405] https://acme.dev/docs/quickstart
BROKEN_4XX [405] https://acme.dev/docs/concepts
BROKEN_4XX [404] https://github.com/acme/acme-js
```

These are **starter-template placeholders** (`yourdomain.com`, `acme.dev`, `acme/acme-js`) that were shipped to production and never replaced with real content. If anyone landed on the AgentReady docs pages, they'd see dead links to `yourdomain.com` all over the place.

Fortunately, AgentReady is being sunset this weekend (the April 16 portfolio audit kills it, since Profound raised $96M and saturated the AI-visibility niche). It'll redirect to freedomengineers.tech by Monday. But the scan caught exactly the kind of issue that humiliates a product — and I'd been shipping it live for weeks without noticing.

**Lesson:** every live page needs to pass a link scan before it ships. Not monthly. Not quarterly. *Before deploy.*

---

## Issue 2 (a bug in my own tool): false positives on cross-site footer links

LinkRescue flagged 100 "redirect-to-home" issues across linkrescue.io and yorklivingcost.ca. Looking at the data:

```
REDIRECT_TO_HOME [200] https://yorklivingcost.ca/
REDIRECT_TO_HOME [200] https://agentready.tools/
REDIRECT_TO_HOME [200] https://freedomengineers.tech/
```

All flagged links are **direct links to the homepages of sister products** in the footer (`<a href="https://yorklivingcost.ca/">`). These are intentional — every Freedom Engineers product cross-links to the others.

But the scanner sees:
- Link → `https://yorklivingcost.ca/`
- 307 redirects (apex → www canonicalization)
- Final → `https://www.yorklivingcost.ca/`
- Different hostname, path is `/` → **flagged** as "redirect to home"

The detection logic in `packages/crawler/src/classifier.ts` doesn't check whether the original URL was already a root link. If someone *intended* to link to the homepage, that's not a redirect issue — it's a homepage link.

This is a **real bug** in my tool. If I'd published the 50-site study with this logic, the numbers would have been wildly inflated by every legitimate "see our other products"-style cross-link in the wild. HN would have eviscerated the data.

**Fix (committed + will ship with CLI v1.1.0):**

```typescript
function isRedirectToHome(finalUrl: string, originalUrl: string): boolean {
  try {
    const final = new URL(finalUrl);
    const original = new URL(originalUrl);

    const originalPath = original.pathname.replace(/\/+$/, '');
    const finalPath = final.pathname.replace(/\/+$/, '');

    // Skip if the original link was already pointing to the root —
    // that's a homepage link, not a redirect issue.
    if (originalPath === '' || originalPath === '/') return false;

    // Flag only when original path was non-root but final resolved to root.
    const finalIsRoot = finalPath === '' || finalPath === '/';
    const hostnameChanged = final.hostname !== original.hostname;
    return finalIsRoot && (hostnameChanged || original.pathname !== final.pathname);
  } catch {
    return false;
  }
}
```

With this fix, the 100 flagged "issues" on my own sites drop to ~5 actual issues. Which is the right answer.

---

## Issue 3 (minor): selfheal.dev's npm-package link hits a 403

On every page of selfheal.dev, the scanner got a 403 when checking `https://www.npmjs.com/package/graceful-fail`. Six pages × same link = 6 "broken" results.

Reality: npm rate-limits and blocks unknown User-Agents. When a human clicks the link, it works perfectly. When `LinkRescue-CLI/1.0 (+https://linkrescue.io)` requests it, npm returns 403.

This is a classic "bot-blocked, not broken" issue. Common false-positive source for every link checker that doesn't use a residential-IP pool. I'm not going to fix this by spoofing User-Agents — that's not what a polite scanner does. The right answer: treat 403 from known CDN/registry domains (npm, github, cloudflare, etc.) as "likely bot-blocked" rather than "broken," and tag them differently.

Added as a TODO for v1.2 of the CLI.

---

## Issue 4 (investigate): PaintPulse scanner found 0 pages

The scan of `paint-pulse-eight.vercel.app` returned `pagesScanned: 0, totalLinks: 0`. Both the sitemap discovery AND the crawl fallback returned nothing. The landing page exists and works when I visit it — but the scanner can't extract anything.

Likely culprit: Next.js + Vercel serving hydrated-HTML where the internal links are dynamically injected by React and not present in the static HTML that the scanner parses.

This affects Google's crawling of the site too. Will investigate tomorrow.

---

## Issue 5 (benign): freedomengineers.tech + demodraft both have 0 outbound links

Same pattern as PaintPulse for different reasons. FE and DemoDraft are mostly internal-link-heavy with limited outbound references. The sites are healthy — there's just not much external linkage to check.

Not a bug. Just a nothing-to-find outcome.

---

## What actually came back clean

- **linkrescue.io**: 2 real broken HTTP links (`affiliate-program.amazon.com` returning 405, `flexoffers.com` returning 403). The first is Amazon's standard bot response. The second is flexoffers.com blocking crawlers. Both are known pattern — not genuinely broken.
- **yorklivingcost.ca**: zero genuinely-broken outbound links (minus the false-positive REDIRECT_TO_HOME flags).
- **selfheal.dev**: zero genuinely-broken except the npm bot-block noise.

Net: the sites that are actually in active use are healthy. The one exception was AgentReady, which is being killed anyway.

---

## What this taught me (for the 50-site study)

Before publishing aggregate numbers from scanning 50 other people's sites, I needed to:

1. **Fix the REDIRECT_TO_HOME false positive.** Otherwise the "affiliate issues" count on the 50-site study would be wildly inflated by normal apex/www canonicalization + homepage links.
2. **Separately bucket "bot-blocked" from "genuinely broken."** Amazon, npm, Cloudflare-protected domains will all 403 any non-browser User-Agent. Reporting those as broken = fake numbers.
3. **Acknowledge crawl extraction limits.** Next.js + hydrated-SPA sites give the static-HTML scanner a hard time. The tool finds fewer links than actually exist on JS-heavy pages. Worth noting as a limitation.

All three of those cleanups are now in the pipeline before the 50-site data study publishes.

**Dogfood caught my own tool's bug before the tool was pitched to HN.** That's the highest-ROI bug find of the week.

---

*This post written while the 50-site data study scan was running in the background. Methodology for that study — and its results — will be in a follow-up post once the fixes above are shipped and the data is re-aggregated with corrected classifier logic.*
