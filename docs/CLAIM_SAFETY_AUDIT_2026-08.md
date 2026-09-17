# Claim-safety audit — LinkRescue

**Purpose:** prevent a restored database or future deployment from reviving fabricated customer proof.
**Scope:** source content and public copy inspected 2026-08-11.
**Rule:** a claim about a customer's income, recovered revenue, ROI, or testimonial needs a dated customer record, the underlying calculation, and permission to publish. None was located for the claims below.

## Release blockers

| Location | Current/previous claim | Finding | Required disposition |
|---|---|---|---|
| `apps/web/src/app/page.tsx` | David testimonial; 47 links; $2,400/year; $340K recovered; 2,100% ROI | The component itself labelled the aggregate figures placeholders. No source record found. | **Locally corrected** to a clearly-scoped June research summary. Do not deploy until the rest of this audit is complete. |
| `apps/web/src/components/PublicStatsCounter.tsx` | $1,200/month average loss; later "commissions protected" | No substantiated source / causal methodology found. | **Locally corrected** to product description and monitored-site count only. |
| `apps/web/src/components/CalculatorTeaser.tsx` | $1,200/month average loss | No substantiated source found. | **Locally corrected** to an estimate based on the visitor's own assumptions. |
| `content/blog/case-study-revenue-recovery.md` | Purported real customer David and detailed earnings/ROI story | The file is an unsupported narrative; the existing GTM plan explicitly says it must be held until a real customer story exists. | Do not insert into a restored CMS or publish. Keep as an internal example only, or replace with an approved real case study. |
| `scripts/GO-LIVE-PASTE-2026-07-02.sql` and `scripts/insert-agency-posts.sql` | Published articles link to the fabricated case study | These scripts would revive the link during a database rebuild. | Do not run them unchanged. Load a reviewed, claim-safe content whitelist instead. |
| `content/blog/50-affiliate-sites-link-rot-study.md` | Contains `$[PLACEHOLDER]` and `[X]` placeholders | A placeholder cannot be public research. | Do not publish; use the completed June index as the source data. |

## Approved evidence language

This language is supported by `content/blog/link-rot-index-june-2026.md` and should retain its limitations:

> On June 11, 2026, LinkRescue scanned 50 well-known affiliate sites: 683 pages and 6,550 outbound links checked within the crawl budget. 5.8% of checked links were visibly broken. Attribution failures (stripped parameters plus redirects to homepages) affected 597 links, or 9.1% of checked links. Bot-blocked responses were reported separately and not counted as broken.

Never expand this into a dollar loss, ROI, or universal incidence claim. It is a research sample, not a customer-outcome study.

## Required content-recovery procedure

1. Create the new database and apply the CMS schema with an empty `blog_posts` table.
2. Build a post whitelist from source files that have no placeholders, invented case studies, unsupported competitor claims, or unverifiable calculations.
3. Import each approved post as `draft`; check live preview, title, metadata, links, and source citations.
4. Publish one reviewed item at a time after Carson approves it.
5. Add a content-review record with: author, evidence source, date checked, customer permission if applicable, and status.

## Future testimonial standard

Before a testimonial can appear anywhere:

1. Customer has bought and received the service.
2. The report and any claimed result are retained.
3. The customer has approved the exact quotation, name/anonymous description, and result wording in writing.
4. The claim distinguishes a detected issue from a verified financial outcome.
5. Someone other than the drafting agent signs off on publication.

This standard protects the buyer, Carson, and the long-term credibility of the business.
