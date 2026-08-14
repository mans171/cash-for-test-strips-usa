import { describe, it, expect } from "vitest"
import {
  angleFor,
  healthFor,
  nationalPrevalence,
  prevalenceRank,
  seniorRank,
  topCities,
  citySpread,
  postTitle,
  postHeading,
  postMetaDescription,
  postLead,
  angleSection,
  postFaqs,
  stateContext,
  requirements,
  emphasisCategories,
  emphasisTierTables,
  angleLabel,
} from "../blog-post-content"
import { STATE_ANGLES, ANGLE_RATIONALE } from "../blog-angles"
import { ALL_STATE_HEALTH, STATE_HEALTH_DATA } from "../state-health-data"
import { STATE_LABELS } from "../states"
import { STATE_BLOG_POSTS } from "../blog-posts"

/**
 * The states that actually have a post. Deliberately not Object.keys(STATE_LABELS):
 * that map also carries a CANADA pseudo-code, which has no post and no health
 * data, and DC has health data but no post.
 */
const CODES = STATE_BLOG_POSTS.map((p) => p.stateCode)

describe("state-health-data integrity", () => {
  it("covers every state the site has a label for", () => {
    for (const code of CODES) {
      expect(STATE_HEALTH_DATA[code], `missing health data for ${code}`).toBeTruthy()
    }
  })

  it("carries a prevalence figure and cities for every state", () => {
    for (const s of ALL_STATE_HEALTH) {
      expect(s.diabetesPrevalence, `${s.code} prevalence`).not.toBeNull()
      expect(s.cities.length, `${s.code} cities`).toBeGreaterThan(0)
    }
  })

  it("records a BRFSS vintage on every state, and uses the 2022 fallback only for KY and PA", () => {
    for (const s of ALL_STATE_HEALTH) {
      expect(s.brfssYear, `${s.code} vintage`).not.toBeNull()
    }
    const fallback = ALL_STATE_HEALTH.filter((s) => s.brfssYear === 2022).map((s) => s.code)
    expect(fallback.sort()).toEqual(["KY", "PA"])
  })

  it("keeps prevalence figures inside a plausible range", () => {
    for (const s of ALL_STATE_HEALTH) {
      expect(s.diabetesPrevalence!).toBeGreaterThan(4)
      expect(s.diabetesPrevalence!).toBeLessThan(25)
      for (const c of s.cities) {
        expect(c.diabetes, `${s.code}/${c.name}`).toBeGreaterThan(1)
        expect(c.diabetes, `${s.code}/${c.name}`).toBeLessThan(35)
      }
    }
  })

  it("orders each state's cities largest first", () => {
    for (const s of ALL_STATE_HEALTH) {
      const pops = s.cities.map((c) => c.pop)
      expect([...pops].sort((a, b) => b - a)).toEqual(pops)
    }
  })
})

describe("angle assignment", () => {
  it("assigns an angle and a rationale to every state", () => {
    for (const code of CODES) {
      expect(STATE_ANGLES[code], `angle for ${code}`).toBeTruthy()
      expect(ANGLE_RATIONALE[code], `rationale for ${code}`).toBeTruthy()
    }
  })

  it("spreads posts across every angle rather than clustering", () => {
    const counts = new Map<string, number>()
    for (const code of CODES) {
      const a = angleFor(code)
      counts.set(a, (counts.get(a) ?? 0) + 1)
    }
    expect(counts.size).toBe(10)
    for (const [angle, n] of counts) {
      expect(n, `${angle} carries too many states`).toBeLessThanOrEqual(8)
    }
  })

  it("gives the estate angle to states that genuinely skew old", () => {
    for (const code of CODES) {
      if (angleFor(code) !== "estate") continue
      const rank = seniorRank(code)
      expect(rank, `${code} claims the estate angle`).not.toBeNull()
      expect(rank!).toBeLessThanOrEqual(10)
    }
  })

  it("never gives the local-buyers angle to a state with no in-state buyer", () => {
    // Buyer coverage as of 2026-08-14. Kept explicit so a future data change
    // that widens coverage fails loudly here rather than silently mismatching
    // a frozen title against reality.
    const withBuyers = new Set([
      "CA", "CO", "FL", "IN", "KS", "LA", "MA", "MD", "MI",
      "NC", "NJ", "NV", "NY", "OH", "PA", "SC", "TX", "WA", "WV",
    ])
    for (const code of CODES) {
      if (angleFor(code) === "local-buyers") {
        expect(withBuyers.has(code), `${code} has no in-state buyer`).toBe(true)
      }
      if (angleFor(code) === "safe-mail-in") {
        expect(withBuyers.has(code), `${code} does have a buyer`).toBe(false)
      }
    }
  })
})

describe("derived statistics", () => {
  it("computes a national prevalence inside the states' own range", () => {
    const nat = nationalPrevalence()
    const rates = ALL_STATE_HEALTH.map((s) => s.diabetesPrevalence!)
    expect(nat).toBeGreaterThan(Math.min(...rates))
    expect(nat).toBeLessThan(Math.max(...rates))
  })

  it("ranks West Virginia highest for prevalence and Maine highest for age", () => {
    expect(prevalenceRank("WV")).toBe(1)
    expect(seniorRank("ME")).toBe(1)
  })

  it("returns null ranks for a state it has no data for", () => {
    expect(prevalenceRank("ZZ")).toBeNull()
    expect(seniorRank("ZZ")).toBeNull()
    expect(healthFor("ZZ")).toBeNull()
  })

  it("finds a real intra-state spread where one exists", () => {
    const wv = citySpread("WV")
    expect(wv).not.toBeNull()
    expect(wv!.high.diabetes).toBeGreaterThan(wv!.low.diabetes)
    expect(wv!.gap).toBeCloseTo(
      Math.round((wv!.high.diabetes - wv!.low.diabetes) * 10) / 10,
      5
    )
  })

  it("caps topCities at the requested limit", () => {
    expect(topCities("TX", 2).length).toBeLessThanOrEqual(2)
    expect(topCities("ZZ").length).toBe(0)
  })
})

describe("titles and metadata", () => {
  it("produces a distinct title for every state", () => {
    const titles = CODES.map((c) => postTitle(c, STATE_LABELS[c]))
    expect(new Set(titles).size).toBe(CODES.length)
  })

  it("produces a distinct meta description for every state", () => {
    const metas = CODES.map((c) => postMetaDescription(c, STATE_LABELS[c]))
    expect(new Set(metas).size).toBe(CODES.length)
  })

  it("does not repeat one title template across every state", () => {
    // The defect being fixed: 52 titles that differed only by the state name.
    // Strip the state name and distinct shapes should remain.
    const shapes = new Set(
      CODES.map((c) => postTitle(c, STATE_LABELS[c]).replaceAll(STATE_LABELS[c], "X"))
    )
    expect(shapes.size).toBeGreaterThanOrEqual(8)
  })

  it("names the state in every title and heading", () => {
    for (const c of CODES) {
      expect(postTitle(c, STATE_LABELS[c])).toContain(STATE_LABELS[c])
      expect(postHeading(c, STATE_LABELS[c])).toContain(STATE_LABELS[c])
    }
  })

  it("keeps titles and descriptions within sane length bounds", () => {
    for (const c of CODES) {
      const t = postTitle(c, STATE_LABELS[c])
      expect(t.length, `${c} title too long: ${t}`).toBeLessThanOrEqual(95)
      const d = postMetaDescription(c, STATE_LABELS[c])
      expect(d.length, `${c} description too long`).toBeLessThanOrEqual(230)
      expect(d.length).toBeGreaterThan(60)
    }
  })
})

describe("body content", () => {
  it("writes a lead for every state that cites a sourced figure", () => {
    for (const c of CODES) {
      const lead = postLead(c, STATE_LABELS[c])
      expect(lead.length, `${c} lead`).toBeGreaterThan(0)
      expect(lead[0]).toMatch(/\d+(\.\d+)?%/)
    }
  })

  it("attributes the prevalence figure to its source year", () => {
    const lead = postLead("NY", "New York")
    expect(lead[0]).toContain("BRFSS")
    expect(lead[0]).toContain("2023")
    expect(postLead("PA", "Pennsylvania")[0]).toContain("2022")
  })

  it("returns no lead for a state it has no data for", () => {
    expect(postLead("ZZ", "Nowhere")).toEqual([])
  })

  it("gives every state a non-empty angle section", () => {
    for (const c of CODES) {
      const s = angleSection(c, STATE_LABELS[c])
      expect(s.heading.length).toBeGreaterThan(0)
      expect(s.paragraphs.length).toBeGreaterThan(0)
      for (const p of s.paragraphs) expect(p.length).toBeGreaterThan(40)
    }
  })

  it("varies the angle section across states rather than swapping a noun", () => {
    const shapes = new Set(
      CODES.map((c) =>
        angleSection(c, STATE_LABELS[c])
          .paragraphs.join(" ")
          .replaceAll(STATE_LABELS[c], "X")
          .replace(/[\d.,]+/g, "#")
      )
    )
    expect(shapes.size).toBeGreaterThanOrEqual(10)
  })

  it("tells zero-buyer states the truth about local pickup", () => {
    const mt = angleSection("MT", "Montana")
    expect(mt.paragraphs.join(" ")).toContain("no buyer listed in Montana")
    // and never promises a local meetup it cannot honour
    expect(mt.paragraphs.join(" ")).not.toMatch(/local pickup is available/i)
  })
})

describe("faqs", () => {
  it("builds a distinct first question per angle", () => {
    const seen = new Map<string, string>()
    for (const c of CODES) {
      const angle = angleFor(c)
      const first = postFaqs(c, STATE_LABELS[c], false)[0].q.replaceAll(STATE_LABELS[c], "X")
      if (seen.has(angle)) expect(first).toBe(seen.get(angle))
      else seen.set(angle, first)
    }
    expect(new Set(seen.values()).size).toBe(10)
  })

  it("omits the age question when the angle already covers it", () => {
    const estate = CODES.find((c) => angleFor(c) === "estate")!
    const qs = postFaqs(estate, STATE_LABELS[estate], false).map((f) => f.q)
    expect(qs.filter((q) => q.startsWith("Who usually sells")).length).toBe(0)
  })

  it("changes the payment answer based on whether a local buyer exists", () => {
    const withBuyer = postFaqs("NY", "New York", true).map((f) => f.a).join(" ")
    const without = postFaqs("MT", "Montana", false).map((f) => f.a).join(" ")
    expect(withBuyer).toContain("on the spot")
    expect(without).not.toContain("on the spot")
  })

  it("gives every state at least three questions, all non-empty", () => {
    for (const c of CODES) {
      const faqs = postFaqs(c, STATE_LABELS[c], false)
      expect(faqs.length, `${c} faqs`).toBeGreaterThanOrEqual(3)
      for (const f of faqs) {
        expect(f.q.length).toBeGreaterThan(10)
        expect(f.a.length).toBeGreaterThan(30)
      }
    }
  })

  it("never asserts an unqualified legal claim", () => {
    for (const c of CODES) {
      const text = [
        ...postLead(c, STATE_LABELS[c]),
        ...angleSection(c, STATE_LABELS[c]).paragraphs,
        ...postFaqs(c, STATE_LABELS[c], false).map((f) => `${f.q} ${f.a}`),
      ].join(" ")
      expect(text, `${c} carries a bare legality claim`).not.toMatch(
        /is legal in|legal throughout|100% legal/i
      )
    }
  })
})

describe("duplication controls", () => {
  // These exist because of a measurement. With two catalogue categories
  // expanded, the "What We Buy" block was a single 2,573-character run
  // identical between any two posts sharing an emphasis set — the largest
  // single reason Maine and Vermont still measured 92% alike after the angle
  // sections landed. Each assertion here holds one of the levers that fixed it.

  it("expands exactly one catalogue category per post", () => {
    for (const c of CODES) {
      expect(emphasisCategories(angleFor(c), c).length, `${c}`).toBe(1)
    }
  })

  it("keeps product posts on the category they are named after", () => {
    for (const c of CODES) {
      const angle = angleFor(c)
      const [cat] = emphasisCategories(angle, c)
      if (angle === "dexcom" || angle === "libre") expect(cat).toBe("cgm")
      if (angle === "omnipod") expect(cat).toBe("pods")
      if (angle === "meter-brands") expect(cat).toBe("strips")
    }
  })

  it("varies the expanded category between states sharing a non-product angle", () => {
    const byAngle = new Map<string, Set<string>>()
    for (const c of CODES) {
      const angle = angleFor(c)
      if (["dexcom", "libre", "omnipod", "meter-brands"].includes(angle)) continue
      const set = byAngle.get(angle) ?? new Set()
      set.add(emphasisCategories(angle, c)[0])
      byAngle.set(angle, set)
    }
    // every non-product angle group should span more than one category
    for (const [angle, cats] of byAngle) {
      expect(cats.size, `${angle} expands only ${[...cats]}`).toBeGreaterThan(1)
    }
  })

  it("shows both payout tables only on posts actually about pricing", () => {
    for (const c of CODES) {
      const angle = angleFor(c)
      const tables = emphasisTierTables(angle)
      if (angle === "worth" || angle === "bulk") expect(tables).toHaveLength(2)
      else expect(tables.length).toBeLessThanOrEqual(1)
    }
  })

  it("writes a state context paragraph that differs between same-angle states", () => {
    const byAngle = new Map<string, string[]>()
    for (const c of CODES) {
      const text = stateContext(c, STATE_LABELS[c])
      expect(text, `${c} context`).toBeTruthy()
      const arr = byAngle.get(angleFor(c)) ?? []
      // strip the numbers and the state name: what remains is the sentence shape
      arr.push(text!.replaceAll(STATE_LABELS[c], "X").replace(/[\d.,]+/g, "#"))
      byAngle.set(angleFor(c), arr)
    }
    for (const [angle, shapes] of byAngle) {
      if (shapes.length < 2) continue
      expect(new Set(shapes).size, `${angle} reuses one sentence shape`).toBeGreaterThan(1)
    }
  })

  it("returns no context for a state it has no data for", () => {
    expect(stateContext("ZZ", "Nowhere")).toBeNull()
  })

  it("varies the requirements wording across angles", () => {
    const headings = new Set(CODES.map((c) => requirements(angleFor(c)).heading))
    expect(headings.size).toBeGreaterThanOrEqual(4)
    for (const c of CODES) {
      const r = requirements(angleFor(c))
      expect(r.items.length).toBe(3)
      expect(r.intro.length).toBeGreaterThan(20)
    }
  })

  it("gives every angle a distinct listing label", () => {
    const labels = new Set(CODES.map((c) => angleLabel(angleFor(c))))
    expect(labels.size).toBe(10)
  })

  it("never promises a local meetup in a state with no buyer", () => {
    // The old template's step 2 said "We have local buyers in {state}" purely
    // from a query that could be empty. Zero-buyer states must never say it.
    const noBuyer = ["MT", "ND", "WY", "VT", "ME", "ID", "NE", "KS"].filter(
      (c) => angleFor(c) === "safe-mail-in"
    )
    for (const c of noBuyer) {
      const text = [
        ...angleSection(c, STATE_LABELS[c]).paragraphs,
        stateContext(c, STATE_LABELS[c]) ?? "",
      ].join(" ")
      expect(text).not.toMatch(/local buyers in/i)
    }
  })
})
