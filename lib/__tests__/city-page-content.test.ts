import { describe, expect, it } from "vitest"
import {
  buildAboveTheFold,
  buildBrandsBlock,
  buildCityFaqs,
  buildCitySpecificFaq,
  buildHowItWorks,
  buildMetaDescription,
  cityIntro,
  nearbyBuyers,
  siblingCities,
} from "../city-page-content"
import { honorsBonus } from "../bonus"
import { CITY_TARGETS } from "../city-geo"
import { OWNER_PHONE } from "../owner"
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

  it("varies the condition FAQ body when buyer description mentions sealing", () => {
    const buyer = { ...company({ description: "We buy sealed boxes only." }), miles: 2 }
    const faqs = buildCityFaqs({ target: dallas, buyers: [buyer], hasMailIn: false })
    const condFaq = faqs.find((f) => f.q.includes("condition"))
    // Should reference the buyer's name (derived from description path)
    expect(condFaq?.a).toContain("Test Buyer")
  })

  it("varies the condition FAQ body when buyer lists meetup and city", () => {
    const buyer = { ...company({ transaction_modes: ["meetup"], city: "Irving" }), miles: 2 }
    const faqs = buildCityFaqs({ target: dallas, buyers: [buyer], hasMailIn: false })
    const condFaq = faqs.find((f) => f.q.includes("condition"))
    expect(condFaq?.a).toContain("Irving")
  })

  it("condition FAQ fallback references the city name", () => {
    const buyer = { ...company({ description: null, transaction_modes: [], city: null }), miles: 2 }
    const faqs = buildCityFaqs({ target: dallas, buyers: [buyer], hasMailIn: false })
    const condFaq = faqs.find((f) => f.q.includes("condition"))
    expect(condFaq?.a).toContain("Dallas")
  })
})

describe("honorsBonus", () => {
  it("returns true for a buyer with the OWNER_PHONE", () => {
    const buyer = { ...company({ phone: OWNER_PHONE }), miles: 2 }
    expect(honorsBonus(buyer)).toBe(true)
  })

  it("returns true regardless of phone formatting", () => {
    // Strip formatting and re-format
    const buyer = { ...company({ phone: OWNER_PHONE.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{4})/, "$1.$2.$3") }), miles: 2 }
    expect(honorsBonus(buyer)).toBe(true)
  })

  it("returns false for a third-party phone number", () => {
    const buyer = { ...company({ phone: "212-555-0199" }), miles: 2 }
    expect(honorsBonus(buyer)).toBe(false)
  })

  it("returns false when phone is null", () => {
    const buyer = { ...company({ phone: null }), miles: 2 }
    expect(honorsBonus(buyer)).toBe(false)
  })

  it("returns true for mail-in buyers regardless of phone", () => {
    const buyer = { ...company({ phone: null, mail_in: true }), miles: 999 }
    expect(honorsBonus(buyer)).toBe(true)
  })
})

describe("buildAboveTheFold", () => {
  it("uses 'We buy' language for house-answered buyers", () => {
    const buyer = { ...company({ phone: OWNER_PHONE, transaction_modes: ["meetup"] }), miles: 5 }
    const atf = buildAboveTheFold(buyer, dallas)
    expect(atf.isHouse).toBe(true)
    expect(atf.headline).toContain("We buy")
    expect(atf.bonusCopy).not.toBeNull()
  })

  it("uses buyer name for third-party buyers", () => {
    const buyer = { ...company({ name: "Dallas Test Strips Co", phone: "214-555-0100" }), miles: 5 }
    const atf = buildAboveTheFold(buyer, dallas)
    expect(atf.isHouse).toBe(false)
    expect(atf.headline).toContain("Dallas Test Strips Co")
    expect(atf.bonusCopy).toBeNull()
  })

  it("sets hasMeetup when transaction_modes includes meetup", () => {
    const buyer = { ...company({ transaction_modes: ["meetup"], phone: "214-555-0100" }), miles: 3 }
    const atf = buildAboveTheFold(buyer, dallas)
    expect(atf.hasMeetup).toBe(true)
  })

  it("sets hasMeetup false when transaction_modes is empty", () => {
    const buyer = { ...company({ transaction_modes: [], phone: "214-555-0100" }), miles: 3 }
    const atf = buildAboveTheFold(buyer, dallas)
    expect(atf.hasMeetup).toBe(false)
  })

  it("includes phone for house-answered buyers", () => {
    const buyer = { ...company({ phone: OWNER_PHONE }), miles: 1 }
    const atf = buildAboveTheFold(buyer, dallas)
    expect(atf.phone).toBe(OWNER_PHONE)
  })

  it("exposes phone for third-party buyers too", () => {
    const buyer = { ...company({ phone: "817-555-0177" }), miles: 8 }
    const atf = buildAboveTheFold(buyer, dallas)
    expect(atf.phone).toBe("817-555-0177")
  })

  it("sets phone null when buyer has no phone", () => {
    const buyer = { ...company({ phone: null }), miles: 5 }
    const atf = buildAboveTheFold(buyer, dallas)
    expect(atf.phone).toBeNull()
  })

  it("no dollar figures in headline or contextLine except BONUS_MENTION_COPY", () => {
    const buyer = { ...company({ phone: OWNER_PHONE, response_time: "within 1 hour" }), miles: 2 }
    const atf = buildAboveTheFold(buyer, dallas)
    // Only the bonus copy should contain $10; headline/contextLine must not
    expect(atf.headline).not.toMatch(/\$\d/)
    expect(atf.contextLine ?? "").not.toMatch(/\$\d/)
  })
})

describe("buildBrandsBlock", () => {
  it("deduplicates and sorts brands across buyers", () => {
    const b1 = { ...company({ accepted_brands: ["FreeStyle", "OneTouch"] }), miles: 2 }
    const b2 = { ...company({ accepted_brands: ["OneTouch", "Accu-Chek"] }), miles: 5 }
    const brands = buildBrandsBlock([b1, b2])
    expect(brands).toEqual(["Accu-Chek", "FreeStyle", "OneTouch"])
  })

  it("returns empty array when no buyer lists accepted brands", () => {
    const buyer = { ...company({ accepted_brands: [] }), miles: 2 }
    expect(buildBrandsBlock([buyer])).toEqual([])
  })
})

describe("buildHowItWorks", () => {
  it("always emits a contact step", () => {
    const buyer = { ...company({ phone: "214-555-0100" }), miles: 3 }
    const steps = buildHowItWorks(buyer, false)
    expect(steps[0].title).toMatch(/contact/i)
  })

  it("emits a meetup step when transaction_modes includes meetup", () => {
    const buyer = { ...company({ transaction_modes: ["meetup"], city: "Plano" }), miles: 3 }
    const steps = buildHowItWorks(buyer, false)
    expect(steps.some((s) => s.title.toLowerCase().includes("in person"))).toBe(true)
  })

  it("omits meetup step when transaction_modes is empty", () => {
    const buyer = { ...company({ transaction_modes: [] }), miles: 3 }
    const steps = buildHowItWorks(buyer, false)
    expect(steps.some((s) => s.title.toLowerCase().includes("in person"))).toBe(false)
  })

  it("emits mail-in step when hasMailIn is true", () => {
    const buyer = { ...company(), miles: 3 }
    const steps = buildHowItWorks(buyer, true)
    expect(steps.some((s) => s.title.toLowerCase().includes("mail"))).toBe(true)
  })

  it("omits mail-in step when hasMailIn is false", () => {
    const buyer = { ...company(), miles: 3 }
    const steps = buildHowItWorks(buyer, false)
    expect(steps.some((s) => s.title.toLowerCase().includes("mail"))).toBe(false)
  })

  it("emits a payment step when payment_methods is non-empty", () => {
    const buyer = { ...company({ payment_methods: ["Zelle", "Cash"] }), miles: 3 }
    const steps = buildHowItWorks(buyer, false)
    expect(steps.some((s) => s.title.toLowerCase().includes("paid"))).toBe(true)
    const payStep = steps.find((s) => s.title.toLowerCase().includes("paid"))
    expect(payStep?.body).toContain("Zelle")
  })

  it("omits payment step when payment_methods is empty", () => {
    const buyer = { ...company({ payment_methods: [] }), miles: 3 }
    const steps = buildHowItWorks(buyer, false)
    expect(steps.some((s) => s.title.toLowerCase().includes("paid"))).toBe(false)
  })

  it("no dollar figures in step bodies except via bonus copy", () => {
    const buyer = { ...company({ phone: OWNER_PHONE, payment_methods: ["Cash"] }), miles: 3 }
    const steps = buildHowItWorks(buyer, false)
    for (const step of steps) {
      // Should not mention dollar amounts other than the known bonus
      expect(step.body).not.toMatch(/\$\d+(?!\s*bonus)/)
    }
  })
})

describe("buildMetaDescription", () => {
  it("returns a description <= 160 chars", () => {
    const buyer = { ...company({ phone: OWNER_PHONE, transaction_modes: ["meetup"], payment_methods: ["PayPal", "Zelle", "Cash"] }), miles: 5 }
    const desc = buildMetaDescription(buyer, dallas)
    expect(desc.length).toBeLessThanOrEqual(160)
  })

  it("uses 'We buy' for house-answered buyers", () => {
    const buyer = { ...company({ phone: OWNER_PHONE }), miles: 5 }
    const desc = buildMetaDescription(buyer, dallas)
    expect(desc).toContain("We buy")
  })

  it("uses buyer name for third-party buyers", () => {
    const buyer = { ...company({ name: "Dallas Strips LLC", phone: "214-555-0100" }), miles: 5 }
    const desc = buildMetaDescription(buyer, dallas)
    expect(desc).toContain("Dallas Strips LLC")
  })

  it("never claims specific payment methods not listed on the buyer", () => {
    // A buyer that only does Zelle — should NOT say PayPal or check
    const buyer = { ...company({ payment_methods: ["Zelle"], phone: "214-555-0100" }), miles: 5 }
    const desc = buildMetaDescription(buyer, dallas)
    expect(desc).not.toContain("PayPal")
    expect(desc).not.toContain("check")
  })

  it("includes the city and state", () => {
    const buyer = { ...company({ phone: OWNER_PHONE }), miles: 5 }
    const desc = buildMetaDescription(buyer, dallas)
    expect(desc).toContain("Dallas")
    expect(desc).toContain("TX")
  })

  it("no dollar figures in description", () => {
    const buyer = { ...company({ phone: OWNER_PHONE, payment_methods: ["Cash"] }), miles: 5 }
    const desc = buildMetaDescription(buyer, dallas)
    expect(desc).not.toMatch(/\$\d/)
  })
})

describe("buildCitySpecificFaq", () => {
  it("derives a ZIP-based FAQ when zips are provided", () => {
    const buyer = { ...company({ phone: OWNER_PHONE }), miles: 3 }
    const faq = buildCitySpecificFaq(buyer, dallas, ["75201", "75202", "75203", "75204"])
    expect(faq).not.toBeNull()
    expect(faq?.q).toContain("ZIP")
    expect(faq?.a).toContain("75201")
  })

  it("returns null when no zips are provided", () => {
    const buyer = { ...company({ name: "Dallas Buyer" }), miles: 12 }
    const faq = buildCitySpecificFaq(buyer, dallas, [])
    expect(faq).toBeNull()
  })

  it("says 'Contact us' for house-answered buyers in ZIP FAQ", () => {
    const buyer = { ...company({ phone: OWNER_PHONE }), miles: 2 }
    const faq = buildCitySpecificFaq(buyer, dallas, ["75201"])
    expect(faq?.a).toContain("Contact us")
  })

  it("uses buyer name for third-party buyers in ZIP FAQ", () => {
    const buyer = { ...company({ name: "Third Party Co", phone: "214-555-0199" }), miles: 4 }
    const faq = buildCitySpecificFaq(buyer, dallas, ["75201"])
    expect(faq?.a).toContain("Third Party Co")
  })
})
