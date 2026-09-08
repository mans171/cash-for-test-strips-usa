/**
 * Non-state blog post registry.
 *
 * How to add a new Wednesday post:
 *  1. Create lib/posts/<your-slug>.ts exporting a RegistryPost object.
 *  2. Import it here and add it to POST_REGISTRY.
 *  3. Done. The post automatically appears in:
 *     - app/blog/[slug]/page.tsx (fall-through when slug is not a state post)
 *     - app/blog/page.tsx (registry section of the blog index)
 *     - app/sitemap.ts
 *
 * Constraints (enforced by tests in lib/__tests__/post-registry.test.ts):
 *  - No dollar figures or explicit prices in title, description, body, or FAQs.
 *  - No unqualified legality claims.
 *  - Slug must not collide with any state post slug.
 *  - datePublished and dateModified must be valid ISO dates.
 */

import type { RegistryPost } from "./types"
export type { RegistryPost, PostFaq } from "./types"

import { recyclingDiabeticSupplies } from "./recycling-diabetic-supplies"
import { oldDexcomSensorsAfterSwitching } from "./old-dexcom-sensors-after-switching"
import { insuranceChangedBrands } from "./insurance-changed-brands"
import { doTestStripsExpire } from "./do-test-strips-expire"
import { deceasedRelativeDiabeticSupplies } from "./deceased-relative-diabetic-supplies"
import { switchedToInsulinPump } from "./switched-to-insulin-pump"
import { leftoverOmnipodPods } from "./leftover-omnipod-pods"

/**
 * All non-state registry posts, newest first.
 *
 * Keep this sorted descending by datePublished so the blog index displays them
 * in the right order without a runtime sort.
 */
export const POST_REGISTRY: RegistryPost[] = [
  leftoverOmnipodPods,
  switchedToInsulinPump,
  deceasedRelativeDiabeticSupplies,
  doTestStripsExpire,
  insuranceChangedBrands,
  oldDexcomSensorsAfterSwitching,
  recyclingDiabeticSupplies,
]

/**
 * Retrieve a registry post by slug. Returns undefined when the slug is not in
 * this registry (the caller can then try other content sources or 404).
 */
export function getRegistryPost(slug: string): RegistryPost | undefined {
  return POST_REGISTRY.find((p) => p.slug === slug)
}
