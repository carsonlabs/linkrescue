import Anthropic from '@anthropic-ai/sdk';
import type { DeadLinkAnalysis, OfferMatchResult, OfferInput } from './types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MAX_OFFERS_PER_CALL = 20;
const MIN_SCORE = 30;

export async function matchOffers(
  analysis: DeadLinkAnalysis,
  offers: OfferInput[],
): Promise<OfferMatchResult[]> {
  if (offers.length === 0) return [];

  const batch = offers.slice(0, MAX_OFFERS_PER_CALL);

  const prompt = `You are matching replacement offers for a dead link.

Dead link analysis:
- Topic: ${analysis.topic}
- Intent: ${analysis.intent}
- Keywords: ${analysis.keywords.join(', ')}

Available offers:
${batch.map((o, i) => `${i + 1}. ID: ${o.id} | Title: ${o.title} | Topic: ${o.topic} | Tags: ${o.tags.join(', ')}`).join('\n')}

Score each offer 0-100 for relevance. Only include offers scoring >= ${MIN_SCORE}.
Respond with raw JSON array (no markdown):
[{"offer_id": "...", "score": 85, "reason": "brief reason"}]
Return empty array [] if no good matches.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '[]';
  const results: OfferMatchResult[] = JSON.parse(text);

  return results
    .filter((r) => r.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score);
}
