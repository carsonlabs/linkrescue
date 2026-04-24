// linkrescue/agents/run-curator.ts
// Runs the Curator Managed Agent for ONE user. Gets-or-creates a per-user
// Memory Store so insights persist across weekly runs.
//
// Usage:
//   npx tsx agents/run-curator.ts <user_id>
//
// Environment:
//   ANTHROPIC_API_KEY               — required
//   NEXT_PUBLIC_SUPABASE_URL        — required
//   SUPABASE_SERVICE_ROLE_KEY       — required (reads/writes across users)

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  getRecentIssues,
  getDismissals,
  getMatchOutcomes,
  getHealthTrends,
  getNetworkBenchmarks,
  publishInsight,
  markCuratorRun,
  getOrCreateMemoryStoreId,
} from './curator-tools';

const __dirname = dirname(fileURLToPath(import.meta.url));
const client = new Anthropic();
const IDS_FILE = join(__dirname, '.agent-ids.json');

function loadIds() {
  try {
    return JSON.parse(readFileSync(IDS_FILE, 'utf-8'));
  } catch {
    console.error('❌ No .agent-ids.json. Run: npx tsx agents/setup.ts');
    process.exit(1);
  }
}

async function dispatchTool(toolName: string, input: any): Promise<string> {
  try {
    switch (toolName) {
      case 'get_recent_issues':
        return JSON.stringify(await getRecentIssues(input.user_id));
      case 'get_dismissals':
        return JSON.stringify(await getDismissals(input.user_id));
      case 'get_match_outcomes':
        return JSON.stringify(await getMatchOutcomes(input.user_id));
      case 'get_health_trends':
        return JSON.stringify(await getHealthTrends(input.user_id));
      case 'get_network_benchmarks':
        return JSON.stringify(await getNetworkBenchmarks(input.user_id));
      case 'publish_insight':
        return JSON.stringify(await publishInsight(input));
      case 'mark_curator_run':
        await markCuratorRun(input.user_id);
        return JSON.stringify({ ok: true });
      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  } catch (err: any) {
    console.error(`  ❌ ${toolName} failed:`, err.message);
    return JSON.stringify({ error: err.message });
  }
}

async function run(userId: string) {
  if (!userId) {
    console.error('❌ Usage: npx tsx agents/run-curator.ts <user_id>');
    process.exit(1);
  }

  const ids = loadIds();
  const agent = ids.agents.curator;
  if (!agent) {
    console.error("❌ Curator agent not set up. Run: npx tsx agents/setup.ts");
    process.exit(1);
  }

  console.log(`\n🧠 LinkRescue Curator — user ${userId}`);
  console.log(`   Agent: ${agent.id}`);

  // Provision-or-reuse a per-user Memory Store.
  const beta: any = (client as any).beta;
  const storeId = await getOrCreateMemoryStoreId(userId, async () => {
    const store = await beta.memoryStores.create({
      name: `curator-user-${userId}`,
      description: `LinkRescue Curator memory for user ${userId}`,
    });
    console.log(`  🗂  Memory store created: ${store.id}`);
    return store.id as string;
  });
  console.log(`   Memory store: ${storeId}`);

  const session = await beta.sessions.create({
    agent: agent.id,
    environment_id: ids.environment_id,
    resources: [
      {
        type: 'memory_store',
        memory_store_id: storeId,
        access: 'read_write',
        instructions:
          'This store contains your long-term notes about ONE specific user. Read first, write sparingly. Max ~2KB per file.',
      },
    ],
  });
  console.log(`📋 Session: ${session.id}\n`);

  const kickOff = `Run the weekly curator workflow for user_id=${userId}. Start by listing /mnt/memory/ and reading every file. Then pull current-period data via the tools. Publish 1-3 insights via publish_insight. Update memory. Finally call mark_curator_run. Keep it tight.`;

  let isFirstRun = true;
  let totalToolCalls = 0;
  let insightsPublished = 0;

  while (true) {
    const stream = await beta.sessions.events.stream(session.id);

    if (isFirstRun) {
      await beta.sessions.events.send(session.id, {
        events: [{ type: 'user.message', content: [{ type: 'text', text: kickOff }] }],
      });
      isFirstRun = false;
    }

    const toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];
    let done = false;

    for await (const event of stream as any) {
      switch (event.type) {
        case 'agent.message':
          for (const block of event.content) {
            if (block.type === 'text') process.stdout.write(block.text);
          }
          break;

        case 'agent.custom_tool_use':
          console.log(`\n  🔧 ${event.name}`);
          toolCalls.push({ id: event.id, name: event.name, input: event.input });
          totalToolCalls++;
          if (event.name === 'publish_insight') insightsPublished++;
          break;

        case 'agent.tool_use':
          console.log(`  🔧 Built-in: ${event.name}`);
          break;

        case 'session.status_idle':
          if (event.stop_reason?.type !== 'requires_action') {
            console.log(`\n\n⏹️  Done: ${event.stop_reason?.type}`);
            done = true;
          }
          break;

        case 'session.status_terminated':
          console.log('\n\n💀 Terminated');
          done = true;
          break;

        case 'session.error':
          console.error('\n❌ Error:', JSON.stringify(event, null, 2));
          done = true;
          break;
      }

      if (done || (toolCalls.length > 0 && event.type === 'session.status_idle')) break;
    }

    if (done) break;

    if (toolCalls.length > 0) {
      console.log(`\n  ⚡ Dispatching ${toolCalls.length} tool call(s)...`);
      const results = [];
      for (const call of toolCalls) {
        const result = await dispatchTool(call.name, call.input);
        console.log(`  ✅ ${call.name} → ${result.length} chars`);
        results.push({
          type: 'user.custom_tool_result' as const,
          custom_tool_use_id: call.id,
          content: [{ type: 'text' as const, text: result }],
        });
      }
      await beta.sessions.events.send(session.id, { events: results });
      continue;
    }

    break;
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Curator run complete — user ${userId}`);
  console.log(`   Tool calls: ${totalToolCalls} | Insights published: ${insightsPublished}`);
  console.log(`${'='.repeat(50)}\n`);
}

const userId = process.argv[2];
run(userId).catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
