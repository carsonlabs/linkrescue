# Claude Code Handoff

Date: March 25, 2026

## Objective

Reposition LinkRescue from a narrow affiliate monitoring tool into a broader commerce integrity product with a clear path toward API and agent-focused infrastructure.

This document is the practical handoff for implementation work.

## Main Strategic Change

Old frame:

- affiliate broken-link monitor

New frame:

- commerce link integrity platform

Future frame:

- agent-safe commerce verification infrastructure

## Immediate Priorities

### 1. Fix Messaging

Current messaging over-anchors on:

- broken links
- affiliate blogs
- cheap monitoring

New messaging should emphasize:

- monetized outbound link integrity
- attribution protection
- redirect drift detection
- API and workflow integration
- future agent-safe verification

### 2. Fix Pricing Positioning

Current issue:

- current Agency plan is too cheap and promises too much for an infrastructure-style product

Required change:

- keep Starter
- keep Pro at $29
- remove or soften current $79 “unlimited/hourly/API” framing
- replace with a more premium API/Teams/Agency framing

### 3. Fix Product Credibility Gaps

Before pushing API harder:

- enforce usage budgets
- review scan callback behavior
- verify webhooks match docs
- review worker/runtime limitations
- stop promising unlimited behavior unless it is actually supportable

## Naming and Positioning Options

### Option A: Keep LinkRescue Brand, Expand Category

Homepage/category language:

- LinkRescue
- Commerce Link Integrity for Publishers, Agencies, and AI Agents

Pros:

- lowest brand disruption
- easiest rollout

Cons:

- brand name still sounds affiliate-specific / rescue-oriented

### Option B: Keep Brand, Add Product Descriptor

Examples:

- LinkRescue Commerce Integrity API
- LinkRescue Offer Integrity
- LinkRescue Agent Guard

Pros:

- preserves existing brand while opening a bigger story

Cons:

- needs cleaner IA and product naming

### Option C: Evolve Toward New Parent Category Later

Examples:

- LinkRescue by [future platform name]
- Agent-safe commerce verification

Pros:

- strongest long-term positioning

Cons:

- premature for now

Recommended:

- use Option A now
- borrow from Option B for API docs and future product pages

## Homepage Copy Direction

### Recommended Headline Options

1. `Commerce Link Integrity for Publishers, Agencies, and AI Agents`
2. `Verify Every Revenue-Critical Link Before It Costs You Money`
3. `Detect Broken Destinations, Lost Attribution, and Redirect Drift`

### Recommended Subhead

LinkRescue scans sites, verifies monetized links, and alerts you when broken destinations, stripped parameters, or redirect changes threaten revenue. Use the dashboard, API, or webhooks to plug integrity checks into your workflow.

### Recommended Value Props

1. `Monitor`

- Crawl sites and detect revenue-killing link failures fast.

2. `Verify`

- Check links and offers with an API before publishing, sending, or recommending them.

3. `Protect`

- Preserve attribution and trust across human workflows and AI-driven systems.

## Pricing Page Changes

### Current Problematic Claims

Reduce or remove:

- `Unlimited pages per scan`
- `Hourly scans + API` at a low price
- anything that implies cheap, unmetered infrastructure

### Recommended Public Pricing Structure Now

- Starter: free
- Pro: $29
- Teams / API: `From $99` or `Contact`

This is acceptable as an interim step even before full pricing refactor.

### Recommended Full Future Pricing

- Starter: $0
- Pro: $29
- Growth API: $99-$149
- Agency Infra: $249+

## Suggested Pricing Table Language

### Starter

- 1 site
- up to 200 pages per scan
- weekly scans
- core integrity checks

### Pro

- 3 sites
- up to 1,000 pages per scan
- 10,000 crawl pages per month
- daily scans
- light API access

### Growth API

- 10 sites
- up to 2,500 pages per scan
- 50,000 crawl pages per month
- API and webhooks
- Slack integration

### Agency Infra

- 25 sites
- higher crawl budgets
- workflow integrations
- usage-aware pricing
- priority support

## Product and Docs Changes

### API Docs

Update docs to frame the API as:

- link verification
- scan orchestration
- webhook-driven integrity monitoring
- pre-publish / pre-send validation

### Landing Pages

Add or revise pages for:

- `/api`
- `/api-landing`
- pricing
- homepage

Optional future pages:

- `offer-integrity`
- `agent-commerce`
- `commerce-link-integrity`

## Engineering Checklist

### Pricing and Limits

- audit all tier definitions
- enforce monthly crawl page budgets
- enforce URL-check budgets
- review API request vs URL-check metering

### API Reliability

- verify per-scan webhook callback behavior
- verify public docs reflect actual runtime behavior
- review rate-limiting semantics and headers

### Scan Infrastructure

- review 5-minute worker constraint
- identify heavy scan paths
- plan queue/background execution for larger jobs
- review scan progress and retry behavior

### Trust and Safety

- review block/rate-limit behavior by domain
- consider future proxy / egress strategy
- document what happens on merchant blocking

## Content Deliverables to Create

### 1. Homepage Rewrite

Need:

- new headline
- new subhead
- new value props
- new CTA framing

### 2. Pricing Rewrite

Need:

- revised plan names or labels
- reduced “unlimited” claims
- API/Teams positioning

### 3. API Positioning Rewrite

Need:

- use cases for publishers
- use cases for agencies
- use cases for internal tools
- use cases for AI-agent workflows

## Product Wedges to Preserve

Do not lose the current strengths:

- broken-link detection
- lost parameter detection
- redirect drift / homepage redirects
- scan workflows
- affiliate revenue framing

These should remain inside the broader story, not be discarded.

## Final Recommendation for Implementation

Short version:

1. keep the brand
2. expand the category
3. premium-price API access
4. stop overpromising unlimited infrastructure
5. build toward agent-safe commerce verification

## Ask for Claude Code

If Claude Code is executing changes, prioritize in this order:

1. homepage messaging updates
2. pricing page copy updates
3. API docs positioning updates
4. tier/limits audit
5. usage budget enforcement review
6. webhook/scan callback verification

The goal is not just a copy refresh. The goal is aligning product story, pricing, and engineering reality with the long-term agent-commerce thesis.
