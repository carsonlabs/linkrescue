import { detectChain } from './chain-detection';

describe('detectChain', () => {
  it('returns false when no chain exists', () => {
    const existing = [{ from_url: '/a', to_url: '/b' }];
    expect(detectChain(existing, { from_url: '/c', to_url: '/d' })).toBe(false);
  });

  it('detects a direct cycle (A → B, B → A)', () => {
    const existing = [{ from_url: '/a', to_url: '/b' }];
    // Adding B → A would create A → B → A
    expect(detectChain(existing, { from_url: '/b', to_url: '/a' })).toBe(true);
  });

  it('detects a multi-hop cycle', () => {
    const existing = [
      { from_url: '/a', to_url: '/b' },
      { from_url: '/b', to_url: '/c' },
    ];
    // Adding C → A would create A → B → C → A
    expect(detectChain(existing, { from_url: '/c', to_url: '/a' })).toBe(true);
  });

  it('does not flag a valid chain without cycle', () => {
    const existing = [
      { from_url: '/a', to_url: '/b' },
      { from_url: '/b', to_url: '/c' },
    ];
    // Adding D → E is unrelated
    expect(detectChain(existing, { from_url: '/d', to_url: '/e' })).toBe(false);
  });

  it('handles self-loop (A → A)', () => {
    expect(detectChain([], { from_url: '/a', to_url: '/a' })).toBe(true);
  });
});
