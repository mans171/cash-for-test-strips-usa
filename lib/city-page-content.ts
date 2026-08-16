import type { Company } from "./types"
import { haversineMiles } from "./geo"
import { CITY_TARGETS, cityCenter, type CityTarget } from "./city-geo"
import { STATE_LABELS } from "./states"

/**
 * Content derivation for `/sell-test-strips/[state]/[city]` (Wave 1 city
 * pages). Mirrors lib/state-page-content.ts's discipline exactly: every
 * sentence traces to a real field on a real buyer, and a block is omitted
 * rather than templated when the data behind it doesn't exist. The state-page
 * near-duplicate collapse (~5 of 137 pages indexed) was caused by treating a
 * state-name substitution as if it were unique content — city pages must not
 * repeat that mistake at a smaller radius.
 */

export type NearbyBuyer = Company & { miles: number }

/** Buyers with coordinates, ordered by distance from the city center. */
export function nearbyBuyers(target: CityTarget, buyers: Company[], radiusMi = 100): NearbyBuyer[] {
  const origin = cityCenter(target)
  return buyers
    .filter((b) => b.lat != null && b.lng != null)
    .map((b) => ({ ...b, miles: haversineMiles(origin, { lat: b.lat!, lng: b.lng! }) }))
    .filter((b) => b.miles <= radiusMi)
    .sort((a, b) => a.miles - b.miles)
}

/**
 * Sibling city links: other Wave 1 cities in the same state first (genuinely
 * relevant to someone comparing in-state options), then the nearest
 * out-of-state cities by center-to-center distance to fill the quota.
 */
export function siblingCities(citySlug: string, limit = 6): CityTarget[] {
  const current = CITY_TARGETS.find((c) => c.slug === citySlug)
  if (!current) return []

  const byDistance = (a: CityTarget, b: CityTarget) =>
    haversineMiles(cityCenter(current), cityCenter(a)) - haversineMiles(cityCenter(current), cityCenter(b))

  const others = CITY_TARGETS.filter((c) => c.slug !== citySlug)
  const sameState = others.filter((c) => c.state === current.state).sort(byDistance)
  const rest = others.filter((c) => c.state !== current.state).sort(byDistance)

  return [...sameState, ...rest].slice(0, limit)
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b))
}

function joinList(items: string[], conjunction: "and" | "or" = "and"): string {
  if (items.length === 0) return ""
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`
  return `${items.slice(0, -1).join(", ")}, ${conjunction} ${items[items.length - 1]}`
}

/**
 * A 2-3 sentence intro naming the city, real buyer count, and the nearest
 * buyer's real distance. There is no zero-buyer path here (unlike state
 * pages) — the anti-doorway gate in generateStaticParams only builds a city
 * page for a metro with a verified buyer within 50mi, so `buyers` is never
 * empty for a published page.
 */
export function cityIntro(target: CityTarget, buyers: NearbyBuyer[]): string {
  const label = `${target.name}, ${target.state}`
  const stateLabel = STATE_LABELS[target.state] ?? target.state
  const closest = buyers[0]
  const closestLine =
    closest.miles < 1
      ? `${closest.name} is based right in ${target.name}`
      : `the closest, ${closest.name}, is about ${Math.round(closest.miles)} miles from downtown ${target.name}`

  return (
    `${buyers.length} verified ${buyers.length === 1 ? "buyer pays" : "buyers pay"} cash for unused diabetic ` +
    `test strips near ${label} — ${closestLine}. Compare buyers below, then contact one directly; most pay the ` +
    `same day you meet. See the full ${stateLabel} list for buyers further from ${target.name}.`
  )
}

export type Faq = { q: string; a: string }

/**
 * FAQs built from the buyers actually serving this city. Same conditional
 * structure as buildStateFaqs: nothing is pushed unless the field behind it
 * is real, and the "where do buyers meet" FAQ is always city-specific — it
 * names the nearest buyer's own city and transaction mode, not a generic
 * "in [city]" substitution.
 */
export function buildCityFaqs({
  target,
  buyers,
  hasMailIn,
}: {
  target: CityTarget
  buyers: NearbyBuyer[]
  hasMailIn: boolean
}): Faq[] {
  const faqs: Faq[] = []
  const closest = buyers[0]

  faqs.push({
    q: `Where do buyers near ${target.name} pay in person?`,
    a: (closest.transaction_modes ?? []).includes("meetup")
      ? `${closest.name}${closest.city ? `, based in ${closest.city}` : ""}, meets sellers in person and is the ` +
        `closest listed buyer to ${target.name} at about ${Math.round(closest.miles)} miles away. Contact them directly to ` +
        `arrange a meetup point and time.`
      : `The closest listed buyer to ${target.name}, ${closest.name}, doesn't currently list in-person meetups — check ` +
        `their profile for how they handle a sale, or mail your strips in if you'd rather not wait.`,
  })

  const brands = uniqueSorted(buyers.flatMap((b) => b.accepted_brands ?? []))
  if (brands.length > 0) {
    faqs.push({
      q: `Which test strip brands do buyers near ${target.name} accept?`,
      a:
        `Between them, the ${buyers.length === 1 ? "buyer" : `${buyers.length} buyers`} serving ${target.name} ` +
        `accept ${joinList(brands)}. Individual buyers accept different subsets, so check a buyer's listing before you go.`,
    })
  }

  const methods = uniqueSorted(buyers.flatMap((b) => b.payment_methods ?? []))
  if (methods.length > 0) {
    faqs.push({
      q: `How do buyers near ${target.name} pay?`,
      a: `Buyers serving ${target.name} pay by ${joinList(methods)}. The payment methods each one offers are shown on its listing.`,
    })
  }

  if (hasMailIn) {
    faqs.push({
      q: `Can I sell test strips from ${target.name} by mail instead?`,
      a: `Yes. Mail-in buyers accept sealed, unexpired boxes from anywhere in the US, including ${target.name}, if you'd rather not meet in person or drive.`,
    })
  }

  faqs.push({
    q: "What condition do the boxes need to be in?",
    a: "Boxes must be sealed, unopened, in original retail packaging, and typically at least six months from the expiration date. Damaged, opened, or short-dated boxes are worth less or may be declined.",
  })

  return faqs
}
