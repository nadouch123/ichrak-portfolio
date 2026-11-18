// Per-IP fixed-window limiter. In-memory, so it is per warm function instance:
// enough to stop a stranger looping the endpoint, not a global quota (see README "Decisions").
const WINDOW_MS = 10 * 60 * 1000;
export const RATE_LIMIT = Number(process.env.COACH_RATE_LIMIT) || 20;
const hits = new Map<string, { count: number; reset: number }>();

export function clientIp(req: Request): string {
  return (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
}

/** Returns seconds to wait when over the limit, or 0 when the request may go ahead. */
export function rateLimit(key: string, now = Date.now()): number {
  const entry = hits.get(key);
  if (!entry || now >= entry.reset) {
    hits.set(key, { count: 1, reset: now + WINDOW_MS });
    if (hits.size > 5000) for (const [k, v] of hits) if (now >= v.reset) hits.delete(k);
    return 0;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT ? Math.ceil((entry.reset - now) / 1000) : 0;
}
