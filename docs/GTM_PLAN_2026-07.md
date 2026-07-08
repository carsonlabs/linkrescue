# LinkRescue GTM v2 — The Index Engine (July 2026)

> Supersedes the launch section of `MARKETING_PLAN.md` (March) and upgrades the Day 1–5 drip in `outreach-output/SEND-READY-index-launch.md` from a one-week burst into a repeating monthly engine.
> Constraints (unchanged, hard): **no cold email** · outward-facing sends = Carson only · Q2/Q3 = distribute, not build · Carson budget ≈ 20–30 min/day.

## Positioning (locked, from the 2026-07-07 competitive refresh)

**"Trackonomics-grade link integrity for the 99% of publishers who will never spend $16k/yr — the only self-serve scanner that checks whether your affiliate tag survives every redirect, on every network, from $29/mo."**

Third-party proof points to pair with our data, always in this order:
1. **Ours (counted):** June index — 6,550 links, 9.1% broken attribution vs 5.8% broken, lost params = 58% of all issues, median 27 issues/site.
2. **Theirs (industry):** impact.com/Trackonomics' own published stats — 40%+ of affiliate URLs have link rot, "$160M+/yr industry loss." The enterprise vendor validates the problem; we're the self-serve answer.

The differentiated claim nobody else can make: **we publish our data monthly, in public, with methodology.** Moonpull sells to networks. Trackonomics sells at $16k/yr. AMZ Watcher is Amazon-only. The indie lane is still empty (verified 2026-07-07).

## Why the current plan under-delivers

1. **It's a week, not an engine.** The Day 1–5 drip has no month-2. The index is *monthly* — the entire point is compounding authority, and nothing schedules July's study or its distribution.
2. **SEO assets are sitting in a drawer.** 6 of 9 finished posts unpublished, including the money keyword ("best affiliate link checker," ~1,200/mo adjacent volume). Fixed this session: 3 more posts in `scripts/PUBLISH-PASTE-2026-07-08.sql`.
3. **No borrowed audiences.** Reddit is rented attention with mod risk. Newsletters and podcasts that ICP publishers already read/hear are the durable multiplier, and the plan named them without drafting the asks.
4. **The reply moment is the whole funnel and it was manual.** In-thread "want me to scan your site?" → shareable `/scan/[id]` result is our highest-intent conversion event. Now operationalized (see Reply Engine).
5. **Nothing measured the funnel.** Gate 2 (100 free scans / first paid by Jul 31) had no instrumentation checklist. The foreman heartbeat now carries ACR-style live metrics; LinkRescue counts get the same treatment (see Measurement).

## The Engine (four loops, one asset)

```
            ┌────────────────────────────────────────────────┐
            │  MONTHLY LINK ROT INDEX (the data asset)       │
            └────────────────────────────────────────────────┘
   Loop 1: COMMUNITY        Loop 2: BORROWED AUDIENCES
   Reddit/X/HN/IH drops     newsletters · podcasts · creator collabs
        │                        │
        ▼                        ▼
   free scans (shareable /scan/[id] results)  ← Loop 3: GIFT AUDITS
        │                                        (5/wk, personally sent)
        ▼
   email capture → Pro $29 / Agency $79
        │
        ▼
   Loop 4: PROGRAMMATIC SEO (/vs, /check, blog) compounds in background
        │
        ▼
   more scan data → next month's index is better → repeat
```

## Channel playbooks

### 1. Community drops (Week 1 of each month, one channel/day)
- **Assets:** `SEND-READY-index-launch.md` (Day 1 r/juststart · Day 2 X thread · Day 3 r/affiliatemarketing) + **NEW** `SEND-READY-exposure-pack.md` (Day 4 Hacker News · Day 5 Indie Hackers · Day 6 r/blogging).
- **Rules:** value post, no link in body on Reddit; tool only when asked; never argue with skeptics — offer to scan their site instead. A skeptic whose scan finds 14 broken tags becomes the thread's best comment.
- **Carson time:** ~10 min/day posting + reply triage via Dispatcher cards.

### 2. Borrowed audiences (Week 2, the durable multiplier)
- **Newsletters** (pitches drafted in the exposure pack): Niche Pursuits newsletter, Fat Stacks Forum/newsletter, Detailed (Glen Allsopp), They Got Acquired / indie-publisher adjacents. Offer: exclusive per-niche cut of the index data (travel vs finance vs food rot rates) they can publish as their own chart — we're cited as source. Data-as-gift, not link-begging.
- **Podcasts:** refresh already drafted (`podcast-pitches-2026-04-21.md` + the one-line June update in the send-ready pack). Niche Pursuits + Authority Hacker. One yes = beachhead.
- **Cadence:** 2 pitches/week until 2 placements land. Carson sends (outward), Claude drafts + tracks.

### 3. Gift-first audits (Loop 3 — sanctioned by Decision #0001's "gift-first scan reports")
- Regenerate the 25 stale March per-site folders in `outreach-output/` with the June scanner (**on Wi-Fi only** — 25 crawls is hotspot-hostile). Fix the known copy bug ("0 broken links... costing $200/month") before any send.
- 5/week, personally addressed, no pitch: "ran your site through the study methodology, here's what it found, fix list attached, no strings." The ask comes only if they reply.
- These are the future testimonials and the July index's case-study quotes.

### 4. Programmatic SEO (background, compounds)
- 3 more posts go live with this week's paste (comparison money-post + 2 evergreen how-tos, all now citing the index).
- Remaining: `case-study-revenue-recovery.md` (**hold** — needs a real customer story; a fabricated case study would poison the data-credibility brand), `dogfood-self-audit` (publish after next self-scan refresh), `white-label`/`agency` posts already live.
- Populate 2 more /check networks (Amazon Associates, ShareASale — the two highest-volume keywords) next content session.
- Each month's index links to all of them; they all link to the free scan.

### 5. Paid (gated, unchanged)
- Decision #0002 stands: $5/day Google Search test earliest ~Jul 17, **trigger = organic scan→email ≥ 20%**. Plan ready at `outreach-output/ads-test-plan-2026-07.md`. Paid is a multiplier on a funnel that converts, never a substitute for one.

### Explicitly not doing
- Product Hunt (wrong audience — buyers are publishers, not SaaS tourists; revisit for the API/agent-commerce angle in Q4).
- Cold email (hard constraint).
- New features (Q2/Q3 rule; free scan + index + existing tiers are enough to sell).

## The Reply Engine (the conversion moment, now infrastructure)

When Carson posts and replies arrive:
1. Carson sends the thread link to Claude (or drops it in the session).
2. Claude runs `pipelines/lr-reply-drafter` — reads the thread, runs free scans for anyone who shared a site, drafts every reply with real scan numbers, writes them to `outreach-output/replies/<thread>/`.
3. Drafts surface as Dispatcher cards (copy text ready). Carson pastes. Nothing auto-posts.
4. Every scan run for a commenter = a shareable `/scan/[id]` link in the reply — the product demos itself inside the thread.

## Measurement (wired into the Foreman)

- **Gate 2 (Decision #0001):** 100 free scans + first paid by **Jul 31**.
- **Ads gate (Decision #0002):** scan→email ≥ 20% organic.
- The foreman heartbeat (every 3h) already carries ACR funnel counts; LinkRescue gets the same: a `funnel_counts()`-style read-only RPC (scans run / emails captured / paying subs) — needs one migration in the linkrescue Supabase project (Carson paste; Claude drafts it next session, or bundled with the next SQL ask).
- Weekly beat: the Dispatcher's LinkRescue metrics card shows Gate-2 pace ("Day N: X/100 scans · first-paid: no") — same pattern as the ACR 14-day gate card.

## July calendar (Carson-minutes in parentheses)

| Week | Beats |
|---|---|
| **Jul 8–12** | Paste `PUBLISH-PASTE-2026-07-08.sql` (2m) · set REVALIDATE_SECRET (3m) · Day 1 r/juststart (10m) · Day 2 X thread (5m) · Day 3 r/affiliatemarketing (10m) · Day 4 HN (5m) · Day 5 IH (5m) · thread links → Claude after each |
| **Jul 13–19** | r/blogging (10m) · 2 newsletter pitches (5m ea) · 2 podcast pitches (5m ea) · gift audits regenerated on Wi-Fi (Claude) → first 5 sent (15m) · ads go/no-go check Jul 17 vs scan→email % |
| **Jul 20–26** | 2 more newsletter pitches · next 5 gift audits · July 50-site study runs (Claude, new tiered-fetch build → fresh gate number + 2 new index stats: "blocks declared crawlers" / "hard bot wall") |
| **Jul 27–31** | July index drafted + published · **Gate 2 verdict Jul 31**: 100 scans/first paid → continue; miss badly → tighten to one channel + gift audits only, review at Decision #0001's Sept 7 checkpoint |

## August+ (the loop, steady state)

Week 1 index drop → Week 2 borrowed audiences → Week 3 gift audits + study run → Week 4 next index + gate review. Same assets, fresher data, compounding citations. By September the index has 3 published months — that's when podcast pitches convert and "as seen in" starts writing itself.
