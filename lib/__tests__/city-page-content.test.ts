import { describe, expect, it } from "vitest"
import { buildCityFaqs, cityIntro, nearbyBuyers, siblingCities } from "../city-page-content"
import { CITY_TARGETS } from "../city-geo"
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

const dallas = CITY_TARGETS.find((c) => c.slug === "dallas")!
const fortWorth = CITY_TARGETS.find((c) => c.slug === "fort-worth")!

describe("city-geo data", () => {
  it("every target has a unique slug within its state", () => {
    const seen = new Set<string>()
    for (const t of CITY_TARGETS) {
      const key = `${t.state}/${t.slug}`
      expect(seen.has(key), `duplicate ${key}`).toBe(false)
      seen.add(key)
    }
  })

  it("excludes Washington DC (no STATE_LABELS/state-page destination)", () => {
    expect(CITY_TARGETS.some((t) => t.state === "DC")).toBe(false)
  })
})

describe("nearbyBuyers", () => {
  const inDallas = company({ id: "dallas-buyer", name: "Dallas Buyer", city: "Dallas", states: ["TX"], lat: 32.78, lng: -96.8 })
  const farAway = company({ id: "denver-buyer", name: "Denver Buyer", city: "Denver", states: ["CO"], lat: 39.74, lng: -104.99 })

  it("orders by real distance from the city center", () => {
    // Denver is genuinely ~660mi from Dallas — outside the default 100mi
    // radius, so it's correctly excluded here rather than merely sorted last.
    const result = nearbyBuyers(dallas, [farAway, inDallas])
    expect(result.map((r) => r.id)).toEqual(["dallas-buyer"])
    expect(result[0].miles).toBeLessThan(5)
  })

  it("includes a distant buyer when the radius is wide enough", () => {
    const result = nearbyBuyers(dallas, [farAway, inDallas], 1000)
    expect(result.map((r) => r.id)).toEqual(["dallas-buyer", "denver-buyer"])
  })

  it("excludes buyers outside the radius", () => {
    const result = nearbyBuyers(dallas, [farAway, inDallas], 50)
    expect(result.map((r) => r.id)).toEqual(["dallas-buyer"])
  })

  it("excludes buyers with no coordinates", () => {
    const noCoords = company({ id: "no-coords", lat: null, lng: null })
    const result = nearbyBuyers(dallas, [noCoords])
    expect(result).toEqual([])
  })
})

describe("siblingCities", () => {
  it("prefers same-state cities before out-of-state ones", () => {
    // Dallas has 3 in-state siblings (Arlington, Fort Worth, San Antonio) —
    // all 3 should fill the quota before any out-of-state city appears.
    const result = siblingCities("dallas", 3)
    expect(result.every((c) => c.state === "TX")).toBe(true)
    expect(result.map((c) => c.slug).sort()).toEqual(["arlington", "fort-worth", "san-antonio"])
  })

  it("returns [] for an unknown slug", () => {
    expect(siblingCities("nonexistent-city")).toEqual([])
  })

  it("never includes the city itself", () => {
    const result = siblingCities("dallas", 20)
    expect(result.some((c) => c.slug === "dallas")).toBe(false)
  })
})

describe("cityIntro", () => {
  it("names the city and the real nearest-buyer distance", () => {
    const buyer = { ...company({ name: "Fort Worth Buyer" }), miles: 31 }
    const text = cityIntro(fortWorth, [buyer])
    expect(text).toContain("Fort Worth Buyer")
    expect(text).toContain("31 miles")
  })

  it("says a buyer is based in the city when miles < 1", () => {
    const buyer = { ...company({ name: "Local Buyer" }), miles: 0.2 }
    const text = cityIntro(dallas, [buyer])
    expect(text).toContain("based right in Dallas")
  })
})

describe("buildCityFaqs", () => {
  it("includes a city-specific meetup FAQ naming the nearest buyer", () => {
    const buyer = { ...company({ name: "Meetup Buyer", city: "Dallas", transaction_modes: ["meetup"] }), miles: 2 }
    const faqs = buildCityFaqs({ target: dallas, buyers: [buyer], hasMailIn: false })
    const meetupFaq = faqs.find((f) => f.q.includes("pay in person"))
    expect(meetupFaq?.a).toContain("Meetup Buyer")
  })

  it("omits the brands FAQ when no buyer lists accepted brands", () => {
    const buyer = { ...company({ accepted_brands: [] }), miles: 2 }
    const faqs = buildCityFaqs({ target: dallas, buyers: [buyer], hasMailIn: false })
    expect(faqs.some((f) => f.q.includes("brands"))).toBe(false)
  })

  it("includes the brands FAQ when buyers list accepted brands", () => {
    const buyer = { ...company({ accepted_brands: ["OneTouch", "FreeStyle"] }), miles: 2 }
    const faqs = buildCityFaqs({ target: dallas, buyers: [buyer], hasMailIn: false })
    const brandsFaq = faqs.find((f) => f.q.includes("brands"))
    expect(brandsFaq?.a).toContain("FreeStyle")
    expect(brandsFaq?.a).toContain("OneTouch")
  })

  it("omits the mail-in FAQ when there is no mail-in buyer", () => {
    const buyer = { ...company(), miles: 2 }
    const faqs = buildCityFaqs({ target: dallas, buyers: [buyer], hasMailIn: false })
    expect(faqs.some((f) => f.q.includes("by mail"))).toBe(false)
  })

  it("includes the mail-in FAQ when hasMailIn is true", () => {
    const buyer = { ...company(), miles: 2 }
    const faqs = buildCityFaqs({ target: dallas, buyers: [buyer], hasMailIn: true })
    expect(faqs.some((f) => f.q.includes("by mail"))).toBe(true)
  })

  it("always includes the condition FAQ", () => {
    const buyer = { ...company(), miles: 2 }
    const faqs = buildCityFaqs({ target: dallas, buyers: [buyer], hasMailIn: false })
    expect(faqs.some((f) => f.q.includes("condition"))).toBe(true)
  })
})
