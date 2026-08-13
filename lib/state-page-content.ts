import type { Company } from "./types"
import { haversineMiles } from "./geo"
import { STATE_CENTROIDS, STATE_NEIGHBORS } from "./state-geo"
import { STATE_LABELS } from "./states"

/**
 * Content derivation for `/sell-test-strips/[state]`.
 *
 * Context: as of 2026-08-13 Google had collapsed the 50 state pages as near
 * duplicates — only ~5 of 137 submitted URLs were indexed. The template was
 * structurally identical across every state (three of four FAQs byte-identical,
 * the same 12 hardcoded sibling links on all 50 pages), and 31 states have no
 * local buyer at all, so those pages differed from each other only by the state
 * name. Everything here derives page text from real per-state data so the pages
 * differ in substance rather than in a swapped noun.
 */

export type NearbyBuyer = Company & { miles: number }

/** Buyers outside the state, ordered by distance from the state's centroid. */
export function nearestBuyers(stateCode: string, buyers: Company[], limit = 3): NearbyBuyer[] {
  const origin = STATE_CENTROIDS[stateCode]
  if (!origin) return []

  return buyers
    .filter((b) => b.lat != null && b.lng != null && !b.states.includes(stateCode))
    .map((b) => ({ ...b, miles: haversineMiles(origin, { lat: b.lat!, lng: b.lng! }) }))
    .sort((a, b) => a.miles - b.miles)
    .slice(0, limit)
}

const LINKABLE_STATES = Object.keys(STATE_CENTROIDS).filter(
  (s) => STATE_LABELS[s] && s !== "DC"
)

function nearestStates(stateCode: string): string[] {
  const origin = STATE_CENTROIDS[stateCode]
  if (!origin) return []
  return LINKABLE_STATES.filter((s) => s !== stateCode)
    .map((s) => ({ s, miles: haversineMiles(origin, STATE_CENTROIDS[s]) }))
    .sort((a, b) => a.miles - b.miles)
    .map((x) => x.s)
}

/**
 * States with no land neighbours (AK, HI) mapped to the mainland state that
 * must link back to them.
 *
 * Without this, they end up orphaned: distance-based padding is not symmetric,
 * and Hawaii is far enough from the mainland that it never appears in any other
 * state's nearest-N list, so nothing would link to it at all. Caught by test.
 */
const ISLAND_ANCHORS: Record<string, string> = Object.fromEntries(
  LINKABLE_STATES.filter((s) => (STATE_NEIGHBORS[s] ?? []).length === 0)
    .map((s) => [s, nearestStates(s)[0]])
    .filter(([, anchor]) => anchor)
    .map(([s, anchor]) => [anchor as string, s as string])
)

/**
 * Sibling links for the footer. Land neighbours first (genuinely relevant to
 * someone near a state line), then nearest states by centroid distance to fill
 * the quota.
 *
 * Replaces a hardcoded list of the same 12 states on all 50 pages, which left
 * 38 states with no internal links pointing at them.
 */
export function siblingStates(stateCode: string, limit = 8): string[] {
  const neighbors = (STATE_NEIGHBORS[stateCode] ?? []).filter((s) => STATE_LABELS[s])
  const anchored = ISLAND_ANCHORS[stateCode]

  const ordered = [
    ...neighbors,
    ...(anchored && !neighbors.includes(anchored) ? [anchored] : []),
    ...nearestStates(stateCode),
  ]

  const seen = new Set([stateCode])
  const result: string[] = []
  for (const s of ordered) {
    if (seen.has(s)) continue
    seen.add(s)
    result.push(s)
    if (result.length === limit) break
  }
  return result
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b))
}

/**
 * Human list: ["a"] -> "a", ["a","b"] -> "a and b", ["a","b","c"] -> "a, b, and c".
 * Pass "or" when the items are alternatives rather than a set.
 */
export function joinList(items: string[], conjunction: "and" | "or" = "and"): string {
  if (items.length === 0) return ""
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`
  return `${items.slice(0, -1).join(", ")}, ${conjunction} ${items[items.length - 1]}`
}

export type Faq = { q: string; a: string }

/**
 * FAQs built from the buyers actually listed in this state. Where a state has
 * no local buyers, the answers describe its real nearest options instead, which
 * differ state to state. Nothing here is templated filler — every answer is
 * derived from a field we hold, or omitted.
 */
export function buildStateFaqs({
  stateCode,
  buyers,
  nearby,
  hasMailIn,
}: {
  stateCode: string
  buyers: Company[]
  nearby: NearbyBuyer[]
  hasMailIn: boolean
}): Faq[] {
  const label = STATE_LABELS[stateCode] ?? stateCode
  const faqs: Faq[] = []

  // Legality. Deliberately qualified and paired with a disclaimer: this answer
  // is wrapped in FAQPage schema, so Google may surface it as a direct answer.
  // The /is-it-legal-to-sell-diabetic-test-strips hub carries the same framing.
  faqs.push({
    q: `Is it legal to sell diabetic test strips in ${label}?`,
    a:
      `Reselling unused, unexpired, unopened test strips you own is generally permitted in ${label}, ` +
      `and no state law specifically bans it. Strips paid for by Medicare or Medicaid cannot be resold, ` +
      `and boxes must be sealed and in original packaging. This is general information, not legal advice — ` +
      `consult an attorney about your situation.`,
  })

  if (buyers.length > 0) {
    const brands = uniqueSorted(buyers.flatMap((b) => b.accepted_brands ?? []))
    if (brands.length > 0) {
      faqs.push({
        q: `Which test strip brands can I sell in ${label}?`,
        a:
          `Between them, the ${buyers.length === 1 ? "buyer" : `${buyers.length} buyers`} listed in ${label} ` +
          `accept ${joinList(brands)}. Individual buyers accept different subsets, so check a buyer's listing ` +
          `before you go.`,
      })
    }

    const methods = uniqueSorted(buyers.flatMap((b) => b.payment_methods ?? []))
    if (methods.length > 0) {
      faqs.push({
        q: `How do buyers in ${label} pay?`,
        a: `Buyers listed in ${label} pay by ${joinList(methods)}. The payment methods each one offers are shown on its listing.`,
      })
    }

    const cities = uniqueSorted(buyers.map((b) => b.city ?? ""))
    if (cities.length > 0) {
      faqs.push({
        q: `Where in ${label} can I sell test strips?`,
        a:
          `${label} buyers on this directory are based in ${joinList(cities)}. ` +
          `Many will travel or arrange a meetup point, so it is worth contacting a buyer even if you are not in one of those cities.`,
      })
    }

    const meetsInPerson = buyers.some((b) => (b.transaction_modes ?? []).includes("meetup"))
    if (meetsInPerson) {
      faqs.push({
        q: `Can I sell in person in ${label}, or do I have to ship?`,
        a: `Yes — at least one ${label} buyer meets sellers in person, so you can be paid on the spot rather than mailing your strips and waiting.`,
      })
    }
  } else {
    // No local buyer. The real nearest options differ per state, so these
    // answers are specific rather than a shared "no buyers yet" boilerplate.
    if (nearby.length > 0) {
      const closest = nearby[0]
      faqs.push({
        q: `Are there any test strip buyers in ${label}?`,
        a:
          `Not yet — no buyer on this directory is based in ${label}. The closest is ${closest.name}` +
          `${closest.city ? ` in ${closest.city}` : ""}, roughly ${Math.round(closest.miles)} miles from the centre of the state` +
          `${hasMailIn ? ", and you can also mail your strips in from anywhere in the US" : ""}.`,
      })
      faqs.push({
        q: `Where is the nearest place to sell test strips to ${label}?`,
        a: `The nearest listed buyers are ${joinList(
          nearby.map((b) => `${b.name}${b.city ? ` in ${b.city}` : ""} (about ${Math.round(b.miles)} miles)`)
        )}.`,
      })
    }

    if (hasMailIn) {
      faqs.push({
        q: `Can I sell test strips from ${label} by mail?`,
        a: `Yes. Mail-in buyers accept sealed, unexpired boxes from anywhere in the US, including ${label}, so you do not need a buyer in your state to sell.`,
      })
    }
  }

  faqs.push({
    q: "What condition do the boxes need to be in?",
    a: "Boxes must be sealed, unopened, in original retail packaging, and typically at least six months from the expiration date. Damaged, opened, or short-dated boxes are worth less or may be declined.",
  })

  return faqs
}
