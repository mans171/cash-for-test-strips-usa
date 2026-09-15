import { describe, expect, it } from "vitest"
import { decodeHtmlEntities } from "../lib/html-entities"

describe("decodeHtmlEntities", () => {
  it("decodes &amp; inside a query string (the /api/track false-positive)", () => {
    expect(
      decodeHtmlEntities("/api/track?company=864medex&amp;url=https%3A%2F%2F864medex.com")
    ).toBe("/api/track?company=864medex&url=https%3A%2F%2F864medex.com")
  })

  it("decodes the decimal apostrophe &#39;", () => {
    expect(decodeHtmlEntities("/blog/what&#39;s-new")).toBe("/blog/what's-new")
  })

  it("decodes the hex slash &#x2F;", () => {
    expect(decodeHtmlEntities("&#x2F;directory&#x2F;ny")).toBe("/directory/ny")
  })

  it("decodes the remaining XML entities", () => {
    expect(decodeHtmlEntities("&lt;&gt;&quot;&apos;")).toBe("<>\"'")
  })

  it("returns a string with no entities unchanged", () => {
    const plain = "/company/cfts-mail-in?ref=1&x=2"
    expect(decodeHtmlEntities(plain)).toBe(plain)
  })

  it("leaves unknown or malformed references alone", () => {
    expect(decodeHtmlEntities("a&nosuchentity;b&amp")).toBe("a&nosuchentity;b&amp")
  })
})
