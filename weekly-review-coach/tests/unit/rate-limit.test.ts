import { describe, expect, it } from 'vitest';
import { RATE_LIMIT, rateLimit } from '../../lib/rate-limit';

describe('rateLimit', () => {
  it('lets RATE_LIMIT requests through, blocks the next, and resets after the window', () => {
    const t = 1_000_000;
    for (let i = 0; i < RATE_LIMIT; i++) expect(rateLimit('ip-a', t)).toBe(0);
    expect(rateLimit('ip-a', t)).toBeGreaterThan(0);
    expect(rateLimit('ip-b', t)).toBe(0);
    expect(rateLimit('ip-a', t + 10 * 60 * 1000)).toBe(0);
  });
});
