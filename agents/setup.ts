// linkrescue/agents/setup.ts
// Creates the LinkRescue Managed Agents (Prospector + Curator).
// Idempotent — re-running it skips agents/envs already recorded in
// .agent-ids.json and only creates what's missing. Safe to run after
// adding a new agent to this file.

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const client = new Anthropic();
const IDS_FILE = join(__dirname, ".agent-ids.json");

interface StoredIds {
  environment_id?: string;
  agents?: {
    prospector?: { id: string; version?: number };
    curator?: { id: string; version?: number };
  };
  created_at?: string;
}

function loadStored(): StoredIds {
  if (!existsSync(IDS_FILE)) return {};
  try {
    return JSON.parse(readFileSync(IDS_FILE, "utf-8")) as StoredIds;
  } catch {
    return {};
  }
}

function saveStored(ids: StoredIds) {
  writeFileSync(IDS_FILE, JSON.stringify(ids, null, 2));
}

async function setup() {
  console.log("🔧 Setting up LinkRescue agents...\n");

  const stored = loadStored();
  const ids: StoredIds = {
    environment_id: stored.environment_id,
    agents: { ...(stored.agents ?? {}) },
    created_at: stored.created_at ?? new Date().toISOString(),
  };

  // ── Environment (reuse if already created) ───────────────────────────
  if (ids.environment_id) {
    console.log(`  ↩️  Reusing environment: ${ids.environment_id}\n`);
  } else {
    const env = await client.beta.environments.create({
      name: "linkrescue-ops",
      config: {
        type: "cloud",
        networking: { type: "unrestricted" },
      },
    });
    ids.environment_id = env.id;
    saveStored(ids);
    console.log(`  ✅ Environment: ${env.id}\n`);
  }

  // ── Prospector Agent (skip if already created) ───────────────────────
  if (ids.agents?.prospector?.id) {
    console.log(`  ↩️  Reusing Prospector: ${ids.agents.prospector.id}\n`);
  } else {
    console.log("Creating Prospector Agent...");
    const prospector = await client.beta.agents.create({
    name: "LinkRescue Prospector",
    model: "claude-sonnet-4-6",
    description: "Finds high-traffic affiliate blogs and content sites that would benefit from LinkRescue, scores them, and feeds qualified leads into Studio CRM.",
    system: `You are LinkRescue's prospector agent. You find affiliate bloggers and content sites that would benefit from broken link monitoring, and you feed qualified leads into the Studio CRM.

## What is LinkRescue?
LinkRescue is a SaaS that monitors affiliate links on blogs and content sites. When affiliate links break (redirects change, programs shut down, URLs rot), bloggers lose commission revenue silently. LinkRescue catches these broken links and alerts the site owner.

Pricing: Free (1 site, 200 pages) / Pro $29/mo (5 sites, 2000 pages) / Agency $79/mo (25 sites, unlimited).

## ICP: Affiliate Bloggers & Content Sites
**Best fit:**
- Travel bloggers, personal finance bloggers, tech review sites
- Sites with 50+ pages of content
- Heavy use of affiliate links (Amazon Associates, ShareASale, CJ, Impact, etc.)
- Monthly traffic 10K-500K (big enough to care, small enough to not have enterprise tools)
- Solo bloggers or small teams (1-5 people)
- WordPress, Ghost, or custom sites

**Signals of broken link pain:**
- Old content (3+ years of posts)
- Multiple affiliate programs
- No recent updates to old posts (link rot builds up)
- Complaints about broken links in comments or social
- Using redirect plugins (ThirstyAffiliates, Pretty Links) — they care about links

**Anti-Patterns (SKIP):**
- News sites (editorial links, not affiliate)
- E-commerce stores (they ARE the merchant)
- Sites with < 20 pages
- Enterprise publishers (BuzzFeed, Wirecutter — they have internal tools)
- Sites already using link monitoring (Ahrefs, Screaming Frog regulars)

## Workflow
1. Call get_pipeline_stats to understand current CRM state
2. Call get_existing_contacts to avoid duplicates
3. Use web_search to find affiliate bloggers in a specific niche
4. For each promising site:
   a. Visit their site to check for affiliate links, content depth, about page
   b. Find contact info (email, social, about page)
   c. Score them 1-10 on ICP fit (explain reasoning)
   d. If score >= 7, call insert_contact to add to CRM
   e. Call create_deal with product="linkrescue", stage="lead"
   f. Call log_activity describing how you found them and why they're a fit
5. Target 5-10 new qualified leads per run

## Niches to Rotate Through
- Travel blogs (biggest affiliate link density)
- Personal finance / credit card blogs
- Tech review / gadget sites
- Outdoor / camping / gear review blogs
- Food / recipe blogs with affiliate kitchen tools
- Parenting blogs with product recommendations
- Home improvement / DIY blogs

## Notes for Each Lead
Include in the notes:
- Estimated monthly traffic (use web clues: Alexa rank references, social followers, comment volume)
- Number of affiliate programs spotted
- How old the site is (copyright footer, oldest posts)
- Key affiliate networks used
- Specific broken link signals if any
- Suggested outreach angle

## Outreach Angle Ideas (for CRM notes)
- "I ran a free scan on your site and found X broken affiliate links"
- "Your [specific old post] has 3 dead Amazon links"
- "I noticed you use [affiliate program] — their URL structure changed last month"
- "Travel bloggers lose $X/month on average from link rot"

Keep it specific and value-driven. The goal is to give Carson enough context to send a personalized email.`,
    tools: [
      {
        type: "agent_toolset_20260401",
        default_config: { enabled: false },
        configs: [
          { name: "web_search", enabled: true },
          { name: "web_fetch", enabled: true },
        ],
      },
      {
        type: "custom",
        name: "get_existing_contacts",
        description: "Get all existing CRM contacts to avoid duplicates",
        input_schema: {
          type: "object" as const,
          properties: {},
          required: [],
        },
      },
      {
        type: "custom",
        name: "get_pipeline_stats",
        description: "Get CRM pipeline stats (contacts by source, LinkRescue deals by stage)",
        input_schema: {
          type: "object" as const,
          properties: {},
          required: [],
        },
      },
      {
        type: "custom",
        name: "insert_contact",
        description: "Add a new lead to the Studio CRM",
        input_schema: {
          type: "object" as const,
          properties: {
            name: { type: "string", description: "Contact name (person or blog name)" },
            email: { type: "string", description: "Email address if found" },
            company: { type: "string", description: "Blog/site name" },
            phone: { type: "string", description: "Phone if found (rare for bloggers)" },
            source: { type: "string", description: "Always 'linkrescue_prospector'" },
            notes: { type: "string", description: "ICP score, traffic estimate, affiliate signals, outreach angle" },
          },
          required: ["name", "source"],
        },
      },
      {
        type: "custom",
        name: "create_deal",
        description: "Create a deal in the CRM pipeline for this lead",
        input_schema: {
          type: "object" as const,
          properties: {
            contact_id: { type: "string", description: "UUID of the contact just created" },
            title: { type: "string", description: "Deal title, e.g. 'LinkRescue Pro — NomadTravel Blog'" },
            product: { type: "string", description: "Always 'linkrescue'" },
            stage: { type: "string", description: "Always 'lead' for new prospects" },
            value: { type: "number", description: "Estimated deal value (29 for Pro, 79 for Agency)" },
            notes: { type: "string", description: "Why this is a good fit, suggested tier" },
          },
          required: ["contact_id", "title", "product", "stage"],
        },
      },
      {
        type: "custom",
        name: "log_activity",
        description: "Log a prospecting activity in the CRM",
        input_schema: {
          type: "object" as const,
          properties: {
            contact_id: { type: "string", description: "UUID of the contact" },
            type: { type: "string", description: "Activity type: 'prospecting', 'research', 'outreach'" },
            description: { type: "string", description: "What was done — how found, what was discovered" },
          },
          required: ["contact_id", "type", "description"],
        },
      },
    ],
  });
    ids.agents!.prospector = { id: prospector.id, version: (prospector as any).version };
    saveStored(ids);
    console.log(`  ✅ Prospector Agent: ${prospector.id}\n`);
  }

  // ── Curator Agent (skip if already created) ──────────────────────────
  // Weekly per-user agent with persistent memory (attached at session start
  // via Memory Stores). Analyzes the user's broken-link history, dismissal
  // patterns, and match outcomes, and publishes insights back to the app.
  if (ids.agents?.curator?.id) {
    console.log(`  ↩️  Reusing Curator: ${ids.agents.curator.id}\n`);
  } else {
    console.log("Creating Curator Agent...");
    const curator = await client.beta.agents.create({
    name: "LinkRescue Curator",
    model: "claude-sonnet-4-6",
    description: "Per-user weekly agent that analyzes broken-link patterns, dismissal history, and match outcomes, and publishes insights to the user's dashboard. Carries memory across runs via a user-scoped Memory Store.",
    system: `You are LinkRescue's Curator — a per-user analyst agent. You run weekly for ONE user at a time. Your job: read the user's broken-link history, dismissal patterns, and match outcomes; surface what's new, what's concerning, and what they should do; and remember everything useful so the NEXT weekly run picks up where you left off.

## You have persistent memory
A per-user Memory Store is mounted at /mnt/memory/. On the first run it's empty. On every subsequent run, read what your past self wrote BEFORE you start new analysis. Keep files organized:
- /mnt/memory/user_profile.md — who the user is, their site(s), ICP signals you inferred
- /mnt/memory/program_history.md — per-affiliate-program rot history you've tracked
- /mnt/memory/dismissal_patterns.md — what kinds of alerts the user ignores
- /mnt/memory/past_recommendations.md — what you recommended, whether it seemed to land

Write sparingly and clearly. These are notes to your FUTURE self, not the user. Max ~2KB per file.

## Workflow every run
1. **Read memory first.** List /mnt/memory/ and read every file. Treat it as ground truth unless data clearly contradicts.
2. **Pull current-period data.** Use get_recent_issues, get_dismissals, get_match_outcomes, get_health_trends, AND get_network_benchmarks for the target user_id (passed in the kickoff message). Always call get_network_benchmarks — it tells you how THIS user's rot rates compare to every other LinkRescue user on the same programs. That comparison is often your best insight.
3. **Diff against memory.** What's new this week? Which patterns strengthened, which reversed? Which hosts now appear in network anomalies?
4. **Surface 1-3 insights max.** Quality over quantity. Publish each via publish_insight with a concrete headline and body. Prefer insights grounded in the benchmark data ("your X is Ny× the LinkRescue network average") over generic observations. Valid kinds:
   - summary — "3 broken links fixed this week, 2 new (both Amazon). Health +4 pts."
   - recommendation — "Your CJ Affiliate rot rate is 4× the LinkRescue network average — consider consolidating to ShareASale replacements."
   - alert_suppression — "You've dismissed 14 amazon.ca 302s. I'll assume these are regional redirects and stop surfacing them."
   - program_risk — "Impact.com rot across the LinkRescue network jumped from 4% to 18% this month. Likely platform-level change — not just you."
5. **Update memory** with what you learned THIS week. Overwrite, don't append indefinitely.
6. **Mark run complete** via mark_curator_run.

## Tone for published insights
- Headline: 60 chars, no fluff. "Amazon links rot spiked in Q4" not "I noticed that...".
- Body: 2-3 sentences max. Always include a specific number or a specific action.
- Never alarm without evidence. Never recommend without showing the tradeoff.

## What to NEVER do
- Do not write to memory about other users.
- Do not invent numbers — only cite data returned by tools.
- Do not publish more than 3 insights per run.
- Do not suppress alerts unless the user has a clear dismissal pattern justifying it.`,
    tools: [
      {
        // File tools so the agent can read/write its Memory Store mounted
        // at /mnt/memory/ (the store itself is attached at SESSION creation,
        // not here — see apps/web/src/lib/curator/runner.ts `resources[]`).
        type: "agent_toolset_20260401",
        default_config: { enabled: false },
        configs: [
          { name: "read", enabled: true },
          { name: "write", enabled: true },
          { name: "edit", enabled: true },
          { name: "glob", enabled: true },
          { name: "grep", enabled: true },
        ],
      },
      {
        type: "custom",
        name: "get_recent_issues",
        description: "Get the user's most recent 100 broken/problem scan results (non-OK issue_types) across all their sites.",
        input_schema: {
          type: "object" as const,
          properties: {
            user_id: { type: "string", description: "UUID of the target user" },
          },
          required: ["user_id"],
        },
      },
      {
        type: "custom",
        name: "get_dismissals",
        description: "Get all of the user's dismissal rules (per-link and per-host) including optional reasons they wrote.",
        input_schema: {
          type: "object" as const,
          properties: {
            user_id: { type: "string", description: "UUID of the target user" },
          },
          required: ["user_id"],
        },
      },
      {
        type: "custom",
        name: "get_match_outcomes",
        description: "Get the user's recent match outcomes (applied/rejected offer matches) with offer metadata.",
        input_schema: {
          type: "object" as const,
          properties: {
            user_id: { type: "string", description: "UUID of the target user" },
          },
          required: ["user_id"],
        },
      },
      {
        type: "custom",
        name: "get_health_trends",
        description: "Get daily health-score snapshots for all of the user's sites over the last 90 days.",
        input_schema: {
          type: "object" as const,
          properties: {
            user_id: { type: "string", description: "UUID of the target user" },
          },
          required: ["user_id"],
        },
      },
      {
        type: "custom",
        name: "get_network_benchmarks",
        description: "Cross-user 30-day rot-rate benchmarks. Returns network_averages (rot rate per host across every LinkRescue user), user_rates (this user's rate per host), and anomalies (hosts where this user's rot rate is ≥1.5× the network average, sorted by severity). Call this every run — it's the richest comparative context you have.",
        input_schema: {
          type: "object" as const,
          properties: {
            user_id: { type: "string", description: "UUID of the target user" },
          },
          required: ["user_id"],
        },
      },
      {
        type: "custom",
        name: "publish_insight",
        description: "Publish a user-facing insight to their dashboard. Max 3 insights per run.",
        input_schema: {
          type: "object" as const,
          properties: {
            user_id: { type: "string", description: "UUID of the target user" },
            kind: {
              type: "string",
              enum: ["summary", "recommendation", "alert_suppression", "program_risk"],
              description: "Insight kind",
            },
            headline: { type: "string", description: "≤60 chars, concrete and specific" },
            body: { type: "string", description: "2-3 sentences with a number or action" },
            metadata: {
              type: "object",
              description: "Optional structured payload (programs, counts, etc.)",
              additionalProperties: true,
            },
          },
          required: ["user_id", "kind", "headline"],
        },
      },
      {
        type: "custom",
        name: "mark_curator_run",
        description: "Mark the curator run complete for this user (stamps users.curator_last_run_at).",
        input_schema: {
          type: "object" as const,
          properties: {
            user_id: { type: "string", description: "UUID of the target user" },
          },
          required: ["user_id"],
        },
      },
    ],
  });
    ids.agents!.curator = { id: curator.id, version: (curator as any).version };
    saveStored(ids);
    console.log(`  ✅ Curator Agent: ${curator.id}\n`);
  }

  saveStored(ids);
  console.log(`💾 Saved to ${IDS_FILE}`);
  console.log("\n🎉 Done.");
  console.log(`\nNext steps:`);
  console.log(`  • Set Vercel env: CURATOR_AGENT_ID=${ids.agents?.curator?.id ?? "<run this again>"}`);
  console.log(`  • Set Vercel env: CURATOR_ENVIRONMENT_ID=${ids.environment_id}`);
  console.log(`  • Test locally: npx tsx agents/run-curator.ts <user_id>`);
}

setup().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
