import type { RuleEdge } from '@linkrescue/types';

/**
 * Returns true if adding newRule would create a cycle or infinite redirect chain.
 * Walks forward from newRule.from_url through existing + new rules.
 */
export function detectChain(existingRules: RuleEdge[], newRule: RuleEdge): boolean {
  const adjacency = new Map<string, string>();

  for (const rule of existingRules) {
    adjacency.set(rule.from_url, rule.to_url);
  }
  adjacency.set(newRule.from_url, newRule.to_url);

  const visited = new Set<string>();
  let current = newRule.from_url;

  while (adjacency.has(current)) {
    if (visited.has(current)) return true;
    visited.add(current);
    current = adjacency.get(current)!;
  }

  return false;
}
