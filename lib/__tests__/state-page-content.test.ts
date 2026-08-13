import { describe, expect, it } from "vitest"
import {
  buildStateFaqs,
  joinList,
  nearestBuyers,
  siblingStates,
} from "../state-page-content"
import { STATE_CENTROIDS, STATE_NEIGHBORS } from "../state-geo"
import { STATE_LABELS } from "../states"
import type { Company } from "../types"

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

describe("state-geo data", () => {
  it("has a centroid for every US state label", () => {
    const codes = Object.keys(STATE_LABELS).filter((c) => c !== "CANADA")
    for (const code of codes) {
      expect(STATE_CENTROIDS[code], `missing centroid for ${code}`).toBeDefined()
    }
  })

  it("has a neighbour entry for every US state label", () => {
    const codes = Object.keys(STATE_LABELS).filter((c) => c !== "CANADA")
    for (const code of codes) {
      expect(STATE_NEIGHBORS[code], `missing neighbours for ${code}`).toBeDefined()
    }
  })

  it("neighbour relationships are symmetric", () => {
    for (const [code, neighbors] of Object.entries(STATE_NEIGHBORS)) {
      for (const n of neighbors) {
        expect(STATE_NEIGHBORS[n], `${n} missing from map`).toBeDefined()
        expect(STATE_NEIGHBORS[n], `${code}->${n} not reciprocated`).toContain(code)
      }
    }
  })
})

describe("nearestBuyers", () => {
  const albany = company({ id: "albany", name: "Albany Buyer", city: "Albany", states: ["NY"], lat: 42.65, lng: -73.75 })
  const boston = company({ id: "boston", name: "Boston Buyer", city: "Boston", states: ["MA"], lat: 42.36, lng: -71.06 })
  const denver = company({ id: "denver", name: "Denver Buyer", city: "Denver", states: ["CO"], lat: 39.74, lng: -104.99 })

  it("orders by real distance from the state centroid", () => {
    const result = nearestBuyers("VT", [denver, boston, albany])
    expect(result.map((r) => r.id)).toEqual(["albany", "boston", "denver"])
    // Albany is genuinely ~110 miles from the centre of Vermont.
    expect(result[0].miles).toBeGreaterThan(80)
    expect(result[0].miles).toBeLessThan(140)
  })

  it("excludes buyers already listed in the state", () => {
    const result = nearestBuyers("NY", [albany, boston])
    expect(result.map((r) => r.id)).toEqual(["boston"])
  })

  it("skips buyers with no coordinates", () => {
    const noGeo = company({ id: "nogeo", states: ["ME"] })
    expect(nearestBuyers("VT", [noGeo])).toEqual([])
  })

  it("returns nothing for an unknown state code", () => {
    expect(nearestBuyers("ZZ", [albany])).toEqual([])
  })

  it("respects the limit", () => {
    expect(nearestBuyers("VT", [denver, boston, albany], 2)).toHaveLength(2)
  })
})

describe("siblingStates", () => {
  it("never links a state to itself", () => {
    for (const code of Object.keys(STATE_CENTROIDS)) {
      expect(siblingStates(code)).not.toContain(code)
    }
  })

  it("prefers land neighbours", () => {
    expect(siblingStates("VT").slice(0, 3).sort()).toEqual(["MA", "NH", "NY"])
  })

  it("pads with nearest states when a state has few neighbours", () => {
    const result = siblingStates("ME", 8)
    expect(result).toHaveLength(8)
    expect(result[0]).toBe("NH")
  })

  it("still produces links for non-contiguous states", () => {
    expect(siblingStates("HI", 4)).toHaveLength(4)
    expect(siblingStates("AK", 4)).toHaveLength(4)
  })

  it("produces a different link set per state, unlike the old hardcoded list", () => {
    const sets = Object.keys(STATE_CENTROIDS)
      .filter((c) => c !== "DC")
      .map((c) => siblingStates(c).join(","))
    // Every state should have a distinct sibling list.
    expect(new Set(sets).size).toBe(sets.length)
  })

  it("covers states the old hardcoded 12-link list orphaned", () => {
    const linked = new Set(
      Object.keys(STATE_CENTROIDS).flatMap((c) => siblingStates(c))
    )
    const codes = Object.keys(STATE_LABELS).filter((c) => c !== "CANADA")
    for (const code of codes) {
      expect(linked.has(code), `${code} has no inbound sibling link`).toBe(true)
    }
  })
})

describe("joinList", () => {
  it("formats lists of each length", () => {
    expect(joinList([])).toBe("")
    expect(joinList(["a"])).toBe("a")
    expect(joinList(["a", "b"])).toBe("a and b")
    expect(joinList(["a", "b", "c"])).toBe("a, b, and c")
  })
})

describe("buildStateFaqs", () => {
  const paBuyer = company({
    id: "pa",
    name: "PA Buyer",
    city: "Philadelphia",
    states: ["PA"],
    accepted_brands: ["OneTouch", "Dexcom"],
    payment_methods: ["PayPal", "Zelle"],
    transaction_modes: ["meetup"],
  })

  it("derives brand, payment, city and in-person answers from real buyer data", () => {
    const faqs = buildStateFaqs({ stateCode: "PA", buyers: [paBuyer], nearby: [], hasMailIn: true })
    const text = faqs.map((f) => `${f.q} ${f.a}`).join(" ")
    expect(text).toContain("Dexcom and OneTouch")
    expect(text).toContain("PayPal and Zelle")
    expect(text).toContain("Philadelphia")
    expect(text).toMatch(/in person/i)
  })

  it("omits answers for fields we hold no data for", () => {
    const bare = company({ id: "bare", states: ["KS"], city: null })
    const faqs = buildStateFaqs({ stateCode: "KS", buyers: [bare], nearby: [], hasMailIn: false })
    const questions = faqs.map((f) => f.q).join(" ")
    expect(questions).not.toMatch(/Which test strip brands/)
    expect(questions).not.toMatch(/How do buyers .* pay/)
    expect(questions).not.toMatch(/Where in Kansas/)
  })

  it("qualifies the legality answer and carries a not-legal-advice disclaimer", () => {
    const faqs = buildStateFaqs({ stateCode: "MT", buyers: [], nearby: [], hasMailIn: true })
    const legal = faqs.find((f) => /legal/i.test(f.q))!
    expect(legal.a).toMatch(/not legal advice/i)
    // The old copy asserted "is legal in X and across the US" unconditionally.
    expect(legal.a).not.toMatch(/\bis legal in\b/)
  })

  it("gives a no-buyer state its real nearest options instead of boilerplate", () => {
    const nearby = nearestBuyers("MT", [
      company({ id: "co", name: "Colorado Buyer", city: "Denver", states: ["CO"], lat: 39.74, lng: -104.99 }),
    ])
    const faqs = buildStateFaqs({ stateCode: "MT", buyers: [], nearby, hasMailIn: true })
    const text = faqs.map((f) => `${f.q} ${f.a}`).join(" ")
    expect(text).toContain("Colorado Buyer")
    expect(text).toMatch(/\d+ miles/)
    expect(text).toMatch(/by mail/i)
  })

  it("produces materially different text for two different no-buyer states", () => {
    const buyers = [
      company({ id: "co", name: "Colorado Buyer", city: "Denver", states: ["CO"], lat: 39.74, lng: -104.99 }),
      company({ id: "ny", name: "Albany Buyer", city: "Albany", states: ["NY"], lat: 42.65, lng: -73.75 }),
    ]
    const mt = buildStateFaqs({
      stateCode: "MT",
      buyers: [],
      nearby: nearestBuyers("MT", buyers),
      hasMailIn: true,
    })
    const vt = buildStateFaqs({
      stateCode: "VT",
      buyers: [],
      nearby: nearestBuyers("VT", buyers),
      hasMailIn: true,
    })
    expect(mt.find((f) => /nearest place/i.test(f.q))!.a).toContain("Denver")
    expect(vt.find((f) => /nearest place/i.test(f.q))!.a).toContain("Albany")
  })

  it("always answers the packaging-condition question", () => {
    const faqs = buildStateFaqs({ stateCode: "WY", buyers: [], nearby: [], hasMailIn: false })
    expect(faqs.some((f) => /condition/i.test(f.q))).toBe(true)
  })
})
