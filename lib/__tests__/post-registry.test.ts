import { describe, it, expect } from "vitest"
import { POST_REGISTRY, getRegistryPost } from "@/lib/posts"
import { STATE_BLOG_POSTS } from "@/lib/blog-posts"

/**
 * Tests for the non-state blog post registry (lib/posts/).
 *
 * Mirrors the quality gates on blog-bodies.test.ts so every content path on
 * the site is covered by the same rule set. The no-dollar-figure rule matches
 * the existing test in blog-bodies.test.ts — this site publishes tiers, not
 * exact prices.
 */

function allText(post: (typeof POST_REGISTRY)[number]): string {
  return [
    post.title,
    post.description,
    post.bodyHtml,
    ...(post.faqs?.flatMap((f) => [f.q, f.a]) ?? []),
  ].join(" ")
}

describe("POST_REGISTRY", () => {
  it("is an array (may be empty but must exist)", () => {
    expect(Array.isArray(POST_REGISTRY)).toBe(true)
  })

  it("gives every post a unique slug", () => {
    const slugs = POST_REGISTRY.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it("slugs do not collide with state post slugs", () => {
    const stateSlugs = new Set(STATE_BLOG_POSTS.map((p) => p.slug))
    for (const post of POST_REGISTRY) {
      expect(stateSlugs.has(post.slug), `registry slug '${post.slug}' collides with a state post`).toBe(false)
    }
  })

  it("gives every post a valid ISO datePublished and dateModified", () => {
    for (const post of POST_REGISTRY) {
      expect(post.datePublished, `${post.slug} datePublished`).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(Number.isNaN(Date.parse(post.datePublished)), `${post.slug} datePublished invalid`).toBe(false)
      expect(post.dateModified, `${post.slug} dateModified`).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(Number.isNaN(Date.parse(post.dateModified)), `${post.slug} dateModified invalid`).toBe(false)
    }
  })

  it("never quotes a dollar figure — this site publishes tiers, not prices", () => {
    for (const post of POST_REGISTRY) {
      const text = allText(post)
      expect(text, `${post.slug} quotes a dollar amount`).not.toMatch(/\$\s?\d/)
      expect(text, `${post.slug} quotes a price in words`).not.toMatch(/\b\d+\s?(dollars|bucks)\b/i)
    }
  })

  it("never makes an unqualified legality claim", () => {
    for (const post of POST_REGISTRY) {
      expect(allText(post), `${post.slug} carries a bare legality claim`).not.toMatch(
        /is legal in|legal throughout|100% legal|perfectly legal/i
      )
    }
  })

  it("gives every post a non-empty title and description within sane length bounds", () => {
    for (const post of POST_REGISTRY) {
      expect(post.title.length, `${post.slug} title empty`).toBeGreaterThan(10)
      expect(post.title.length, `${post.slug} title too long`).toBeLessThanOrEqual(95)
      expect(post.description.length, `${post.slug} description too short`).toBeGreaterThan(60)
      expect(post.description.length, `${post.slug} description too long`).toBeLessThanOrEqual(240)
    }
  })

  it("gives every post a non-empty bodyHtml", () => {
    for (const post of POST_REGISTRY) {
      expect(post.bodyHtml.trim().length, `${post.slug} body is empty`).toBeGreaterThan(100)
    }
  })

  it("getRegistryPost returns the right post by slug", () => {
    for (const post of POST_REGISTRY) {
      expect(getRegistryPost(post.slug)).toBe(post)
    }
  })

  it("getRegistryPost returns undefined for an unknown slug", () => {
    expect(getRegistryPost("this-slug-does-not-exist-in-the-registry")).toBeUndefined()
  })
})
