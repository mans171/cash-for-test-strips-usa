import { STATE_HEALTH_DATA, ALL_STATE_HEALTH, type StateHealthData, type StateCity } from "./state-health-data"
import { STATE_ANGLES, type PostAngle } from "./blog-angles"
import { joinList, type Faq } from "./state-page-content"

/**
 * Content derivation for the state blog posts at `/blog/[slug]`.
 *
 * Context: measured against the live site, each of the 50 state posts carried
 * ~6,080 characters of visible text, of which about 395 were unique — one
 * `intro` field. Alabama and Texas shared 5,509 characters verbatim; pairwise
 * similarity across sampled pairs averaged 95.5%. At roughly a third of the
 * site's URLs that is a domain-level drag, not 50 pages that merely fail to
 * rank. It is the same defect the state landing pages had, and it gets the
 * same fix: derive the body from real per-state data instead of substituting
 * a noun into a shared template.
 *
 * Two rules carried over from that fix, both load-bearing:
 *
 *  1. A sentence that depends on a missing figure is omitted, never rendered
 *     with a placeholder or a plausible-sounding guess. Callers should treat
 *     a null return as "skip this section".
 *  2. No claim is made here that the underlying data does not support. Every
 *     figure traces to `state-health-data.ts`, which is generated from named
 *     public datasets and carries its own vintage per state.
 */

export type { PostAngle }

export function angleFor(stateCode: string): PostAngle {
  return STATE_ANGLES[stateCode] ?? "worth"
}

export function healthFor(stateCode: string): StateHealthData | null {
  return STATE_HEALTH_DATA[stateCode] ?? null
}

/** Population-weighted national prevalence, derived from the same state records. */
export function nationalPrevalence(): number {
  let num = 0
  let den = 0
  for (const s of ALL_STATE_HEALTH) {
    if (s.diabetesPrevalence == null || !s.adultsMeasured) continue
    num += s.diabetesPrevalence * s.adultsMeasured
    den += s.adultsMeasured
  }
  return den ? Math.round((num / den) * 10) / 10 : 0
}

/** 1 = highest diabetes prevalence in the country. Null when unmeasured. */
export function prevalenceRank(stateCode: string): number | null {
  const me = STATE_HEALTH_DATA[stateCode]
  if (!me || me.diabetesPrevalence == null) return null
  const ranked = ALL_STATE_HEALTH
    .filter((s) => s.diabetesPrevalence != null)
    .sort((a, b) => b.diabetesPrevalence! - a.diabetesPrevalence!)
  const i = ranked.findIndex((s) => s.code === stateCode)
  return i < 0 ? null : i + 1
}

/** 1 = largest 65+ share in the country. Null when unmeasured. */
export function seniorRank(stateCode: string): number | null {
  const me = STATE_HEALTH_DATA[stateCode]
  if (!me || me.seniorSharePct == null) return null
  const ranked = ALL_STATE_HEALTH
    .filter((s) => s.seniorSharePct != null)
    .sort((a, b) => b.seniorSharePct! - a.seniorSharePct!)
  const i = ranked.findIndex((s) => s.code === stateCode)
  return i < 0 ? null : i + 1
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

/** "the largest" reads better than "the 1st largest". */
function rankPhrase(n: number): string {
  return n === 1 ? "the largest" : `the ${ordinal(n)} largest`
}

/**
 * Index into a set of phrasings, spread across the states that share an angle.
 *
 * A plain hash of the state code was tried first and was not good enough:
 * Maine and Vermont both carry the estate angle and collided on the same
 * bucket, leaving them 92% identical. Deriving the bucket from a state's
 * position *within its own angle group* guarantees that neighbouring buckets
 * differ exactly where the duplication actually occurs. Deterministic, since
 * the angle map is frozen and the sort is by code.
 */
function variantIndex(stateCode: string, buckets: number): number {
  const angle = angleFor(stateCode)
  const peers = Object.keys(STATE_ANGLES)
    .filter((c) => STATE_ANGLES[c] === angle)
    .sort()
  const pos = peers.indexOf(stateCode)
  return (pos < 0 ? 0 : pos) % buckets
}

/** The state's largest cities that have their own prevalence reading. */
export function topCities(stateCode: string, limit = 4): StateCity[] {
  return (STATE_HEALTH_DATA[stateCode]?.cities ?? []).slice(0, limit)
}

/**
 * The widest real gap between two of the state's cities. This is the single
 * most state-specific fact available: Charleston WV reads 15.6% against
 * Morgantown's 8.0%, and no other state has that pair.
 */
export function citySpread(
  stateCode: string
): { high: StateCity; low: StateCity; gap: number } | null {
  const cities = STATE_HEALTH_DATA[stateCode]?.cities ?? []
  if (cities.length < 2) return null
  const sorted = [...cities].sort((a, b) => b.diabetes - a.diabetes)
  const high = sorted[0]
  const low = sorted[sorted.length - 1]
  const gap = Math.round((high.diabetes - low.diabetes) * 10) / 10
  if (gap < 1) return null
  return { high, low, gap }
}

// ---------------------------------------------------------------------------
// Titles and metadata
// ---------------------------------------------------------------------------

const CURRENT_GUIDE_YEAR = 2026

export function postTitle(stateCode: string, stateName: string): string {
  const angle = angleFor(stateCode)
  const cities = topCities(stateCode, 2)
  const c1 = cities[0]?.name
  const c2 = cities[1]?.name

  switch (angle) {
    case "local-buyers":
      return c1
        ? `Where to Sell Diabetic Test Strips in ${stateName} — Local Buyers in ${c1} & Statewide`
        : `Where to Sell Diabetic Test Strips in ${stateName} — Local Buyers Near You`
    case "safe-mail-in":
      return `How to Sell Diabetic Test Strips in ${stateName} Safely — Mail-In, Paid in 24 Hours`
    case "estate":
      return `Unused Diabetic Supplies After a Loss in ${stateName} — What They're Worth`
    case "dexcom":
      return `Sell Dexcom G6 & G7 Sensors in ${stateName} for Cash — Expired G7 Accepted`
    case "libre":
      return c1 && c2
        ? `Sell FreeStyle Libre 2 & 3 Sensors in ${stateName} — ${c1} to ${c2}`
        : `Sell FreeStyle Libre 2 & 3 Sensors in ${stateName} for Cash`
    case "omnipod":
      return `Sell Omnipod 5 & DASH Pods in ${stateName} — Expired Pods Accepted`
    case "meter-brands":
      return `Sell Contour Next, Accu-Chek & OneTouch Strips in ${stateName} for Cash`
    case "expired":
      return `Do Expired Diabetic Supplies Have Value in ${stateName}? What We Still Buy`
    case "bulk":
      return `Selling Diabetic Supplies in Bulk in ${stateName} — 10 to 500+ Boxes`
    case "worth":
      return `How Much Are Diabetic Test Strips Worth in ${stateName}? ${CURRENT_GUIDE_YEAR} Payout Tiers`
  }
}

/** The on-page H1. Shorter than the title tag, same angle. */
export function postHeading(stateCode: string, stateName: string): string {
  const angle = angleFor(stateCode)
  switch (angle) {
    case "local-buyers":
      return `Where to Sell Diabetic Test Strips in ${stateName}`
    case "safe-mail-in":
      return `How to Sell Diabetic Test Strips Safely in ${stateName}`
    case "estate":
      return `Unused Diabetic Supplies After a Loss in ${stateName}`
    case "dexcom":
      return `Sell Dexcom G6 and G7 Sensors in ${stateName}`
    case "libre":
      return `Sell FreeStyle Libre Sensors in ${stateName}`
    case "omnipod":
      return `Sell Omnipod 5 and DASH Pods in ${stateName}`
    case "meter-brands":
      return `Sell Contour Next, Accu-Chek and OneTouch Strips in ${stateName}`
    case "expired":
      return `Do Expired Diabetic Supplies Have Value in ${stateName}?`
    case "bulk":
      return `Selling Diabetic Supplies in Bulk in ${stateName}`
    case "worth":
      return `How Much Are Diabetic Test Strips Worth in ${stateName}?`
  }
}

export function postMetaDescription(stateCode: string, stateName: string): string {
  const angle = angleFor(stateCode)
  const h = healthFor(stateCode)
  const rate = h?.diabetesPrevalence
  const c1 = topCities(stateCode, 1)[0]?.name

  // A real figure in the description, where one exists, gives each of the 51
  // descriptions a different number rather than a different noun.
  const stat = rate != null ? `${rate}% of ${stateName} adults have diagnosed diabetes. ` : ""

  switch (angle) {
    case "local-buyers":
      return `${stat}Find local buyers${c1 ? ` in ${c1}` : ""} and across ${stateName}. Sealed, unexpired boxes — paid by cash, PayPal, Zelle or Venmo.`
    case "safe-mail-in":
      return `${stat}No local buyer in ${stateName}? Ship free and get paid within 24 hours of verification. What is safe to send, and what is not.`
    case "estate":
      return `Sealed diabetic supplies left after a death or a move into care still have value in ${stateName}. What can be sold, what cannot, and what it is worth.`
    case "dexcom":
      return `${stat}We buy sealed Dexcom G6 and G7 sensors, transmitters and receivers in ${stateName} — including expired G7 sensors.`
    case "libre":
      return `${stat}We buy sealed FreeStyle Libre 1, 2 and 3 sensors in ${stateName}. US retail versions, cash or same-day electronic payment.`
    case "omnipod":
      return `${stat}We buy Omnipod 5, DASH and Classic pods in ${stateName} — expired pods included. Bulk lots welcome.`
    case "meter-brands":
      return `${stat}We buy Contour Next, Accu-Chek, OneTouch and True Metrix strips in ${stateName}. Sealed boxes, fast payment.`
    case "expired":
      return `Most expired diabetic supplies are worthless — but not all. What ${stateName} sellers can still get paid for, and what to stop holding onto.`
    case "bulk":
      return `${stat}Selling 10 to 500+ boxes in ${stateName}? Bulk lots get a higher per-box rate. One call, one price, one payment.`
    case "worth":
      return `${stat}What sealed test strips, CGM sensors and pods actually pay in ${stateName} — by brand tier, updated for ${CURRENT_GUIDE_YEAR}.`
  }
}

// ---------------------------------------------------------------------------
// Body content
// ---------------------------------------------------------------------------

/**
 * The opening paragraphs. Every sentence that carries a number is dropped when
 * that number is missing, so a state with sparse data gets a shorter lead
 * rather than a hollow one.
 */
export function postLead(stateCode: string, stateName: string): string[] {
  const h = healthFor(stateCode)
  const out: string[] = []
  if (!h) return out

  const rank = prevalenceRank(stateCode)
  const national = nationalPrevalence()

  if (h.diabetesPrevalence != null) {
    let s = `About ${h.diabetesPrevalence}% of adults in ${stateName} have diagnosed diabetes`
    if (h.brfssYear) s += `, according to the CDC's ${h.brfssYear} BRFSS estimates`
    s += "."
    if (rank != null && national) {
      const cmp =
        h.diabetesPrevalence > national
          ? `above the national rate of ${national}%`
          : h.diabetesPrevalence < national
            ? `below the national rate of ${national}%`
            : `level with the national rate of ${national}%`
      s += ` That is ${cmp}, and the ${ordinal(rank)} highest of any state.`
    }
    out.push(s)
  }

  const spread = citySpread(stateCode)
  if (spread) {
    out.push(
      `The figure is not uniform across the state. In ${spread.high.name} it reads ${spread.high.diabetes}%, while in ${spread.low.name} it is ${spread.low.diabetes}% — a ${spread.gap}-point gap between two cities in the same state. Where you live changes how common these supplies are, and how easy they are to pass on rather than throw away.`
    )
  }

  return out
}

/**
 * The angle-specific section — the part that makes a Dexcom post read
 * differently from a bulk post rather than merely carrying a different title.
 */
export function angleSection(
  stateCode: string,
  stateName: string
): { heading: string; paragraphs: string[] } {
  const angle = angleFor(stateCode)
  const h = healthFor(stateCode)
  const cities = topCities(stateCode, 3)
  const cityList = joinList(cities.map((c) => c.name))

  switch (angle) {
    case "local-buyers":
      return {
        heading: `Meeting a Buyer Locally in ${stateName}`,
        paragraphs: [
          `${stateName} has buyers listed on this directory who take supplies in person, which means you can hand over a box and walk away with cash the same day rather than waiting on a shipment to arrive and clear.`,
          cities.length
            ? `Most in-person activity clusters around the larger population centres — ${cityList} among them. If you are outside those areas, a prepaid shipping label costs you nothing and payment still lands within 24 hours of verification.`
            : `If you are not near a listed buyer, a prepaid shipping label costs you nothing and payment still lands within 24 hours of verification.`,
        ],
      }

    case "safe-mail-in":
      return {
        heading: `Selling Safely When There Is No Local Buyer`,
        paragraphs: [
          `There is no buyer listed in ${stateName} yet, so mail-in is the honest answer here — and it is worth being straight about what that means. You are shipping sealed medical supplies to a stranger, so the protections matter more than the convenience.`,
          `Three things make a mail-in sale safe: get the quote in writing before anything ships, use a prepaid label with tracking so the parcel is traceable end to end, and keep the boxes sealed so their condition cannot be disputed on arrival. A buyer who will not put a number in writing before you ship is not one to use.`,
          h?.zipCount
            ? `${stateName} covers ${h.zipCount.toLocaleString()} ZIP codes, and a prepaid label reaches every one of them at the same cost to you: nothing.`
            : `A prepaid label reaches every ZIP code in the state at the same cost to you: nothing.`,
        ],
      }

    case "estate": {
      const senior = h?.seniorSharePct
      const sRank = seniorRank(stateCode)
      const paras = [
        `Clearing out a parent's home, or a spouse's, is not the moment anyone wants to think about resale value. But sealed diabetic supplies are genuinely worth money, and they are one of the few things in a medicine cabinet that should not simply go in the bin.`,
      ]
      if (senior != null) {
        paras.push(
          sRank != null && sRank <= 10
            ? `${senior}% of ${stateName} residents are 65 or older — ${rankPhrase(sRank)} share in the country. That is a lot of households where a change in prescription, a move into care, or a death leaves unopened boxes behind.`
            : `${senior}% of ${stateName} residents are 65 or older, so this comes up here often.`
        )
      }
      paras.push(
        `What can be sold: unopened, unexpired boxes with the factory seal intact. A pharmacy label with your relative's name on it does not prevent a sale. What cannot: anything opened, anything past its date apart from Omnipod pods and Dexcom G7 sensors, and anything bought through Medicare or Medicaid.`
      )
      return { heading: `What to Do With Supplies Left Behind`, paragraphs: paras }
    }

    case "dexcom":
      return {
        heading: `Dexcom Sensors, Transmitters and Receivers`,
        paragraphs: [
          `Dexcom is one of the strongest-paying categories, and it is the one where the expiry rule differs from everything else. We buy sealed G6 sensors, G6 transmitters, G7 sensors and G7 receivers from sellers across ${stateName}.`,
          `The exception worth knowing: expired G7 sensors still have value. Most buyers will not touch anything past its date, so these get thrown away constantly. If you have G7 sensors that have run out, check before discarding them — that is money most people bin without realising.`,
        ],
      }

    case "libre":
      return {
        heading: `FreeStyle Libre — Which Versions We Buy`,
        paragraphs: [
          `We buy sealed FreeStyle Libre 1, 2 and 3 sensors from sellers throughout ${stateName}. All three generations still have a market, so an older sensor is not automatically worthless.`,
          `One qualifier that catches people out: US retail versions only. Libre sensors bought abroad, or supplied through a programme that is not US retail, cannot be resold here regardless of condition. Check the box before you ship — it saves a wasted parcel.`,
        ],
      }

    case "omnipod":
      return {
        heading: `Omnipod Pods — Including Expired`,
        paragraphs: [
          `We buy Omnipod 5 pods and Omnipod DASH pods in boxes of 5, and Omnipod Classic in boxes of 10, from sellers across ${stateName}. Pods only — pumps and controllers are a separate conversation.`,
          `Like Dexcom G7 sensors, expired Omnipod pods are one of the two exceptions to the expiry rule. They still pay, at a reduced rate. Most sellers throw expired pods out because every other buyer refuses them, which makes this one of the more common ways people lose money without knowing it.`,
        ],
      }

    case "meter-brands":
      return {
        heading: `Meter Strips — Brands and Box Counts`,
        paragraphs: [
          `Contour Next, Accu-Chek, OneTouch and True Metrix are the four families that make up most of what changes hands in ${stateName}. Within them we buy Contour Next in all versions, Accu-Chek Guide, Aviva and SmartView, and OneTouch Verio and Ultra.`,
          `Box count matters more than people expect. A 100-count box is worth meaningfully more than two 50-count boxes of the same brand, so it is worth checking what you actually have before assuming a small pile is not worth the call.`,
        ],
      }

    case "expired":
      return {
        heading: `What Expiry Actually Rules Out`,
        paragraphs: [
          `The blunt version: almost everything past its printed date is worthless, and any buyer who tells you otherwise across the board is not being straight with you. Test strips degrade, and a strip that reads inaccurately is a safety problem, not a bargain.`,
          `There are exactly two exceptions, and they are worth knowing precisely because they are so often binned: expired Omnipod pods — 5, DASH and Classic — and expired Dexcom G7 sensors. Both still pay at a reduced rate. Everything else needs to be unexpired, and for test strips we generally want at least six months left.`,
          `If you are in ${stateName} and about to throw out a box because the date has passed, it costs nothing to check which of the two categories it falls into first.`,
        ],
      }

    case "bulk":
      return {
        heading: `Bulk Lots — 10 Boxes to 500+`,
        paragraphs: [
          `Bulk is where the per-box rate improves, and it is a bigger share of what moves through ${stateName} than most people assume. Estate liquidators, caregivers winding down a household, and pharmacy clear-outs regularly produce dozens or hundreds of boxes at once.`,
          `The process changes at volume: rather than pricing box by box, quote the lot as a whole — brand mix, quantities and expiry dates — and settle it in one payment. Mixed brands in a single lot are fine and do not need separating.`,
        ],
      }

    case "worth": {
      const paras = [
        `What a box pays comes down to three things: the brand, how many boxes you have, and how much time is left before the expiry date. Brand is the biggest single factor, which is why the tables below rank by tier rather than quoting one flat figure.`,
        `Read the tiers within their own category. A mid-tier CGM sensor can still pay more per box than a top-tier test strip — the tiers rank brands against others of the same type, not across the whole catalogue.`,
      ]
      if (h?.uninsuredRate != null) {
        paras.push(
          `Demand for affordable supplies is real here: ${h.uninsuredRate}% of working-age adults in ${stateName} have no health insurance, and for them retail prices are the only prices. That is the market these boxes go to serve.`
        )
      }
      return { heading: `What Determines the Payout`, paragraphs: paras }
    }
  }
}

/**
 * A closing paragraph built entirely from this state's own figures.
 *
 * This exists because of a measurement, not a hunch: after the angle sections
 * landed, Maine and Vermont still measured 96% identical. Both carry the estate
 * angle, so everything except the numbers was shared prose. Four sentence
 * shapes, chosen by a stable per-state hash, mean two states with the same
 * angle no longer render the same sentences in the same order.
 *
 * Every branch is omitted rather than padded when its figure is missing.
 */
export function stateContext(stateCode: string, stateName: string): string | null {
  const h = healthFor(stateCode)
  if (!h) return null

  const parts: string[] = []
  // Six shapes for a maximum angle-group size of six, so no two states sharing
  // an angle can land on the same one. Four buckets was not enough: Alabama and
  // Utah both carry the dexcom angle and collided at positions 0 and 4.
  const variant = variantIndex(stateCode, 6)
  const rank = prevalenceRank(stateCode)
  const spread = citySpread(stateCode)
  const biggest = topCities(stateCode, 1)[0]

  if (variant === 0 && h.zipCount && h.population) {
    parts.push(
      `${stateName} covers ${h.zipCount.toLocaleString()} ZIP codes and about ${(h.population / 1_000_000).toFixed(1)} million people.`
    )
    if (h.uninsuredRate != null) {
      parts.push(
        `${h.uninsuredRate}% of working-age adults here carry no health insurance, which is precisely the group that ends up paying retail for supplies.`
      )
    }
  } else if (variant === 1 && biggest) {
    parts.push(
      `${biggest.name} is the largest city in ${stateName}, and ${biggest.diabetes}% of adults there have diagnosed diabetes.`
    )
    if (h.seniorSharePct != null) {
      parts.push(
        `Statewide, ${h.seniorSharePct}% of residents are 65 or over — the age group most likely to have a cupboard of supplies they no longer use.`
      )
    }
  } else if (variant === 2 && rank != null) {
    parts.push(
      `On diagnosed diabetes, ${stateName} ranks ${ordinal(rank)} among the states.`
    )
    if (spread) {
      parts.push(
        `Within its own borders the range runs from ${spread.low.diabetes}% in ${spread.low.name} to ${spread.high.diabetes}% in ${spread.high.name}, so a statewide average hides a lot.`
      )
    }
  } else if (variant === 3 && h.uninsuredRate != null && h.seniorSharePct != null) {
    parts.push(
      `Two figures shape the market in ${stateName}: ${h.seniorSharePct}% of residents are 65 or over, and ${h.uninsuredRate}% of working-age adults have no health insurance.`
    )
    parts.push(`The first is where unused supplies come from. The second is where they go.`)
  } else if (variant === 4 && spread && h.diabetesPrevalence != null) {
    parts.push(
      `Averaged across ${stateName}, ${h.diabetesPrevalence}% of adults have diagnosed diabetes.`
    )
    parts.push(
      `${spread.high.name} sits ${Math.round((spread.high.diabetes - h.diabetesPrevalence) * 10) / 10} points above that average and ${spread.low.name} well below it, which is worth knowing if you are trying to work out whether anyone near you actually needs what you are holding.`
    )
  } else if (variant === 5 && h.population && h.seniorSharePct != null) {
    const seniors = Math.round((h.population * h.seniorSharePct) / 100 / 1000) * 1000
    parts.push(
      `Roughly ${seniors.toLocaleString()} people in ${stateName} are 65 or over.`
    )
    if (h.zipCount) {
      parts.push(
        `Spread across ${h.zipCount.toLocaleString()} ZIP codes, that is a lot of medicine cabinets holding supplies nobody is going to use.`
      )
    }
  }

  if (!parts.length && h.zipCount) {
    parts.push(
      `${stateName} covers ${h.zipCount.toLocaleString()} ZIP codes, and a prepaid label reaches every one of them.`
    )
  }

  return parts.length ? parts.join(" ") : null
}

/** Short label for listings, so the blog index is not 50 identical captions. */
export function angleLabel(angle: PostAngle): string {
  switch (angle) {
    case "local-buyers": return "Local buyers"
    case "safe-mail-in": return "Selling safely"
    case "estate": return "Estate & cleanout"
    case "dexcom": return "Dexcom"
    case "libre": return "FreeStyle Libre"
    case "omnipod": return "Omnipod"
    case "meter-brands": return "Meter strips"
    case "expired": return "Expired supplies"
    case "bulk": return "Bulk lots"
    case "worth": return "Payout tiers"
  }
}

// ---------------------------------------------------------------------------
// Product catalogue, scoped to the post's angle
// ---------------------------------------------------------------------------

export type ProductCategory = {
  key: string
  icon: string
  label: string
  items: string[]
}

/**
 * The full catalogue. Previously every one of these six blocks was rendered on
 * all 50 posts, which by itself accounted for a large share of the identical
 * text between them. Posts now expand only the categories their angle is
 * actually about and summarise the rest, which cuts the shared bulk and makes
 * each page more focused at the same time.
 */
export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    key: "strips",
    icon: "🩸",
    label: "Test Strips",
    items: [
      "FreeStyle Lite",
      "Contour Next (all versions)",
      "Accu-Chek Guide / Aviva / SmartView",
      "OneTouch Verio / Ultra",
      "True Metrix",
    ],
  },
  {
    key: "cgm",
    icon: "📡",
    label: "CGM Sensors & Transmitters",
    items: [
      "Dexcom G6 Sensors",
      "Dexcom G6 Transmitters",
      "Dexcom G7 Sensors",
      "Dexcom G7 Receivers",
      "FreeStyle Libre 1 / 2 / 3 Sensors (U.S. retail versions only)",
    ],
  },
  {
    key: "pods",
    icon: "💉",
    label: "Insulin Delivery Pods (Pods Only)",
    items: [
      "Omnipod 5 Pods (Box of 5)",
      "Omnipod DASH Pods (Box of 5)",
      "Omnipod Classic Pods (Box of 10)",
    ],
  },
  {
    key: "infusion",
    icon: "🧷",
    label: "Infusion Sets",
    items: ["AutoSoft 90", "AutoSoft XC 6mm", "AutoSoft XC 9mm"],
  },
  {
    key: "medtronic",
    icon: "🧩",
    label: "Medtronic / MiniMed (Select Sealed Components)",
    items: [
      "MiniMed Pump MMT-780G",
      "MiniMed Mio Advance MMT-242A",
      "Medtronic Quick-set (Pack of 10) — 396 / 397 / 399",
      'Medtronic Guardian Sensor 5-pack (all versions except "B")',
    ],
  },
  {
    key: "tandem",
    icon: "⚙️",
    label: "Tandem / t:slim",
    items: [
      "t:slim X2 Insulin Pump + Control-IQ (must be sent together — Software Version 7.8 only)",
    ],
  },
]

/**
 * Which catalogue category this post expands in full — exactly one.
 *
 * Measured, not assumed: with two categories expanded, the catalogue was a
 * single 2,573-character run identical between any two posts sharing an
 * emphasis set — about 46% of the page, and the largest single reason Maine and
 * Vermont still measured 92% alike. Product angles keep the category they are
 * named after; the rest rotate within their angle group so that two states
 * sharing an angle do not expand the same list. Everything else is one summary
 * line pointing at /price-guide, which is where the full catalogue belongs.
 */
export function emphasisCategories(angle: PostAngle, stateCode: string): string[] {
  switch (angle) {
    case "dexcom":
    case "libre":
      return ["cgm"]
    case "omnipod":
      return ["pods"]
    case "meter-brands":
      return ["strips"]
    default: {
      const pool = ["strips", "cgm", "pods"]
      return [pool[variantIndex(stateCode, pool.length)]]
    }
  }
}

/**
 * Which payout tables this post shows.
 *
 * Both tables on all 50 posts was one of the largest single blocks of identical
 * text on the site — roughly twenty rows of the same brand names in the same
 * order. Posts that are not about pricing now link to /price-guide instead,
 * which is where that table belongs anyway.
 */
export function emphasisTierTables(angle: PostAngle): Array<"strips" | "cgm"> {
  switch (angle) {
    case "worth":
    case "bulk":
      return ["strips", "cgm"]
    case "meter-brands":
      return ["strips"]
    case "dexcom":
    case "libre":
    case "omnipod":
      return ["cgm"]
    case "estate":
    case "local-buyers":
    case "safe-mail-in":
    case "expired":
      return []
  }
}

/**
 * The "what has to be true before you sell" block, varied by angle.
 *
 * Deliberately not phrased as a legal assurance anywhere. The previous copy
 * asserted that selling "is legal in {state} and throughout the United States",
 * unqualified, inside a page carrying FAQPage schema. The legality hub page
 * carries the qualified explanation and the not-legal-advice notice.
 */
export function requirements(angle: PostAngle): { heading: string; intro: string; items: string[] } {
  const sealed = "The boxes are in their original, sealed packaging"
  const notPublic = "They were not purchased using Medicare or Medicaid"
  const dated =
    "They have at least 6 months before expiration — except Omnipod pods and Dexcom G7 sensors, which we take expired"

  switch (angle) {
    case "estate":
      return {
        heading: "What Can and Cannot Be Passed On",
        intro:
          "Sorting through someone's supplies, these are the three things that decide whether a box has value:",
        items: [
          "The seal is unbroken — a pharmacy label with their name on it does not matter",
          notPublic,
          "The date has not passed, unless it is Omnipod pods or Dexcom G7 sensors",
        ],
      }
    case "safe-mail-in":
      return {
        heading: "Check These Before You Ship",
        intro:
          "A parcel that fails any of these gets sent back, so it is worth two minutes before it goes out:",
        items: [sealed, notPublic, dated],
      }
    case "expired":
      return {
        heading: "Where the Line Actually Falls",
        intro: "Setting the two expiry exceptions aside, everything else has to clear this bar:",
        items: [sealed, notPublic, "At least 6 months left before the printed expiration date"],
      }
    case "bulk":
      return {
        heading: "What a Lot Has to Clear",
        intro:
          "The same three conditions apply to a lot of 500 boxes as to a single one — they just get checked in batches:",
        items: [sealed, notPublic, dated],
      }
    case "dexcom":
      return {
        heading: "What a Sensor Has to Clear",
        intro:
          "Dexcom aside from the expired-G7 exception, the same three conditions apply as to anything else:",
        items: [
          "The sensor or transmitter is sealed in its original packaging",
          notPublic,
          "It is unexpired — except G7 sensors, which we take past their date",
        ],
      }
    case "libre":
      return {
        heading: "Before You Send Libre Sensors",
        intro: "Four things decide whether a Libre sensor has value, and one of them is easy to miss:",
        items: [
          "It is a US retail version — sensors sourced abroad cannot be resold here",
          sealed,
          notPublic,
        ],
      }
    case "omnipod":
      return {
        heading: "What a Box of Pods Has to Clear",
        intro: "Pods are the most forgiving category we buy, but three things still hold:",
        items: [
          "The box is sealed — 5-count for Omnipod 5 and DASH, 10-count for Classic",
          notPublic,
          "Any expiry date is fine on pods; everything else must be in date",
        ],
      }
    case "meter-brands":
      return {
        heading: "What a Box of Strips Has to Clear",
        intro: "Strips are the strictest category, because an inaccurate strip is a safety problem:",
        items: [
          sealed,
          notPublic,
          "At least 6 months before the printed expiration date",
        ],
      }
    case "worth":
      return {
        heading: "What Can Reduce or Void a Quote",
        intro:
          "A quote assumes all three of these. If one fails, the number changes or the sale cannot go ahead:",
        items: [sealed, notPublic, dated],
      }
    case "local-buyers":
      return {
        heading: "What to Bring to a Handover",
        intro:
          "Whether you are meeting someone locally or posting a parcel, the same three conditions decide the sale:",
        items: [sealed, notPublic, dated],
      }
  }
}

/**
 * Per-state FAQs. Angle-specific questions come first, then questions built
 * from whatever real data the state actually has. Anything without a
 * supporting figure is left out entirely rather than templated.
 */
export function postFaqs(
  stateCode: string,
  stateName: string,
  hasLocalBuyer: boolean
): Faq[] {
  const angle = angleFor(stateCode)
  const h = healthFor(stateCode)
  const faqs: Faq[] = []

  // 1. Angle-led question — different across the ten angles.
  switch (angle) {
    case "local-buyers":
      faqs.push({
        q: `Can I meet a buyer in person in ${stateName}?`,
        a: `Yes. ${stateName} has buyers on this directory who take supplies in person, which usually means same-day cash. If you are not near one, a prepaid shipping label costs you nothing.`,
      })
      break
    case "safe-mail-in":
      faqs.push({
        q: `There is no buyer near me in ${stateName}. Is mailing them safe?`,
        a: `It is, with three conditions: get your quote in writing before shipping, use a tracked prepaid label, and keep every box sealed. Payment is sent within 24 hours of the parcel being received and verified.`,
      })
      break
    case "estate":
      faqs.push({
        q: `The boxes have my relative's name on the pharmacy label. Can they still be sold?`,
        a: `Yes. A prescription label with a name on it does not affect the sale, as long as the box is sealed and the supplies were not obtained through Medicare or Medicaid.`,
      })
      break
    case "dexcom":
      faqs.push({
        q: `Do you buy expired Dexcom G7 sensors?`,
        a: `Yes — expired G7 sensors are one of only two items we take past their date, at a reduced rate. Expired G6 sensors we cannot use. Check before discarding either.`,
      })
      break
    case "libre":
      faqs.push({
        q: `Do you buy FreeStyle Libre 1 and 2, or only Libre 3?`,
        a: `All three generations, provided they are sealed, unexpired and US retail versions. Sensors sourced outside the US cannot be resold here.`,
      })
      break
    case "omnipod":
      faqs.push({
        q: `Do you accept expired Omnipod pods?`,
        a: `Yes. Omnipod 5, DASH and Classic pods are accepted past their expiry date at a reduced rate — one of only two exceptions we make. Pods only, not pumps or controllers.`,
      })
      break
    case "meter-brands":
      faqs.push({
        q: `I have several different brands mixed together. Is that a problem?`,
        a: `Not at all — a mixed lot is quoted as one lot. Contour Next, Accu-Chek, OneTouch, FreeStyle Lite and True Metrix can all go in the same sale.`,
      })
      break
    case "expired":
      faqs.push({
        q: `Which expired supplies still have value?`,
        a: `Two: Omnipod pods (5, DASH and Classic) and Dexcom G7 sensors. Both pay at a reduced rate. Everything else must be unexpired, and test strips should have at least six months left.`,
      })
      break
    case "bulk":
      faqs.push({
        q: `How many boxes counts as bulk in ${stateName}?`,
        a: `Ten or more typically earns a better per-box rate, and lots run to 500+. Quote the whole lot at once rather than box by box — mixed brands do not need separating.`,
      })
      break
    case "worth":
      faqs.push({
        q: `Why is my payout quoted as a tier instead of a fixed price?`,
        a: `Because brand, quantity and remaining expiry all move the number. Tiers rank brands within their own category, so a mid-tier CGM sensor can still pay more per box than a top-tier test strip.`,
      })
      break
  }

  // 2. Data-derived questions — omitted when the figure is absent.
  const spread = citySpread(stateCode)
  if (spread) {
    faqs.push({
      q: `Is demand different in different parts of ${stateName}?`,
      a: `Diagnosed diabetes is not evenly spread. ${spread.high.name} reads ${spread.high.diabetes}% among adults against ${spread.low.name}'s ${spread.low.diabetes}% — a ${spread.gap}-point difference. Payout does not change by city, but how easily supplies find a use nearby does.`,
    })
  }

  if (h?.seniorSharePct != null && angle !== "estate") {
    faqs.push({
      q: `Who usually sells supplies in ${stateName}?`,
      a: `Mostly people whose prescription changed, caregivers, and families clearing a home. With ${h.seniorSharePct}% of ${stateName} residents aged 65 or over, the last of those is common.`,
    })
  }

  faqs.push({
    q: hasLocalBuyer
      ? `How fast will I get paid in ${stateName}?`
      : `How fast will I get paid if I ship from ${stateName}?`,
    a: hasLocalBuyer
      ? `In person, on the spot. By post, within 24 hours of the parcel being received and verified.`
      : `Within 24 hours of your parcel being received and verified. The shipping label costs you nothing.`,
  })

  faqs.push({
    q: `What condition do the boxes need to be in?`,
    a: `Factory-sealed and unopened. Partial boxes, opened packaging and broken seals cannot be resold. Supplies bought through Medicare or Medicaid cannot be resold either.`,
  })

  return faqs
}
