import type { PostBody } from "./types"
import { CA } from "./ca"
import { FL } from "./fl"
import { MT } from "./mt"
import { NY } from "./ny"
import { TX } from "./tx"

export type { PostBody, BodySection } from "./types"

/**
 * Hand-written bodies, keyed by state code.
 *
 * States listed here render their written body. Everything else falls back to
 * the derived content in `blog-post-content.ts`, so the site stays whole while
 * these are worked through one at a time.
 *
 * House rules for anything added here, both enforced by tests in
 * `lib/__tests__/blog-bodies.test.ts`:
 *
 *   1. No dollar figures, ever. This site quotes payout tiers, not prices.
 *   2. No unqualified legality claims. The legality hub page carries the
 *      qualified explanation and the not-legal-advice notice; a post must not
 *      assert that selling "is legal" anywhere, full stop.
 */
export const POST_BODIES: Record<string, PostBody> = {
  CA,
  FL,
  MT,
  NY,
  TX,
}

export function bodyFor(stateCode: string): PostBody | null {
  return POST_BODIES[stateCode] ?? null
}
