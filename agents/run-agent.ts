// linkrescue/agents/run-agent.ts
// Runs LinkRescue agents.
// Usage: npx tsx agents/run-agent.ts prospector [niche]

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  getExistingContacts,
  getPipelineStats,
  insertContact,
  createDeal,
  logActivity,
} from "./supabase-tools";

const __dirname = dirname(fileURLToPath(import.meta.url));
const client = new Anthropic();
const IDS_FILE = join(__dirname, ".agent-ids.json");

function loadIds() {
  try {
    return JSON.parse(readFileSync(IDS_FILE, "utf-8"));
  } catch {
    console.error("❌ No .agent-ids.json. Run: npx tsx agents/setup.ts");
    process.exit(1);
  }
}

async function dispatchTool(toolName: string, input: any): Promise<string> {
  try {
    switch (toolName) {
      case "get_existing_contacts":
        return JSON.stringify(await getExistingContacts());
      case "get_pipeline_stats":
        return JSON.stringify(await getPipelineStats());
      case "insert_contact":
        return JSON.stringify(await insertContact(input));
      case "create_deal":
        return JSON.stringify(await createDeal(input));
      case "log_activity":
        return JSON.stringify(await logActivity(input));
      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  } catch (err: any) {
    console.error(`  ❌ ${toolName} failed:`, err.message);
    return JSON.stringify({ error: err.message });
  }
}

// ── Niche rotation ────────────────────────────────────────────────────
const NICHES = [
  "travel blogs",
  "personal finance blogs",
  "tech review sites",
  "outdoor gear review blogs",
  "food recipe blogs with affiliate links",
  "parenting product review blogs",
  "home improvement DIY blogs",
];

function getTargetNiche(override?: string): string {
  if (override) return override;
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return NICHES[dayOfYear % NICHES.length];
}

// ── Main ──────────────────────────────────────────────────────────────
async function run(agentKey: string, nicheOverride?: string) {
  const ids = loadIds();
  const agent = ids.agents[agentKey];

  if (!agent) {
    console.error(`❌ Unknown agent: ${agentKey}`);
    console.error(`   Available: ${Object.keys(ids.agents).join(", ")}`);
    process.exit(1);
  }

  const niche = getTargetNiche(nicheOverride);
  console.log(`\n🚀 LinkRescue Prospector Agent`);
  console.log(`   Target niche: ${niche}`);
  console.log(`   Agent: ${agent.id}\n`);

  const session = await client.beta.sessions.create({
    agent: agent.id,
    environment_id: ids.environment_id,
  });
  console.log(`📋 Session: ${session.id}\n`);

  const kickOffMessages: Record<string, string> = {
    prospector: `Find 5-10 high-quality affiliate ${niche} that would benefit from LinkRescue. Start by calling get_existing_contacts to avoid duplicates and get_pipeline_stats to see the current pipeline. Then search the web for popular ${niche} with heavy affiliate link usage. For each qualified prospect (ICP score 7+), add them to the CRM via insert_contact, create_deal, and log_activity.`,
  };
  const kickOff = kickOffMessages[agentKey] || kickOffMessages.prospector;

  let isFirstRun = true;
  let totalToolCalls = 0;

  while (true) {
    const stream = await client.beta.sessions.events.stream(session.id);

    if (isFirstRun) {
      await client.beta.sessions.events.send(session.id, {
        events: [
          { type: "user.message", content: [{ type: "text", text: kickOff }] },
        ],
      });
      isFirstRun = false;
    }

    const toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];
    let done = false;

    for await (const event of stream) {
      switch (event.type) {
        case "agent.message":
          for (const block of event.content) {
            if (block.type === "text") process.stdout.write(block.text);
          }
          break;

        case "agent.custom_tool_use":
          console.log(`\n  🔧 ${event.name}`);
          toolCalls.push({ id: event.id, name: event.name, input: event.input });
          totalToolCalls++;
          break;

        case "agent.tool_use":
          console.log(`  🔧 Built-in: ${event.name}`);
          break;

        case "session.status_idle":
          if (event.stop_reason.type !== "requires_action") {
            console.log(`\n\n⏹️  Done: ${event.stop_reason.type}`);
            done = true;
          }
          break;

        case "session.status_terminated":
          console.log("\n\n💀 Terminated");
          done = true;
          break;

        case "session.error":
          console.error("\n❌ Error:", JSON.stringify(event, null, 2));
          done = true;
          break;

        case "span.model_request_end": {
          const usage = (event as any).model_usage;
          if (usage) console.log(`  📊 ${usage.input_tokens} in / ${usage.output_tokens} out`);
          break;
        }
      }

      if (done || (toolCalls.length > 0 && event.type === "session.status_idle")) break;
    }

    if (done) break;

    if (toolCalls.length > 0) {
      console.log(`\n  ⚡ Dispatching ${toolCalls.length} tool call(s)...`);
      const results = [];
      for (const call of toolCalls) {
        const result = await dispatchTool(call.name, call.input);
        console.log(`  ✅ ${call.name} → ${result.length} chars`);
        results.push({
          type: "user.custom_tool_result" as const,
          custom_tool_use_id: call.id,
          content: [{ type: "text" as const, text: result }],
        });
      }
      await client.beta.sessions.events.send(session.id, { events: results });
      continue;
    }

    break;
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`✅ Prospecting complete — ${niche}`);
  console.log(`   Tool calls: ${totalToolCalls}`);
  console.log(`${"=".repeat(50)}\n`);
}

const agentKey = process.argv[2] || "prospector";
const nicheOverride = process.argv[3];
run(agentKey, nicheOverride).catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
