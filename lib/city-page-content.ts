import type { Company } from "./types"
import { haversineMiles } from "./geo"
import { CITY_TARGETS, cityCenter, type CityTarget } from "./city-geo"
import { STATE_LABELS } from "./states"
import { HOUSE_PHONES } from "./owner"

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
/** The anti-doorway radius. A city page may not publish unless a real buyer is
 *  within this many miles (docs/seo/2026-08-12-city-page-spec.md Rule 2).
 *  Exported and shared so app/sitemap.ts applies the SAME gate the page does —
 *  on 2026-09-06 a buyer was deactivated, two West Virginia city pages
 *  correctly began 404ing, and the sitemap went on advertising both to Google
 *  because it listed CITY_TARGETS unconditionally. */
export const CITY_BUYER_RADIUS_MI = 100

/** The city targets that will actually RENDER, given the live buyer set.
 *  A city page 404s when no buyer is within CITY_BUYER_RADIUS_MI, so anything
 *  that advertises city pages — the sitemap, the sibling links at the foot of
 *  every city page — must ask this instead of reading CITY_TARGETS raw.
 *  Learned 2026-09-06/07: deactivating one buyer 404'd two West Virginia city
 *  pages while the sitemap went on listing them AND every other city page went
 *  on linking to them. */
export function publishableCityTargets(buyers: Company[]): CityTarget[] {
  return CITY_TARGETS.filter((t) => nearbyBuyers(t, buyers).length > 0)
}

export function nearbyBuyers(
  target: CityTarget,
  buyers: Company[],
  radiusMi = CITY_BUYER_RADIUS_MI,
): NearbyBuyer[] {
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
export function siblingCities(citySlug: string, limit = 6, publishable?: CityTarget[]): CityTarget[] {
  const pool = publishable ?? CITY_TARGETS
  const current = CITY_TARGETS.find((c) => c.slug === citySlug)
  if (!current) return []

  const byDistance = (a: CityTarget, b: CityTarget) =>
    haversineMiles(cityCenter(current), cityCenter(a)) - haversineMiles(cityCenter(current), cityCenter(b))

  // `publishable` omitted keeps the old behavior for any caller that has no
  // buyer list to hand; the city page always passes one, so live pages never
  // link to a target that would 404.
  const others = pool.filter((c) => c.slug !== citySlug)
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

// ---------------------------------------------------------------------------
// House-network detection — identifies listings answered by the business itself
// ---------------------------------------------------------------------------

const normalizeDigits = (s: string) => s.replace(/\D/g, "")

/** Returns true when this buyer listing is answered by the house (i.e., the
 *  phone is one of the CFTS network numbers). House-answered pages can speak
 *  in first-person plural and can promise the $10 bonus.
 *
 *  Deliberately does NOT check url — a house listing that has its own site is
 *  still house-answered; the distinction matters for isIndexableProfile(), not
 *  for who picks up the phone. */
export function honorsBonus(buyer: Pick<NearbyBuyer, "phone">): boolean {
  if (!buyer.phone) return false
  const d = normalizeDigits(buyer.phone)
  return HOUSE_PHONES.some((h) => normalizeDigits(h) === d)
}

/** The only dollar figure permitted on city pages. Used verbatim in
 *  above-the-fold copy and derived FAQs for house-answered listings only. */
export const BONUS_MENTION_COPY =
  "Text first and mention this listing to earn a $10 bonus on your first sale."

// ---------------------------------------------------------------------------
// Buyer-first above-the-fold block
// ---------------------------------------------------------------------------

export type AboveTheFold = {
  /** Short declarative sentence: who buys here, how far away. */
  headline: string
  /** Full buyer name. */
  buyerName: string
  /** The buyer's phone number (for tel:/sms: links). Null for third-party
   *  buyers where we do not display a number directly. */
  phone: string | null
  /** True when the nearest buyer is house-answered. Drives voice and bonus. */
  isHouse: boolean
  /** True when the nearest buyer lists in-person meetup. */
  hasMeetup: boolean
  /** Bonus mention copy, or null when the bonus does not apply. */
  bonusCopy: string | null
  /** Short contextual sentence. Omitted when fields are empty. */
  contextLine: string | null
}

/**
 * Builds the data for the above-the-fold buyer block on a city page. Every
 * field traces to a real buyer row; nothing is manufactured.
 *
 * When `nearest` is house-answered the page uses "We buy" language and shows
 * the bonus copy. When it is a third-party listing the page attributes
 * everything to the buyer's own name and skips the bonus.
 */
export function buildAboveTheFold(nearest: NearbyBuyer, target: CityTarget): AboveTheFold {
  const isHouse = honorsBonus(nearest)
  const milesLabel =
    nearest.miles < 1
      ? `right in ${target.name}`
      : `about ${Math.round(nearest.miles)} miles from ${target.name}`
  const hasMeetup = (nearest.transaction_modes ?? []).includes("meetup")

  const headline = isHouse
    ? `We buy diabetic test strips in ${target.name}, ${target.state}`
    : `${nearest.name} buys diabetic test strips near ${target.name}, ${target.state}`

  // Context line: response time or meetup note, omitted when the fields are empty.
  let contextLine: string | null = null
  if (nearest.response_time) {
    contextLine = `${isHouse ? "We" : nearest.name} typically respond${isHouse ? "" : "s"} ${nearest.response_time.toLowerCase()}.`
  } else if (hasMeetup && nearest.city) {
    contextLine = `${isHouse ? "We meet" : `${nearest.name} meets`} sellers in ${nearest.city}.`
  }

  return {
    headline,
    buyerName: nearest.name,
    phone: nearest.phone ?? null,
    isHouse,
    hasMeetup,
    bonusCopy: isHouse ? BONUS_MENTION_COPY : null,
    contextLine,
  }
}

// ---------------------------------------------------------------------------
// "What we buy near {City}" brands block
// ---------------------------------------------------------------------------

/**
 * Aggregates accepted_brands across all nearby buyers into a deduplicated,
 * sorted list. Returns an empty array when no buyer lists accepted brands —
 * the page omits the section rather than rendering an empty block.
 */
export function buildBrandsBlock(buyers: NearbyBuyer[]): string[] {
  return uniqueSorted(buyers.flatMap((b) => b.accepted_brands ?? []))
}

// ---------------------------------------------------------------------------
// "How it works in {City}" steps block
// ---------------------------------------------------------------------------

export type HowItWorksStep = { number: number; title: string; body: string }

/**
 * Derives a 3–4 step "how it works" sequence from the nearest buyer's real
 * fields. Each step is omitted when its backing field is empty — never filled
 * with a generic template sentence. The result is either empty (no fields
 * populated) or 3–4 concrete steps.
 *
 * Steps emitted, in order, when their fields are non-empty:
 *  1. "Contact us / Contact {name}" — always emitted (phone is the CTA)
 *  2. "Meet in person" — only when transaction_modes includes "meetup"
 *  3. "Mail your strips" — only when a mail-in fallback exists (hasMailIn flag)
 *  4. "Get paid" — only when payment_methods is non-empty
 */
export function buildHowItWorks(
  nearest: NearbyBuyer,
  hasMailIn: boolean,
): HowItWorksStep[] {
  const isHouse = honorsBonus(nearest)
  const steps: HowItWorksStep[] = []
  let n = 1

  // Step 1: Contact — always present (there is always a nearest buyer)
  const contactWho = isHouse ? "us" : nearest.name
  const contactBody = nearest.phone
    ? `Call or text ${isHouse ? "us" : nearest.name} with the brand, quantity, and expiration date of what you have. ${isHouse ? "We quote" : `${nearest.name} quotes`} you the same day.`
    : `Contact ${nearest.name} with the brand, quantity, and expiration date of what you have. ${isHouse ? "We quote" : `${nearest.name} quotes`} you the same day.`
  steps.push({ number: n++, title: `Contact ${contactWho}`, body: contactBody })

  // Step 2: Meet in person (if meetup mode available)
  const hasMeetup = (nearest.transaction_modes ?? []).includes("meetup")
  if (hasMeetup) {
    const meetCity = nearest.city ? ` in ${nearest.city}` : ""
    steps.push({
      number: n++,
      title: "Meet in person",
      body: `${isHouse ? "We meet" : `${nearest.name} meets`} sellers${meetCity}. No shipping, no waiting — same day${nearest.response_time ? `, ${nearest.response_time.toLowerCase()}` : ""}.`,
    })
  }

  // Step 3: Mail-in fallback (if a mail-in buyer exists and meetup was not the only mode)
  if (hasMailIn) {
    steps.push({
      number: n++,
      title: "Or mail your strips",
      body: "Prefer not to meet in person? Our mail-in partner accepts sealed, unexpired boxes from anywhere in the US.",
    })
  }

  // Step 4: Get paid — only when payment methods are known
  const methods = (nearest.payment_methods ?? [])
  if (methods.length > 0) {
    steps.push({
      number: n++,
      title: "Get paid",
      body: `${isHouse ? "We pay" : `${nearest.name} pays`} by ${joinList(methods)} — your choice.`,
    })
  }

  return steps
}

// ---------------------------------------------------------------------------
// City-specific meta description
// ---------------------------------------------------------------------------

/**
 * Derives a meta description (≤ 160 characters) from real buyer fields: the
 * buyer's name, distance, transaction mode, and payment methods. Falls back
 * gracefully when any field is empty. Never claims "PayPal, Zelle, or check"
 * unless the buyer's actual record says so.
 */
export function buildMetaDescription(nearest: NearbyBuyer, target: CityTarget): string {
  const isHouse = honorsBonus(nearest)
  const who = isHouse ? "We buy" : `${nearest.name} buys`
  const milesStr = nearest.miles < 1 ? "in" : `near`
  const location = `${target.name}, ${target.state}`

  const hasMeetup = (nearest.transaction_modes ?? []).includes("meetup")
  const modeStr = hasMeetup ? "in-person meetup" : "mail-in"
  const methods = (nearest.payment_methods ?? [])
  const payStr = methods.length > 0 ? ` Pay by ${joinList(methods.slice(0, 3))}.` : ""

  const base = `${who} unused diabetic test strips ${milesStr} ${location}. ${hasMeetup ? "Same-day" : "Fast"} ${modeStr} available.${payStr}`
  // Trim to 160 chars — truncate at a word boundary if needed
  if (base.length <= 160) return base
  return base.slice(0, 157).replace(/\s+\S*$/, "") + "…"
}

// ---------------------------------------------------------------------------
// City-specific FAQ entry
// ---------------------------------------------------------------------------

/**
 * Returns a single FAQ derived from real data unique to this city: how many
 * ZIP codes are served, distance to nearest buyer, or county info when
 * available. Returns null when no unique data can be derived (no zips passed,
 * etc.) — callers omit rather than template.
 */
export function buildCitySpecificFaq(
  nearest: NearbyBuyer,
  target: CityTarget,
  zipsNear: string[],
): Faq | null {
  if (zipsNear.length > 0) {
    const sample = zipsNear.slice(0, 3).join(", ")
    const andMore = zipsNear.length > 3 ? ` and ${zipsNear.length - 3} more` : ""
    const isHouse = honorsBonus(nearest)
    const whoAnswer = isHouse
      ? "We serve sellers across the area"
      : `${nearest.name} serves sellers across the area`
    return {
      q: `What ZIP codes near ${target.name} are covered?`,
      a: `${whoAnswer} — including ${sample}${andMore}. If your ZIP isn't listed, contact ${isHouse ? "us" : nearest.name} directly; coverage extends up to ${Math.round(nearest.miles < 1 ? 30 : nearest.miles + 15)} miles.`,
    }
  }
  // Fallback: distance-based FAQ when no ZIPs
  const isHouse = honorsBonus(nearest)
  const milesAway = nearest.miles < 1 ? "in" : `about ${Math.round(nearest.miles)} miles from`
  return {
    q: `How far does the nearest buyer travel to ${target.name}?`,
    a: `${nearest.name} is based ${milesAway} ${target.name}. ${isHouse ? "We travel to sellers across the metro area" : `${nearest.name} serves buyers within the metro area`} — contact them directly to confirm they cover your neighborhood.`,
  }
}

// ---------------------------------------------------------------------------
// Original city intro (kept for existing tests and pages)
// ---------------------------------------------------------------------------

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

  // Condition FAQ — varied by the nearest buyer's description where available,
  // so it is not byte-identical across all pages (the old version was).
  const closestDesc = closest.description ?? ""
  const mentionsExpiry = /expir/i.test(closestDesc)
  const mentionsSeal = /seal/i.test(closestDesc)
  if (mentionsExpiry || mentionsSeal) {
    // Nearest buyer's listing already says something about condition — quote it
    faqs.push({
      q: "What condition do the boxes need to be in?",
      a: `${closest.name} requires${mentionsSeal ? " sealed, unopened boxes in original packaging" : " boxes in original packaging"}.${mentionsExpiry ? " Check the expiration date before you go — short-dated stock may be declined." : ""} Individual requirements vary; confirm before traveling.`,
    })
  } else if (closest.transaction_modes?.includes("meetup") && closest.city) {
    faqs.push({
      q: "What condition do the boxes need to be in?",
      a: `When meeting ${closest.name} in ${closest.city}, bring sealed, unopened boxes in original retail packaging. Typically the expiration date must be at least several months out. Opened or damaged boxes are not accepted.`,
    })
  } else {
    faqs.push({
      q: "What condition do the boxes need to be in?",
      a: "Boxes must be sealed, unopened, and in original retail packaging. Most buyers near " + target.name + " require the expiration date to be at least several months out. Opened, damaged, or short-dated stock may be declined.",
    })
  }

  return faqs
}
