import Anthropic from '@anthropic-ai/sdk';
import type { DeadLinkAnalysis, OfferMatchResult, OfferInput, UserPreferences } from './types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MAX_OFFERS_PER_CALL = 20;
const MIN_SCORE = 30;

function formatPreferences(prefs: UserPreferences): string {
  const parts: string[] = ['## User preference memory'];

  if (prefs.appliedOffers.length > 0) {
    parts.push(
      '### Previously accepted (positive signal — prefer similar)',
      ...prefs.appliedOffers
        .slice(0, 10)
        .map((o) => `- ${o.title} [topic: ${o.topic || 'n/a'}; tags: ${o.tags.join(', ') || 'n/a'}]`),
    );
  }

  if (prefs.rejectedOffers.length > 0) {
    parts.push(
      '',
      '### Previously rejected (negative signal — avoid similar)',
      ...prefs.rejectedOffers
        .slice(0, 10)
        .map((o) => `- ${o.title} [topic: ${o.topic || 'n/a'}; tags: ${o.tags.join(', ') || 'n/a'}]`),
    );
  }

  if (prefs.toleratedHosts.length > 0) {
    parts.push(
      '',
      '### Hosts the user actively tolerates (alerts suppressed — they still use these)',
      `- ${prefs.toleratedHosts.slice(0, 20).join(', ')}`,
    );
  }

  if (prefs.reasonNotes.length > 0) {
    parts.push(
      '',
      '### User-supplied reasons when suppressing alerts',
      ...prefs.reasonNotes.slice(0, 8).map((n) => `- ${n}`),
    );
  }

  if (parts.length === 1) {
    parts.push('(no prior history — use topic/keyword signals only)');
  }

  return parts.join('\n');
}

export async function matchOffers(
  analysis: DeadLinkAnalysis,
  offers: OfferInput[],
  preferences?: UserPreferences,
): Promise<OfferMatchResult[]> {
  if (offers.length === 0) return [];

  const batch = offers.slice(0, MAX_OFFERS_PER_CALL);

  // Cache-friendly shape: long static context (offers + user prefs) as a
  // cached system block; the per-link analysis is the only thing that varies
  // call-to-call, so the same user's batch scan reuses the cache.
  const systemBlocks: Anthropic.TextBlockParam[] = [
    {
      type: 'text',
      text: `You are matching replacement affiliate offers for a dead link. Score each offer 0-100 for relevance to the dead link's topic/intent/keywords, then bias the score using the user's preference memory below. Only include offers scoring >= ${MIN_SCORE}.

Available offers:
${batch.map((o, i) => `${i + 1}. ID: ${o.id} | Title: ${o.title} | Topic: ${o.topic} | Tags: ${o.tags.join(', ')}`).join('\n')}

${preferences ? formatPreferences(preferences) : '## User preference memory\n(no preferences provided)'}

Respond with raw JSON array (no markdown, no prose):
[{"offer_id": "...", "score": 85, "reason": "brief reason, cite preference signal when relevant"}]
Return empty array [] if no good matches.`,
      cache_control: { type: 'ephemeral' },
    },
  ];

  const userPrompt = `Dead link analysis:
- Topic: ${analysis.topic}
- Intent: ${analysis.intent}
- Keywords: ${analysis.keywords.join(', ')}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: systemBlocks,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '[]';
  let results: OfferMatchResult[];
  try {
    results = JSON.parse(text);
  } catch {
    return [];
  }

  return results
    .filter((r) => r.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score);
}
