import { describe, expect, it } from "vitest"
import { BRAND, TITLE_MAX, pageTitle, companyTitle, stateTitle, cityTitle } from "../title"
import { STATE_LABELS } from "../states"
import { CITY_TARGETS } from "../city-geo"
import { POST_REGISTRY } from "../posts"

/**
 * The 60-character budget is the whole point of this file. A live crawl on
 * 2026-09-12 found 660 pages whose <title> overflowed (company pages reached
 * 119 characters) because the root layout appended " | Cash For Test Strips
 * USA" to every page via a metadata template. The template is gone; each page
 * now builds its own title through pageTitle(), which appends the brand ONLY
 * when it fits. These tests are the guard that keeps it that way.
 */

describe("pageTitle", () => {
  it("appends the brand when there is room", () => {
    expect(pageTitle("My Orders")).toBe(`My Orders | ${BRAND}`)
  })

  it("drops the brand when appending it would overflow", () => {
    const core = "Sell Diabetic Test Strips in North Carolina"
    expect(pageTitle(core)).toBe(core)
    expect(pageTitle(core).length).toBeLessThanOrEqual(TITLE_MAX)
  })

  it("keeps the brand exactly at the boundary", () => {
    const core = "x".repeat(TITLE_MAX - " | ".length - BRAND.length)
    expect(pageTitle(core)).toBe(`${core} | ${BRAND}`)
    expect(pageTitle(core).length).toBe(TITLE_MAX)
  })

  it("drops the brand one character past the boundary", () => {
    const core = "x".repeat(TITLE_MAX - " | ".length - BRAND.length + 1)
    expect(pageTitle(core)).toBe(core)
  })

  it("throws when the core alone exceeds the maximum", () => {
    expect(() => pageTitle("y".repeat(TITLE_MAX + 1))).toThrow(/60/)
  })

  it("never returns more than TITLE_MAX characters", () => {
    for (let n = 1; n <= TITLE_MAX; n++) {
      expect(pageTitle("z".repeat(n)).length).toBeLessThanOrEqual(TITLE_MAX)
    }
  })
})

describe("companyTitle", () => {
  it("uses the company name when it fits", () => {
    expect(companyTitle("Nova Diabetic Supply", "Lawrenceville", "GA")).toBe(
      "Nova Diabetic Supply — Test Strip Buyer"
    )
  })

  it("keeps a name that repeats the keyword when it still fits", () => {
    // The location form would be "Test Strip Buyer in Philadelphia, PA", which
    // a second Philadelphia buyer would produce byte-for-byte. The name wins.
    expect(
      companyTitle("Cash For Test Strips - Philadelphia, PA", "Philadelphia", "PA")
    ).toBe("Cash For Test Strips - Philadelphia, PA — Test Strip Buyer")
  })

  it("falls back to the city when the name is too long", () => {
    expect(
      companyTitle("Zaks Diabetic Supply BuyBack - Silver Spring, MD", "Silver Spring", "MD")
    ).toBe("Test Strip Buyer in Silver Spring, MD")
  })

  it("falls back to the state when there is no city", () => {
    const long = "Cash for Diabetic Test Strips & CGM Supplies Albany NY"
    expect(companyTitle(long, null, "NY")).toBe("Test Strip Buyer in NY")
  })

  it("survives a long name with neither city nor state", () => {
    const title = companyTitle("Cash for Diabetic Test Strips & CGM Supplies Albany NY", null, null)
    expect(title).toBe("Test Strip Buyer")
  })

  /**
   * Read from the live roster on 2026-09-12. Tests cannot reach the database,
   * so the five longest real buyer names are pinned here as literals — the
   * company route is where the 119-character titles came from.
   */
  const LONGEST_REAL_COMPANY_NAMES: Array<[string, string, string]> = [
    ["Cash for Diabetic Test Strips & CGM Supplies Albany NY", "Albany", "NY"],
    ["Zaks Diabetic Supply BuyBack - Silver Spring, MD", "Silver Spring", "MD"],
    ["Hawks Sport Electronics - Colorado Springs, CO", "Colorado Springs", "CO"],
    ["Cash For Test Strips - Raleigh-Durham, NC", "Raleigh", "NC"],
    ["Vancouver Test Strips Buyer - Vancouver, WA", "Vancouver", "WA"],
  ]

  it.each(LONGEST_REAL_COMPANY_NAMES)(
    "fits 60 characters for %s",
    (name, city, state) => {
      const title = pageTitle(companyTitle(name, city, state))
      expect(title.length).toBeLessThanOrEqual(TITLE_MAX)
    }
  )
})

describe("every generated page title fits the budget", () => {
  it.each(Object.values(STATE_LABELS))("state page: %s", (label) => {
    const title = pageTitle(stateTitle(label))
    expect(title.length).toBeLessThanOrEqual(TITLE_MAX)
  })

  it.each(CITY_TARGETS.map((t) => [t.name, t.state] as const))(
    "city page: %s, %s",
    (name, state) => {
      const title = pageTitle(cityTitle(name, state))
      expect(title.length).toBeLessThanOrEqual(TITLE_MAX)
    }
  )

  it.each(POST_REGISTRY.map((p) => [p.slug, p] as const))(
    "registry post: %s",
    (_slug, post) => {
      const title = pageTitle(post.shortTitle ?? post.title)
      expect(title.length).toBeLessThanOrEqual(TITLE_MAX)
    }
  )

  const STATIC_CORES = [
    "We Buy Diabetic Test Strips | Mail-In or Local",
    "Sell Diabetic Test Strips: All 50 States",
    "Test Strip Buyer Directory",
    "How to Sell Diabetic Test Strips: Guides",
    "About Cash For Test Strips USA",
    "Get a Quote for Your Test Strips",
    "Sell Diabetic Test Strips in Bulk",
    "How Much Are Diabetic Test Strips Worth? 2026 Guide",
    "Where to Sell Diabetic Test Strips in Albany, NY",
    "My Orders",
    "Manage Your Listing",
  ]

  it.each(STATIC_CORES)("static page: %s", (core) => {
    expect(pageTitle(core).length).toBeLessThanOrEqual(TITLE_MAX)
  })
})
