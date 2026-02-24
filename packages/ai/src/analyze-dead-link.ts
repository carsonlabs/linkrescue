import Anthropic from '@anthropic-ai/sdk';
import type { DeadLinkAnalysis } from './types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function analyzeDeadLink(url: string, pageContext?: string): Promise<DeadLinkAnalysis> {
  const prompt = `Analyze this dead/broken URL and infer what content it likely contained.

URL: ${url}
${pageContext ? `Page context: ${pageContext}` : ''}

Respond with a JSON object (no markdown, raw JSON only):
{
  "topic": "brief topic category (e.g. 'fitness supplements', 'web hosting')",
  "intent": "what the visitor was likely trying to accomplish",
  "keywords": ["array", "of", "3-7", "relevant", "keywords"]
}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  return JSON.parse(text) as DeadLinkAnalysis;
}
