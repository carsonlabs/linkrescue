// Runs the Curator Managed Agent for ONE user. Reusable from the weekly
// cron and from a manual admin endpoint. Mirrors the standalone CLI script
// at agents/run-curator.ts but as an async function.

import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@linkrescue/database';
import {
  getRecentIssues,
  getDismissals,
  getMatchOutcomes,
  getHealthTrends,
  getNetworkBenchmarks,
  publishInsight,
  markCuratorRun,
  getOrCreateMemoryStoreId,
} from './tools';

interface AgentIds {
  environment_id: string;
  agents: {
    curator?: { id: string; version?: string };
  };
}

export interface CuratorRunResult {
  userId: string;
  sessionId: string | null;
  memoryStoreId: string | null;
  toolCalls: number;
  insightsPublished: number;
  error?: string;
}

function getAgentIds(): AgentIds {
  // The standalone CLI stores these in agents/.agent-ids.json. For
  // production we read from env so Vercel deployments don't need a file on
  // disk. Set CURATOR_AGENT_ID and CURATOR_ENVIRONMENT_ID after running
  // `npx tsx agents/setup.ts` and copying the printed IDs into Vercel.
  const agentId = process.env.CURATOR_AGENT_ID;
  const envId = process.env.CURATOR_ENVIRONMENT_ID;
  if (!agentId || !envId) {
    throw new Error(
      'CURATOR_AGENT_ID / CURATOR_ENVIRONMENT_ID env vars not set. Run `npx tsx agents/setup.ts`, then copy the printed IDs into Vercel project env.',
    );
  }
  return { environment_id: envId, agents: { curator: { id: agentId } } };
}

export async function runCuratorForUser(
  userId: string,
  opts: { maxIterations?: number } = {},
): Promise<CuratorRunResult> {
  const maxIterations = opts.maxIterations ?? 20;
  const result: CuratorRunResult = {
    userId,
    sessionId: null,
    memoryStoreId: null,
    toolCalls: 0,
    insightsPublished: 0,
  };

  try {
    const ids = getAgentIds();
    const agent = ids.agents.curator!;
    const admin = createAdminClient();
    const client = new Anthropic();
    const beta: any = (client as any).beta;

    const storeId = await getOrCreateMemoryStoreId(admin, userId, async () => {
      const store = await beta.memoryStores.create({
        name: `curator-user-${userId}`,
        description: `LinkRescue Curator memory for user ${userId}`,
      });
      return store.id as string;
    });
    result.memoryStoreId = storeId;

    const session = await beta.sessions.create({
      agent: agent.id,
      environment_id: ids.environment_id,
      resources: [
        {
          type: 'memory_store',
          memory_store_id: storeId,
          access: 'read_write',
          instructions:
            'Long-term notes about ONE specific user. Read first, write sparingly. Max ~2KB per file.',
        },
      ],
    });
    result.sessionId = session.id;

    const kickOff = `Run the weekly curator workflow for user_id=${userId}. List /mnt/memory/ first and read every file. Pull current-period data. Publish 1-3 insights. Update memory. Call mark_curator_run. Keep it tight.`;

    let isFirstRun = true;
    let iterations = 0;

    while (iterations < maxIterations) {
      iterations++;
      const stream = await beta.sessions.events.stream(session.id);

      if (isFirstRun) {
        await beta.sessions.events.send(session.id, {
          events: [{ type: 'user.message', content: [{ type: 'text', text: kickOff }] }],
        });
        isFirstRun = false;
      }

      const toolCalls: Array<{ id: string; name: string; input: any }> = [];
      let done = false;

      for await (const event of stream as any) {
        switch (event.type) {
          case 'agent.custom_tool_use':
            toolCalls.push({ id: event.id, name: event.name, input: event.input });
            result.toolCalls++;
            if (event.name === 'publish_insight') result.insightsPublished++;
            break;

          case 'session.status_idle':
            if (event.stop_reason?.type !== 'requires_action') done = true;
            break;

          case 'session.status_terminated':
            done = true;
            break;

          case 'session.error':
            result.error = JSON.stringify(event);
            done = true;
            break;
        }
        if (done || (toolCalls.length > 0 && event.type === 'session.status_idle')) break;
      }

      if (done) break;

      if (toolCalls.length === 0) break;

      const toolResults = [];
      for (const call of toolCalls) {
        const output = await dispatchTool(admin, call.name, call.input);
        toolResults.push({
          type: 'user.custom_tool_result' as const,
          custom_tool_use_id: call.id,
          content: [{ type: 'text' as const, text: output }],
        });
      }
      await beta.sessions.events.send(session.id, { events: toolResults });
    }

    return result;
  } catch (err: any) {
    result.error = err?.message ?? String(err);
    return result;
  }
}

async function dispatchTool(
  admin: ReturnType<typeof createAdminClient>,
  name: string,
  input: any,
): Promise<string> {
  try {
    switch (name) {
      case 'get_recent_issues':
        return JSON.stringify(await getRecentIssues(admin, input.user_id));
      case 'get_dismissals':
        return JSON.stringify(await getDismissals(admin, input.user_id));
      case 'get_match_outcomes':
        return JSON.stringify(await getMatchOutcomes(admin, input.user_id));
      case 'get_health_trends':
        return JSON.stringify(await getHealthTrends(admin, input.user_id));
      case 'get_network_benchmarks':
        return JSON.stringify(await getNetworkBenchmarks(admin, input.user_id));
      case 'publish_insight':
        return JSON.stringify(await publishInsight(admin, input));
      case 'mark_curator_run':
        await markCuratorRun(admin, input.user_id);
        return JSON.stringify({ ok: true });
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err: any) {
    return JSON.stringify({ error: err?.message ?? 'tool failed' });
  }
}
