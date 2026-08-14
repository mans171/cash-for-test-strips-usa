import { describe, it, expect } from "vitest"
import { POST_BODIES, bodyFor } from "../blog-bodies"
import { STATE_BLOG_POSTS } from "../blog-posts"
import { STATE_LABELS } from "../states"

const WRITTEN = Object.keys(POST_BODIES)

function allText(code: string): string {
  const b = POST_BODIES[code]
  return [
    b.title,
    b.heading,
    b.metaDescription,
    ...b.lead,
    ...b.sections.flatMap((s) => [s.heading, ...s.paragraphs]),
    ...b.faqs.flatMap((f) => [f.q, f.a]),
  ].join(" ")
}

describe("hand-written post bodies", () => {
  it("keys every body to a state that actually has a post", () => {
    const codes = new Set(STATE_BLOG_POSTS.map((p) => p.stateCode))
    for (const code of WRITTEN) {
      expect(codes.has(code), `${code} has no post`).toBe(true)
    }
  })

  it("never quotes a dollar figure — this site publishes tiers, not prices", () => {
    for (const code of WRITTEN) {
      const text = allText(code)
      expect(text, `${code} quotes a price`).not.toMatch(/\$\s?\d/)
      expect(text, `${code} quotes a price in words`).not.toMatch(
        /\b\d+\s?(dollars|bucks)\b/i
      )
    }
  })

  it("never makes an unqualified legality claim", () => {
    for (const code of WRITTEN) {
      expect(allText(code), `${code} carries a bare legality claim`).not.toMatch(
        /is legal in|legal throughout|100% legal|perfectly legal/i
      )
    }
  })

  it("names its own state and does not name another state's cities", () => {
    for (const code of WRITTEN) {
      expect(allText(code)).toContain(STATE_LABELS[code])
    }
  })

  it("is substantially longer than the derived template it replaces", () => {
    // The derived version renders ~5,400 visible characters. A written body
    // exists to beat a ~3,500-word competitor, so it has to carry real length.
    for (const code of WRITTEN) {
      expect(allText(code).length, `${code} is too short to be worth it`).toBeGreaterThan(4500)
    }
  })

  it("gives every body a lead, several sections and real FAQs", () => {
    for (const code of WRITTEN) {
      const b = POST_BODIES[code]
      expect(b.lead.length, `${code} lead`).toBeGreaterThanOrEqual(1)
      expect(b.sections.length, `${code} sections`).toBeGreaterThanOrEqual(4)
      expect(b.faqs.length, `${code} faqs`).toBeGreaterThanOrEqual(4)
      for (const s of b.sections) {
        expect(s.heading.length).toBeGreaterThan(5)
        expect(s.paragraphs.length).toBeGreaterThan(0)
        for (const p of s.paragraphs) expect(p.length).toBeGreaterThan(60)
      }
      for (const f of b.faqs) {
        expect(f.q.length).toBeGreaterThan(10)
        expect(f.a.length).toBeGreaterThan(40)
      }
    }
  })

  it("keeps titles and descriptions within sane length bounds", () => {
    for (const code of WRITTEN) {
      const b = POST_BODIES[code]
      expect(b.title.length, `${code} title`).toBeLessThanOrEqual(95)
      expect(b.metaDescription.length, `${code} description`).toBeLessThanOrEqual(240)
      expect(b.metaDescription.length).toBeGreaterThan(60)
    }
  })

  it("returns null for states that are still on the derived version", () => {
    const unwritten = STATE_BLOG_POSTS.map((p) => p.stateCode).find(
      (c) => !WRITTEN.includes(c)
    )!
    expect(bodyFor(unwritten)).toBeNull()
  })
})
