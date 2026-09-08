# LinkRescue First-Week Distribution Kit

## Goal

Start conversations with international, English-speaking affiliate publishers who have existing content sites. The first-week target is **five qualified conversations**, not traffic for its own sake. Send no automated outreach and do not make performance or revenue guarantees.

## The offer to share

LinkRescue provides a free, limited technical leak snapshot for publicly reachable content sites. For a suitable site, the next step is a human-scoped Recovery Sprint ($499) or a readiness review for a Monitoring Desk ($149/month). No self-serve checkout is active.

Use the free-scan landing page for all initial distribution. It is the least-committal, truthful call to action:

`https://www.linkrescue.io/free-scan`

## Campaign links

Use a different link per channel. The owner lead inbox reads the `utm_campaign` tag from the page referrer, so it will show which channel produced each enquiry.

| Channel | Share this link |
| --- | --- |
| LinkedIn | `https://www.linkrescue.io/free-scan?utm_source=linkedin&utm_medium=organic&utm_campaign=pilot_linkedin` |
| X / Twitter | `https://www.linkrescue.io/free-scan?utm_source=x&utm_medium=organic&utm_campaign=pilot_x` |
| Reddit, where a community explicitly allows it | `https://www.linkrescue.io/free-scan?utm_source=reddit&utm_medium=community&utm_campaign=pilot_reddit` |
| Indie Hackers / maker communities, where allowed | `https://www.linkrescue.io/free-scan?utm_source=indiehackers&utm_medium=community&utm_campaign=pilot_ih` |
| Direct, personal introduction | `https://www.linkrescue.io/free-scan?utm_source=direct&utm_medium=personal&utm_campaign=pilot_direct` |

## Day 1: prepare

1. Sign in at `/dashboard/leads` using the owner address. Confirm that **Draft personal reply** opens your mail client with a review-first message.
2. Create a personal profile on the communities you genuinely plan to use. Do not use a company account where a community requires a personal maker account.
3. Spend 20–30 minutes reading recent discussions and write down two recurring problems people describe. This is the language to use in your posts.
4. Pick only two channels for the week. Recommendation: LinkedIn plus one relevant community in which you can contribute authentically.

## Day 2: LinkedIn post

Post from Carson's own profile only after he gives exact approval for this one action. This
version uses the verified tag-drop finding as the hook and has no observation placeholder to
fill from memory.

> A link can return HTTP 200 and still lose the affiliate tag.
>
> In a June 2026 research scan, LinkRescue checked 6,550 outbound links across 50 established
> affiliate sites. Attribution failures affected 597 checked links (9.1%), compared with 5.8%
> that were visibly broken. Bot-blocked responses were reported separately, and the rates apply
> only to links checked within the crawl budget.
>
> I am running a small service-led pilot for publishers who want a limited technical snapshot
> of a public content site. It checks observable broken links, redirects, and visible
> tracking-parameter problems. It does not estimate lost revenue or promise recovery.
>
> I am looking for a few sites to learn which findings are actually useful. Free snapshot:
> https://www.linkrescue.io/free-scan?utm_source=linkedin&utm_medium=organic&utm_campaign=pilot_linkedin

Reply thoughtfully to every comment. Do not pitch in comments that ask unrelated questions.

### Preflight verified 2026-09-08

- `https://www.linkrescue.io/api/health` returned HTTP 200 with `web: ok` and `database: ok`
  on production version `900c4a4`.
- The exact LinkedIn campaign URL returned HTTP 200 and preserved `utm_source=linkedin`,
  `utm_medium=organic`, and `utm_campaign=pilot_linkedin`.
- The live landing page says the snapshot reports observable evidence and does not estimate
  lost revenue.
- Public search results show the service-led positioning and the same scoped June study
  numbers, with no revenue promise.
- No post, comment, message, scan, lead submission, payment, deployment, or customer-data
  action was made during this verification.

### Exact approval scope

Approval for this pilot means only: publish the quoted post above once from Carson's personal
LinkedIn profile with the exact campaign URL. It does not approve direct messages, comment
pitches, ads, email, automated follow-up, billing, scans of prospect sites, or another channel.

After publishing, record observed outcomes only: post URL and time, enquiries labelled
`pilot_linkedin`, qualified conversations, scope requests, and paid work. Zero observed leads
means zero observed leads; do not infer traffic or lost tracking from missing data.

## Day 3: community research post

Before posting, read the community's written rules and recent accepted posts. If self-promotion is not allowed, do not post a link; answer relevant questions helpfully instead.

> I am researching a narrow problem for affiliate-content publishers: when an older outbound link silently turns into a dead page, a generic homepage redirect, or loses a visible tracking parameter.
>
> For people who manage established content sites: which of those is hardest to catch, and how do you notice it today?
>
> I am testing a small browser-based diagnostic and would value a few sites for feedback. If links are permitted here, I can share it; otherwise I will keep this as research only.

Only add the Reddit/Indie Hackers campaign link if a moderator rule or thread norm explicitly permits it.

## Day 4: X / Twitter thread

> 1/ Affiliate publishers can lose clicks when old outbound links quietly rot. The obvious 404 is only one case.
>
> 2/ A destination can redirect to a homepage, a product can disappear, or a visible affiliate parameter can be lost during a redirect.
>
> 3/ I am testing a small LinkRescue pilot: a limited technical snapshot for public content sites. It reports observable link evidence only—no revenue promises.
>
> 4/ I am looking for a few publishers who want to pressure-test whether the report is useful. Free snapshot: [X campaign link]

Respond to questions rather than repeating the link. Do not tag strangers or send unsolicited direct messages.

## Day 5: personal introductions

Use only real relationships or introductions the recipient would reasonably welcome. Personalize the first two sentences; never bulk-send this.

> Hi [name] — I saw you publish [specific site/niche]. I am testing a small service for affiliate-content publishers that surfaces observable broken or misdirected outbound links on public pages.
>
> It is a limited technical snapshot, not a revenue guarantee or an automated sales sequence. If it is relevant, here is the free scan: [direct campaign link]. If not, no worries at all.

## Lead handling

1. Check the owner inbox daily and use the campaign label to see what is producing real interest.
2. Reply within one business day, after reading the site first.
3. Ask about key merchants, suspected problem pages, and primary country before suggesting paid work.
4. Send one follow-up after four business days, then stop.
5. Do not quote custom work or request payment until a prospect agrees to a written technical scope.

## Friday review

Record the count for each channel:

| Channel | Enquiries | Qualified conversations | Scope requests | Paid work |
| --- | ---: | ---: | ---: | ---: |
| LinkedIn |  |  |  |  |
| Community |  |  |  |  |
| X |  |  |  |  |
| Direct |  |  |  |  |

Keep the channel that produces qualified conversations. Pause channels that produce only clicks or irrelevant enquiries. Do not change the public price until you have at least three real scope conversations.

## Platform guardrails

- Product Hunt requires a personal maker account and says its community should be engaged authentically; it forbids asking people directly to upvote or paying for voting. Treat it as a later product-validation launch, not this week's primary acquisition channel. [Product Hunt launch guidance](https://www.producthunt.com/launch)
- Product Hunt also recommends using a direct product URL and a first comment, and supports drafts/scheduled launches. Keep any future launch claim-safe and usable on day one. [How to post a product](https://help.producthunt.com/en/articles/479557-how-to-post-a-product)
- Reddit's own organic-engagement guidance warns against self-promotional spam. Follow each community's rules and post without a link when rules require it. [Reddit organic engagement guide](https://redditinc.com/hubfs/Reddit%20Inc/Content/Reddit%20Pros%20organic%20playbook.pdf)
