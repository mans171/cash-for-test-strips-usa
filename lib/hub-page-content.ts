import type { Company } from "./types"
import { type CityTarget } from "./city-geo"
import { publishableCityTargets } from "./city-page-content"
import { STATE_HEALTH_DATA } from "./state-health-data"
import { STATE_LABELS } from "./states"
import { joinList } from "./state-page-content"

/**
 * Content derivation for `/sell-test-strips` — the hub above the 50 state
 * pages and 27 city pages.
 *
 * Context: as of 2026-08-31, 39 URLs sat in Google's "Discovered — currently
 * not indexed" bucket, every one of them reporting "Referring page: None
 * detected". The state pages were reachable only from a 10-state list on the
 * homepage plus each state's own 8 neighbour links, so most of the set had no
 * inbound path short enough for Google to bother crawling. This hub exists to
 * give all 77 geo pages a single, shallow, crawlable parent.
 *
 * A bare list of 77 links would be a doorway page, and doorway pages land in
 * "Crawled — currently not indexed" — a bucket this site currently has zero
 * pages in and should keep at zero. So every state row carries facts derived
 * from data we already hold (live buyer counts from `companies`, CDC PLACES
 * prevalence from state-health-data.ts, city coverage from city-geo.ts), and
 * the regional summaries are computed from those rows rather than written.
 *
 * Everything here is pure: the page passes in the buyer rows it fetched, and
 * this module does no I/O. That keeps it testable in the node vitest env.
 */

export type RegionName = "Northeast" | "Midwest" | "South" | "West"

/**
 * US Census Bureau's four statistical regions. Grouping by region rather than
 * alphabetically means the page reads as geography instead of an index, and it
 * gives each block a summary that is actually true of that block.
 *
 * DC is absent for the same reason it is absent from CITY_TARGETS: there is no
 * `/sell-test-strips/dc` page for it to link to (see lib/city-geo.ts).
 * A test asserts these 50 codes are exactly the US entries in STATE_LABELS.
 */
export const REGIONS: Record<RegionName, string[]> = {
  Northeast: ["CT", "ME", "MA", "NH", "NJ", "NY", "PA", "RI", "VT"],
  Midwest: ["IL", "IN", "IA", "KS", "MI", "MN", "MO", "NE", "ND", "OH", "SD", "WI"],
  South: [
    "AL", "AR", "DE", "FL", "GA", "KY", "LA", "MD", "MS",
    "NC", "OK", "SC", "TN", "TX", "VA", "WV",
  ],
  West: ["AK", "AZ", "CA", "CO", "HI", "ID", "MT", "NV", "NM", "OR", "UT", "WA", "WY"],
}

export const REGION_ORDER: RegionName[] = ["Northeast", "Midwest", "South", "West"]

export type HubState = {
  code: string
  label: string
  href: string
  /** In-person buyers listed as serving this state. */
  buyerCount: number
  /** Cities in this state that have their own page. */
  cities: CityTarget[]
  /** Diagnosed diabetes among adults, crude prevalence %, CDC PLACES. Null when unmeasured. */
  diabetesPrevalence: number | null
  /** BRFSS survey year behind the prevalence reading. */
  brfssYear: number | null
}

export type HubRegion = {
  name: RegionName
  states: HubState[]
  /** States in this region with at least one in-person buyer listed. */
  statesWithBuyers: number
  /** Distinct in-person buyers serving at least one state in this region. */
  buyerCount: number
  cityCount: number
}

export type HubTotals = {
  stateCount: number
  statesWithBuyers: number
  buyerCount: number
  cityCount: number
}

/** The 50 US state codes this hub links to, region order then within-region order. */
export function hubStateCodes(): string[] {
  return REGION_ORDER.flatMap((r) => REGIONS[r])
}

function buildHubState(code: string, buyers: Company[], publishable: CityTarget[]): HubState {
  const health = STATE_HEALTH_DATA[code]
  return {
    code,
    label: STATE_LABELS[code] ?? code,
    href: `/sell-test-strips/${code.toLowerCase()}`,
    buyerCount: buyers.filter((b) => b.states.includes(code)).length,
    // Gated, not raw: a city page 404s when no buyer is within
    // CITY_BUYER_RADIUS_MI, and the hub linking one anyway is how West
    // Virginia's two city pages stayed linked after their buyer was
    // deactivated. See publishableCityTargets in lib/city-page-content.ts.
    cities: publishable.filter((c) => c.state === code),
    diabetesPrevalence: health?.diabetesPrevalence ?? null,
    brfssYear: health?.brfssYear ?? null,
  }
}

/**
 * Every state, grouped into its Census region, with its live buyer count and
 * city coverage attached. `buyers` is the in-person set the page fetched; the
 * counts are therefore always current rather than a number baked into copy.
 */
export function buildHubRegions(buyers: Company[]): HubRegion[] {
  // Computed once rather than per state — the gate is a radius check over
  // every buyer, so it does not vary by state.
  const publishable = publishableCityTargets(buyers)
  return REGION_ORDER.map((name) => {
    const states = REGIONS[name].map((code) => buildHubState(code, buyers, publishable))
    return {
      name,
      states,
      statesWithBuyers: states.filter((s) => s.buyerCount > 0).length,
      // Counted over distinct buyers: one buyer serving several states in a
      // region must not be counted once per state.
      buyerCount: buyers.filter((b) => b.states.some((s) => REGIONS[name].includes(s))).length,
      cityCount: states.reduce((n, s) => n + s.cities.length, 0),
    }
  })
}

/**
 * National totals. Takes the buyer rows directly rather than summing the region
 * counts, so the buyer figure stays distinct — a buyer listed in both MD and VA
 * is one buyer, not two.
 */
export function buildHubTotals(regions: HubRegion[], buyers: Company[]): HubTotals {
  const states = regions.flatMap((r) => r.states)
  return {
    stateCount: states.length,
    statesWithBuyers: states.filter((s) => s.buyerCount > 0).length,
    buyerCount: buyers.length,
    cityCount: states.reduce((n, s) => n + s.cities.length, 0),
  }
}

/**
 * One derived sentence per region. Says something different about each region
 * because the underlying counts differ; where a region has no in-person buyer
 * at all it says so plainly rather than implying coverage that is not there.
 */
export function regionSummary(region: HubRegion, hasMailIn: boolean): string {
  const { name, states, statesWithBuyers, buyerCount, cityCount } = region
  const total = states.length
  const cityPart = cityCount > 0
    ? ` ${cityCount} ${cityCount === 1 ? "city has" : "cities have"} a dedicated guide.`
    : ""

  if (statesWithBuyers === 0) {
    return (
      `No in-person buyer is listed in the ${name} yet.` +
      (hasMailIn
        ? ` Sellers in all ${total} states here can still mail sealed, unexpired boxes to a national mail-in buyer.`
        : ` Each state page shows the nearest listed buyers and how far away they are.`) +
      cityPart
    )
  }

  const coverage =
    statesWithBuyers === total
      ? `All ${total} ${name} states have at least one in-person buyer listed`
      : `${statesWithBuyers} of ${total} ${name} states have an in-person buyer listed`

  return (
    `${coverage}, ${buyerCount} ${buyerCount === 1 ? "buyer" : "buyers"} in total.` +
    (statesWithBuyers < total
      ? ` The remaining ${total - statesWithBuyers} state${total - statesWithBuyers === 1 ? "" : "s"} ` +
        `show their nearest options${hasMailIn ? " and mail-in cover" : ""} instead.`
      : "") +
    cityPart
  )
}

/**
 * A short factual line under each state name. Prevalence is the one figure we
 * hold for all 50 states, and it varies enough to be worth stating; where the
 * source has no reading the sentence is omitted rather than guessed at.
 */
export function stateFactLine(state: HubState, hasMailIn: boolean): string {
  const parts: string[] = []

  if (state.buyerCount > 0) {
    parts.push(`${state.buyerCount} in-person ${state.buyerCount === 1 ? "buyer" : "buyers"}`)
  } else {
    parts.push(hasMailIn ? "Mail-in and nearby buyers" : "Nearest buyers listed")
  }

  if (state.diabetesPrevalence !== null) {
    // toFixed(1) so a whole-number reading renders "13.0%" alongside its
    // neighbours' "11.2%" rather than a bare "13%".
    parts.push(`${state.diabetesPrevalence.toFixed(1)}% adult diabetes rate`)
  }

  return parts.join(" · ")
}

export type HubFaq = { q: string; a: string }

/**
 * FAQs derived from the same counts the page renders, so the answers stay true
 * as buyers are added. The legality answer is deliberately qualified and
 * carries the not-legal-advice disclaimer, matching the framing on the state
 * pages and the /is-it-legal-to-sell-diabetic-test-strips hub — a bare "it is
 * legal in X" claim is a house rule violation and a test failure.
 */
export function buildHubFaqs({
  totals,
  regions,
  hasMailIn,
}: {
  totals: HubTotals
  regions: HubRegion[]
  hasMailIn: boolean
}): HubFaq[] {
  const faqs: HubFaq[] = []

  const covered = regions
    .filter((r) => r.statesWithBuyers > 0)
    .map((r) => r.name as string)

  faqs.push({
    q: "How do I find a test strip buyer in my state?",
    a:
      `Pick your state above to see who buys there. ${totals.statesWithBuyers} of the ` +
      `${totals.stateCount} states currently have at least one in-person buyer listed` +
      `${covered.length > 0 && covered.length < regions.length ? `, concentrated in the ${joinList(covered)}` : ""}. ` +
      `Each state page lists those buyers, and where a state has none it shows the closest ones ` +
      `and roughly how far away they are.`,
  })

  if (hasMailIn) {
    faqs.push({
      q: "What if no buyer is listed in my state?",
      a:
        `You can still sell. Mail-in buyers accept sealed, unexpired boxes from anywhere in the US, ` +
        `so a local buyer is convenient rather than required. Your state page shows the mail-in option ` +
        `alongside the nearest in-person buyers.`,
    })
  }

  if (totals.cityCount > 0) {
    faqs.push({
      q: "Why do some states have city pages and others do not?",
      a:
        `A city gets its own page only when there is a verified in-person buyer within about 50 miles of it. ` +
        `${totals.cityCount} cities currently qualify. Everywhere else, the state page is the more useful ` +
        `starting point because it covers the whole state rather than one metro.`,
    })
  }

  faqs.push({
    q: "Is it legal to sell diabetic test strips?",
    a:
      `Reselling unused, unexpired, unopened test strips you paid for yourself is generally permitted, ` +
      `and no state law specifically bans it. Strips paid for by a government programme cannot be resold, ` +
      `and boxes must be sealed and in original packaging. This is general information, not legal advice — ` +
      `consult an attorney about your situation.`,
  })

  faqs.push({
    q: "What condition do the boxes need to be in?",
    a:
      `Boxes must be sealed, unopened, in original retail packaging, and typically at least six months from ` +
      `the expiration date. Damaged, opened, or short-dated boxes are worth less or may be declined.`,
  })

  return faqs
}
