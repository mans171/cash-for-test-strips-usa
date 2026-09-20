import { describe, it, expect } from "vitest"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { BuyerCard } from "@/app/components/BuyerCard"
import { ContactButtons, MAIL_IN_KIT_HREF, MAIL_IN_KIT_LABEL } from "@/app/components/ContactButtons"
import type { Company } from "@/lib/types"

/**
 * /mail-in-kit is the site's national offer, and until 2026-09-20 nothing but
 * three small text links pointed at it — the mail-in listing itself, shown on
 * every no-buyer state page, offered only call/text. These guard the routing.
 */

const base: Company = {
  id: "c1",
  name: "Example Buyer",
  slug: "example-buyer",
  url: null,
  phone: "555-010-0000",
  email: null,
  city: "Springfield",
  states: ["NY"],
  payment_methods: ["Cash"],
  accepted_brands: ["OneTouch"],
  rating: null,
  description: null,
  featured: false,
  verified: true,
} as unknown as Company

const mailIn = { ...base, id: "c2", name: "Example Mail-In", slug: "example-mail-in", mail_in: true } as Company
const inPerson = { ...base, mail_in: false } as Company

const kitAnchor = new RegExp(`<a[^>]*href="${MAIL_IN_KIT_HREF}"[^>]*>${MAIL_IN_KIT_LABEL}</a>`)

describe("mail-in kit button on the shared buyer card", () => {
  it("shows a real link to the kit for a mail_in buyer, above call/text", () => {
    const html = renderToStaticMarkup(createElement(BuyerCard, { company: mailIn }))
    expect(html).toMatch(kitAnchor)
    expect(html).toContain("Call or text 555-010-0000")
    expect(html.indexOf(MAIL_IN_KIT_LABEL)).toBeLessThan(html.indexOf("Call or text"))
  })

  it("is absent for an in-person buyer", () => {
    const html = renderToStaticMarkup(createElement(BuyerCard, { company: inPerson }))
    expect(html).not.toContain(MAIL_IN_KIT_HREF)
    expect(html).not.toContain(MAIL_IN_KIT_LABEL)
    expect(html).toContain("Call or text 555-010-0000")
  })

  it("is absent when the flag is missing, whatever the buyer is called", () => {
    const named = { ...base, name: "CFTS Mail-In", slug: "cfts-mail-in" } as Company
    const html = renderToStaticMarkup(createElement(BuyerCard, { company: named }))
    expect(html).not.toContain(MAIL_IN_KIT_HREF)
  })

  it("still shows for a mail_in buyer with no phone, url or email on file", () => {
    const bare = { ...mailIn, phone: null } as Company
    const html = renderToStaticMarkup(createElement(BuyerCard, { company: bare }))
    expect(html).toMatch(kitAnchor)
  })

  it("steps the call button down to secondary only on the mail-in card", () => {
    const mailHtml = renderToStaticMarkup(createElement(ContactButtons, { company: mailIn }))
    const localHtml = renderToStaticMarkup(createElement(ContactButtons, { company: inPerson }))
    const callClass = (h: string) => h.match(/<a href="tel:[^"]*" class="([^"]*)"/)?.[1] ?? ""
    expect(callClass(localHtml)).toContain("bg-cash")
    expect(callClass(mailHtml)).not.toContain("bg-cash")
  })

  it("the directory's mail-in banner inherits it through ContactButtons", () => {
    const html = renderToStaticMarkup(
      createElement(ContactButtons, { company: mailIn, size: "page", tone: "dark" })
    )
    expect(html).toMatch(kitAnchor)
  })
})

describe("sitewide routing to /mail-in-kit", () => {
  const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8")

  it("is in the nav — desktop bar and mobile drawer", () => {
    const nav = read("app/SiteNav.tsx")
    expect(nav).toMatch(/href: "\/mail-in-kit", label: "Mail-In Kit"/)
    expect(nav).toMatch(/PRIMARY_LINKS[\s\S]*?"Mail-In Kit"/)
  })

  it("is in the footer", () => {
    expect(read("app/layout.tsx")).toMatch(/href="\/mail-in-kit"/)
  })

  it("is linked from the homepage, the hub, the state page and the city page", () => {
    for (const page of [
      "app/page.tsx",
      "app/sell-test-strips/page.tsx",
      "app/sell-test-strips/[state]/page.tsx",
      "app/sell-test-strips/[state]/[city]/page.tsx",
    ]) {
      expect(read(page), `${page} does not link /mail-in-kit`).toMatch(/href="\/mail-in-kit"/)
    }
  })

  it("the directory passes the mail-in company to ContactButtons rather than duplicating the button", () => {
    const dir = read("app/directory/page.tsx")
    expect(dir).toMatch(/<ContactButtons company=\{company\}/)
    expect(dir).not.toMatch(/mail-in-kit/)
  })

  it("is described in llms.txt", () => {
    expect(read("public/llms.txt")).toMatch(/^- \/mail-in-kit — /m)
  })
})
