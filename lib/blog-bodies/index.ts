import type { PostBody } from "./types"
import { AK } from "./ak"
import { AZ } from "./az"
import { CA } from "./ca"
import { CO } from "./co"
import { CT } from "./ct"
import { DE } from "./de"
import { FL } from "./fl"
import { GA } from "./ga"
import { HI } from "./hi"
import { IA } from "./ia"
import { ID } from "./id"
import { IL } from "./il"
import { KS } from "./ks"
import { ME } from "./me"
import { MI } from "./mi"
import { MN } from "./mn"
import { MO } from "./mo"
import { MS } from "./ms"
import { MT } from "./mt"
import { NC } from "./nc"
import { ND } from "./nd"
import { NJ } from "./nj"
import { NY } from "./ny"
import { OH } from "./oh"
import { OK } from "./ok"
import { OR } from "./or"
import { PA } from "./pa"
import { RI } from "./ri"
import { SD } from "./sd"
import { TX } from "./tx"
import { UT } from "./ut"
import { VT } from "./vt"
import { WA } from "./wa"
import { WI } from "./wi"
import { WV } from "./wv"

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
  AK,
  AZ,
  CA,
  CO,
  CT,
  DE,
  FL,
  GA,
  HI,
  IA,
  ID,
  IL,
  KS,
  ME,
  MI,
  MN,
  MO,
  MS,
  MT,
  NC,
  ND,
  NJ,
  NY,
  OH,
  OK,
  OR,
  PA,
  RI,
  SD,
  TX,
  UT,
  VT,
  WA,
  WI,
  WV,
}

export function bodyFor(stateCode: string): PostBody | null {
  return POST_BODIES[stateCode] ?? null
}
