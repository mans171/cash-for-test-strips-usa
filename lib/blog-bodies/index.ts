import type { PostBody } from "./types"
import { AK } from "./ak"
import { AL } from "./al"
import { AR } from "./ar"
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
import { IN } from "./in"
import { KS } from "./ks"
import { KY } from "./ky"
import { LA } from "./la"
import { MA } from "./ma"
import { MD } from "./md"
import { ME } from "./me"
import { MI } from "./mi"
import { MN } from "./mn"
import { MO } from "./mo"
import { MS } from "./ms"
import { MT } from "./mt"
import { NC } from "./nc"
import { ND } from "./nd"
import { NE } from "./ne"
import { NH } from "./nh"
import { NJ } from "./nj"
import { NM } from "./nm"
import { NV } from "./nv"
import { NY } from "./ny"
import { OH } from "./oh"
import { OK } from "./ok"
import { OR } from "./or"
import { PA } from "./pa"
import { RI } from "./ri"
import { SC } from "./sc"
import { SD } from "./sd"
import { TN } from "./tn"
import { TX } from "./tx"
import { UT } from "./ut"
import { VA } from "./va"
import { VT } from "./vt"
import { WA } from "./wa"
import { WI } from "./wi"
import { WV } from "./wv"
import { WY } from "./wy"

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
  AL,
  AR,
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
  IN,
  KS,
  KY,
  LA,
  MA,
  MD,
  ME,
  MI,
  MN,
  MO,
  MS,
  MT,
  NC,
  ND,
  NE,
  NH,
  NJ,
  NM,
  NV,
  NY,
  OH,
  OK,
  OR,
  PA,
  RI,
  SC,
  SD,
  TN,
  TX,
  UT,
  VA,
  VT,
  WA,
  WI,
  WV,
  WY,
}

export function bodyFor(stateCode: string): PostBody | null {
  return POST_BODIES[stateCode] ?? null
}
