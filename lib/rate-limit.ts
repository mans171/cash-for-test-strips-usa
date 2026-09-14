/** Per-IP rate limit for the public lead forms (/api/leads, /api/bulk-leads).
 *
 *  In-memory, fixed-window, no dependencies. On Vercel every function
 *  instance holds its own map, so this is PER-INSTANCE and BEST-EFFORT: a
 *  burst spread across instances gets through, and a cold start forgets the
 *  count. The honeypot (lib/honeypot.ts) remains the first line of defense —
 *  it runs before this in both routes, and a tripped honeypot consumes no
 *  slot. If real abuse shows up, the durable answer is a platform rule
 *  (Vercel Firewall rate limiting on these two paths), not a bigger map.
 *
 *  Defaults: 5 submissions per 10 minutes per IP. */

export const RATE_LIMIT_MAX = 5
export const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
export const RATE_LIMIT_MESSAGE = 'Too many requests. Please wait a few minutes and try again.'

type Entry = { count: number; resetAt: number }
export type RateLimitStore = Map<string, Entry>
export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number }

const defaultStore: RateLimitStore = new Map()

/** First hop of x-forwarded-for (the client, as Vercel sets it), else
 *  x-real-ip, else "unknown" — so a headerless request still shares one
 *  bucket rather than escaping the limit. */
export function clientIp(headers: Headers): string {
  const first = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (first) return first
  return headers.get('x-real-ip')?.trim() || 'unknown'
}

/** Drop every window that has already ended, so one-off visitors cannot
 *  grow the map without bound. Called on every check: the map holds at most
 *  the distinct IPs that posted a form in the last ten minutes. */
export function pruneRateLimitStore(store: RateLimitStore, now: number): void {
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key)
  }
}

/** Count one attempt for `key`. Pure given `store` and `now`, which the
 *  routes leave at their defaults and the tests inject. */
export function checkRateLimit(
  key: string,
  opts: { store?: RateLimitStore; now?: number; max?: number; windowMs?: number } = {}
): RateLimitResult {
  const { store = defaultStore, now = Date.now(), max = RATE_LIMIT_MAX, windowMs = RATE_LIMIT_WINDOW_MS } = opts
  pruneRateLimitStore(store, now)
  const entry = store.get(key)
  if (!entry) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSeconds: 0 }
  }
  if (entry.count < max) {
    entry.count += 1
    return { allowed: true, retryAfterSeconds: 0 }
  }
  return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) }
}
