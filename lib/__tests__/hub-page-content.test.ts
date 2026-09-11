import { describe, expect, it } from "vitest"
import { readFileSync } from "fs"
import { join } from "path"
import {
  REGIONS,
  REGION_ORDER,
  buildHubFaqs,
  buildHubRegions,
  buildHubTotals,
  hubStateCodes,
  regionSummary,
  stateFactLine,
} from "../hub-page-content"
import { CITY_TARGETS } from "../city-geo"
import { STATE_HEALTH_DATA } from "../state-health-data"
import { STATE_LABELS } from "../states"
import type { Company } from "../types"

const ROOT = join(__dirname, "..", "..")

function company(overrides: Partial<Company> = {}): Company {
  return {
    id: overrides.id ?? "id-1",
    name: "Test Buyer",
    slug: "test-buyer",
    url: null,
    email: null,
    city: null,
    owner_name: null,
    states: [],
    payment_methods: [],
    accepted_brands: [],
    rating: null,
    description: null,
    featured: false,
    phone: null,
    lat: null,
    lng: null,
    verified: false,
    transaction_modes: [],
    response_time: null,
    est_year: null,
    ...overrides,
  }
}

const US_CODES = Object.keys(STATE_LABELS).filter((c) => c !== "CANADA")

/**
 * One buyer sitting on each city's own centre, so every city target passes the
 * publishable gate. Without coordinates in range a city page 404s, and the hub
 * must not link it.
 */
function buyersCoveringEveryCity(): Company[] {
  return CITY_TARGETS.map((t, i) =>
    company({ id: `cover-${i}`, states: [t.state], lat: t.lat, lng: t.lng })
  )
}

describe("region map", () => {
  it("covers exactly the 50 US states, once each", () => {
    const codes = hubStateCodes()
    expect(codes).toHaveLength(50)
    expect(new Set(codes).size).toBe(50)
    expect([...codes].sort()).toEqual([...US_CODES].sort())
  })

  it("assigns no state to two regions", () => {
    const seen = new Set<string>()
    for (const region of REGION_ORDER) {
      for (const code of REGIONS[region]) {
        expect(seen.has(code), `${code} appears in more than one region`).toBe(false)
        seen.add(code)
      }
    }
  })

  it("has a label for every code it links", () => {
    for (const code of hubStateCodes()) {
      expect(STATE_LABELS[code], `no label for ${code}`).toBeDefined()
    }
  })
})

describe("buildHubRegions", () => {
  it("builds a linkable row for all 50 states", () => {
    const states = buildHubRegions([]).flatMap((r) => r.states)
    expect(states).toHaveLength(50)
    for (const s of states) {
      expect(s.href).toBe(`/sell-test-strips/${s.code.toLowerCase()}`)
      expect(s.label).toBe(STATE_LABELS[s.code])
    }
  })

  it("counts only buyers serving that state", () => {
    const buyers = [
      company({ id: "a", states: ["NY"] }),
      company({ id: "b", states: ["NY", "NJ"] }),
      company({ id: "c", states: ["TX"] }),
    ]
    const states = buildHubRegions(buyers).flatMap((r) => r.states)
    const by = (code: string) => states.find((s) => s.code === code)!

    expect(by("NY").buyerCount).toBe(2)
    expect(by("NJ").buyerCount).toBe(1)
    expect(by("TX").buyerCount).toBe(1)
    expect(by("WY").buyerCount).toBe(0)
  })

  it("counts a multi-state buyer once per region, not once per state", () => {
    // One buyer covering three Northeast states is one buyer in the Northeast.
    const buyers = [company({ id: "a", states: ["NY", "NJ", "CT"] })]
    const northeast = buildHubRegions(buyers).find((r) => r.name === "Northeast")!

    expect(northeast.buyerCount).toBe(1)
    expect(northeast.statesWithBuyers).toBe(3)
  })

  it("attaches every city target to its own state and nowhere else", () => {
    const states = buildHubRegions(buyersCoveringEveryCity()).flatMap((r) => r.states)
    const linked = states.flatMap((s) => s.cities.map((c) => `${s.code}/${c.slug}`))

    expect(linked).toHaveLength(CITY_TARGETS.length)
    for (const target of CITY_TARGETS) {
      expect(linked).toContain(`${target.state}/${target.slug}`)
    }
  })

  // Regression, 2026-09-11: a city page 404s when no buyer is within
  // CITY_BUYER_RADIUS_MI, and the hub went on linking West Virginia's
  // Charleston and Huntington for days after their buyer was deactivated.
  // A crawl found them still linked from two pages each.
  it("links no city when no buyer is in range of one", () => {
    const states = buildHubRegions([]).flatMap((r) => r.states)
    expect(states.flatMap((s) => s.cities)).toHaveLength(0)
  })

  it("drops only the cities that lost their buyer, keeping the rest", () => {
    const wv = CITY_TARGETS.filter((c) => c.state === "WV")
    expect(wv.length).toBeGreaterThan(0)

    const withoutWv = buyersCoveringEveryCity().filter(
      (b) => !wv.some((c) => b.lat === c.lat && b.lng === c.lng)
    )
    const linked = buildHubRegions(withoutWv)
      .flatMap((r) => r.states)
      .flatMap((s) => s.cities.map((c) => c.slug))

    for (const c of wv) expect(linked).not.toContain(c.slug)
    expect(linked.length).toBe(CITY_TARGETS.length - wv.length)
  })

  it("carries the real prevalence reading for each state", () => {
    const states = buildHubRegions([]).flatMap((r) => r.states)
    for (const s of states) {
      expect(s.diabetesPrevalence).toBe(STATE_HEALTH_DATA[s.code]?.diabetesPrevalence ?? null)
    }
  })
})

describe("buildHubTotals", () => {
  it("counts distinct buyers nationally rather than summing regions", () => {
    // Straddles the Northeast (NY) and the South (VA): one buyer, not two.
    const buyers = [company({ id: "a", states: ["NY", "VA"] }), company({ id: "b", states: ["NY"] })]
    const regions = buildHubRegions(buyers)
    const totals = buildHubTotals(regions, buyers)

    expect(totals.buyerCount).toBe(2)
    expect(totals.stateCount).toBe(50)
    expect(totals.statesWithBuyers).toBe(2)
    // These fixture buyers carry no coordinates, so no city page would
    // render for them. The hub must not count a city it will not link.
    expect(totals.cityCount).toBe(0)
  })
})

describe("derived copy", () => {
  it("does not claim coverage a region does not have", () => {
    const regions = buildHubRegions([])
    for (const region of regions) {
      const text = regionSummary(region, true)
      expect(text).toMatch(/No in-person buyer is listed/)
      expect(text).not.toMatch(/have at least one in-person buyer/)
    }
  })

  it("reports partial and full regional coverage differently", () => {
    const partial = buildHubRegions([company({ id: "a", states: ["NY"] })]).find(
      (r) => r.name === "Northeast"
    )!
    expect(regionSummary(partial, true)).toMatch(/1 of 9 Northeast states/)

    const full = buildHubRegions(
      REGIONS.Northeast.map((code, i) => company({ id: `b${i}`, states: [code] }))
    ).find((r) => r.name === "Northeast")!
    expect(regionSummary(full, true)).toMatch(/All 9 Northeast states/)
  })

  it("states a buyer count when there is one, and an alternative when there is not", () => {
    const states = buildHubRegions([company({ id: "a", states: ["NY"] })]).flatMap((r) => r.states)
    const ny = states.find((s) => s.code === "NY")!
    const wy = states.find((s) => s.code === "WY")!

    expect(stateFactLine(ny, true)).toMatch(/^1 in-person buyer/)
    expect(stateFactLine(wy, true)).toMatch(/^Mail-in and nearby buyers/)
    expect(stateFactLine(wy, false)).toMatch(/^Nearest buyers listed/)
  })

  it("renders every prevalence to one decimal place", () => {
    // IN reads exactly 13.0, which rendered as a bare "13%" next to its
    // neighbours' "11.2%" until this was formatted.
    const states = buildHubRegions([]).flatMap((r) => r.states)
    for (const s of states) {
      if (s.diabetesPrevalence === null) continue
      const line = stateFactLine(s, true)
      expect(line, `${s.code} prevalence not to 1dp`).toMatch(/\d+\.\d% adult diabetes rate/)
    }
  })

  it("never quotes a dollar figure — this site publishes tiers, not prices", () => {
    const regions = buildHubRegions([company({ id: "a", states: ["NY"] })])
    const totals = buildHubTotals(regions, [company({ id: "a", states: ["NY"] })])
    const text = [
      ...regions.map((r) => regionSummary(r, true)),
      ...regions.flatMap((r) => r.states.map((s) => stateFactLine(s, true))),
      ...buildHubFaqs({ totals, regions, hasMailIn: true }).map((f) => `${f.q} ${f.a}`),
    ].join(" ")

    expect(text).not.toMatch(/\$\s?\d/)
    expect(text).not.toMatch(/\b\d+\s?(dollars|bucks)\b/i)
  })

  it("never makes an unqualified legality claim", () => {
    const regions = buildHubRegions([])
    const totals = buildHubTotals(regions, [])
    const faqs = buildHubFaqs({ totals, regions, hasMailIn: true })
    const text = faqs.map((f) => `${f.q} ${f.a}`).join(" ")

    expect(text).not.toMatch(/is legal in|legal throughout|100% legal|perfectly legal/i)

    const legal = faqs.find((f) => /legal/i.test(f.q))!
    expect(legal.a).toMatch(/not legal advice/i)
  })

  it("omits the mail-in FAQ when there is no mail-in buyer", () => {
    const regions = buildHubRegions([])
    const totals = buildHubTotals(regions, [])

    const withMail = buildHubFaqs({ totals, regions, hasMailIn: true })
    const without = buildHubFaqs({ totals, regions, hasMailIn: false })

    expect(withMail.some((f) => /no buyer is listed in my state/i.test(f.q))).toBe(true)
    expect(without.some((f) => /no buyer is listed in my state/i.test(f.q))).toBe(false)
  })
})

/**
 * Link-completeness guards. These read the page sources as text rather than
 * rendering them: the pages are async server components that hit Supabase, and
 * the thing worth protecting is that they enumerate from the shared 50-state
 * source instead of drifting back to a hand-written subset — which is exactly
 * the regression that left 40 states with no inbound link.
 */
describe("internal linking", () => {
  const read = (p: string) => readFileSync(join(ROOT, p), "utf8")

  it("the hub is in the sitemap", () => {
    expect(read("app/sitemap.ts")).toMatch(/\$\{BASE_URL\}\/sell-test-strips`/)
  })

  it("the hub sets its own canonical, and the root layout sets none", () => {
    expect(read("app/sell-test-strips/page.tsx")).toMatch(
      /canonical: "https:\/\/cash4teststripsusa\.com\/sell-test-strips"/
    )
    // A canonical in the root layout would apply to every route on the site.
    expect(read("app/layout.tsx")).not.toMatch(/canonical/)
  })

  it("the hub, the homepage and the directory all enumerate the shared 50-state source", () => {
    for (const page of ["app/sell-test-strips/page.tsx", "app/page.tsx", "app/directory/page.tsx"]) {
      expect(read(page), `${page} does not enumerate from hub-page-content`).toMatch(
        /from "@\/lib\/hub-page-content"/
      )
    }
  })

  it("the homepage no longer hardcodes a subset as its only state links", () => {
    const home = read("app/page.tsx")
    // POPULAR_STATES may stay as a fast-path row, but the full region map has
    // to be rendered alongside it.
    expect(home).toMatch(/REGION_ORDER\.map/)
    expect(home).toMatch(/REGIONS\[region\]\.map/)
  })

  it("the hub is linked sitewide from the nav and the footer", () => {
    expect(read("app/SiteNav.tsx")).toMatch(/href: "\/sell-test-strips"/)
    expect(read("app/layout.tsx")).toMatch(/href="\/sell-test-strips"/)
  })

  it("adds no indexable URL beyond the single hub", () => {
    // The fix is inbound links, not more pages — the site is already over
    // crawl budget at 164 URLs.
    const sitemap = read("app/sitemap.ts")
    const staticBlock = sitemap.slice(0, sitemap.indexOf("const blogRoutes"))
    const urls = [...staticBlock.matchAll(/\$\{BASE_URL\}(\/[a-z0-9/-]*)?`/g)].map((m) => m[1] ?? "/")
    expect(urls).toContain("/sell-test-strips")
    expect(new Set(urls).size).toBe(urls.length)
  })
})
