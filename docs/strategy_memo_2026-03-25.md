# LinkRescue Strategy Memo

Date: March 25, 2026

## Thesis

LinkRescue should not stay positioned as a simple affiliate broken-link monitor.

The better business is:

- near term: `commerce link integrity` for publishers and agencies
- medium term: `commerce integrity API` for workflows, internal tools, and automation
- long term: `agent-safe commerce infrastructure` for AI agents operating on the open web

The core bet is that a growing share of internet activity will come from software agents, and those agents will need reliable ways to verify links, offers, redirects, attribution, and permission to act. LinkRescue already sits close to that workflow.

## What We Know

- The affiliate and partner-commerce ecosystem is large enough to support specialized infrastructure.
- Revenue leakage and attribution failure are real, valuable problems.
- The current LinkRescue wedge is real, but too narrow if framed only as “affiliate link monitoring.”
- The current API pivot is strategically correct.
- The current pricing and worker model are not yet aligned with a true infrastructure product.

## Strategic Positioning

Current weak frame:

- affiliate link monitor

Better frame:

- commerce link integrity platform

Best long-term frame:

- agent-safe commerce verification infrastructure

This matters because “broken link checker” is crowded and low-value, while attribution protection, offer verification, and agent-safe workflows are higher-value and less crowded.

## Recommended Product Ladder

### 1. LinkRescue Core

Audience:

- publishers
- affiliate site owners
- small agencies

Job to be done:

- crawl sites
- find dead links, redirect drift, stripped params, attribution failures
- show where revenue is leaking

Why it stays:

- fastest path to revenue
- supports current distribution and launch strategy

### 2. Commerce Integrity API

Audience:

- agencies
- internal content systems
- newsletter operators
- automation-heavy teams

Job to be done:

- verify URLs programmatically
- run scans asynchronously
- receive webhooks on failures
- validate monetized outbound links before publishing or sending

Why it matters:

- best near-term expansion
- strongest monetization layer after Core
- most natural fit with existing codebase

### 3. Agent Commerce Guard

Audience:

- shopping agents
- recommendation agents
- commerce media tools
- platforms that let agents browse or act

Job to be done:

- determine whether a link or offer is live, attributable, safe, and usable
- enforce policy and permissions for agent access
- meter agent usage and log actions

Why it matters:

- highest long-term upside
- aligns with the shift toward agent-driven web activity

## Business Recommendation

Do not abandon the product.

Do not pivot to a random unrelated API.

Do widen the wedge:

- from affiliate monitoring
- to commerce integrity
- to agent-safe verification

This preserves what already works while opening a much larger category.

## Pricing Recommendation

Keep:

- Starter: free
- Pro: $29

Add:

- Growth API: $99-$149

Replace current Agency:

- Agency Infra: $249+ with usage budgets and overages

Rationale:

- current Agency pricing is too cheap if customers use API and scans heavily
- infrastructure products should be priced around included usage, not vague unlimited access

## Engineering Recommendation

Before pushing the API hard:

- enforce monthly crawl budgets
- enforce URL-check budgets
- remove or soften “unlimited” pricing language
- fix per-scan callback behavior
- move heavy scan execution off request-bound workers

Main risk over the next 6 months is not pure cloud cost. It is underpriced heavy usage plus reliability problems caused by the current scan architecture.

## 6-Month Plan

### Next 30 Days

- reposition around commerce integrity
- keep Pro live
- stop selling cheap unlimited-style Agency value
- improve API docs and reliability gaps

### 30-90 Days

- launch Growth API tier
- onboard a small number of API customers manually
- learn which workflows buyers actually automate

### 3-6 Months

- launch usage-aware Agency Infra plan
- improve scan infrastructure and metering
- begin shaping Agent Commerce Guard as the next layer

## Final Call

LinkRescue is viable.

The correct move is:

`readjust and expand`

not:

- abandon
- stay a narrow affiliate utility
- or jump to an unrelated API idea

The strongest long-term opportunity is to become the verification and integrity layer for monetized links, offers, and agent-driven commerce workflows.
