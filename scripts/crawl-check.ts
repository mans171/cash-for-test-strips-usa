/**
 * Whole-site crawl check for cash4teststripsusa.com.
 *
 * Usage:
 *   npm run check:crawl                                  # against production
 *   npm run check:crawl -- --base=http://localhost:3000  # against a local build
 *   npm run check:crawl -- --max=50                      # stop after 50 pages
 *
 * Why this exists: on 2026-09-10 a Semrush Site Audit found that every
 * mail-in buyer card linked to /company/cfts-mail-in, which 404s, and that
 * no company page carried the `address` Google requires on LocalBusiness.
 * Both had been live for a while. Search Console could not have shown either
 * one — it reports what Google indexed, not what is broken on a page nobody
 * has visited. Semrush's free tier stops at 100 pages and the site has more,
 * so it under-reported both. This crawls everything, runs on demand, and
 * costs nothing.
 *
 * Checks (errors fail the run, warnings do not):
 *   ERROR   internal link resolves to a non-OK status
 *   ERROR   JSON-LD that does not parse
 *   ERROR   LocalBusiness missing `name` or `address` (Google requires both)
 *   ERROR   FAQPage with an empty mainEntity
 *   WARN    <title> longer than --title-max (default 60)
 *   WARN    page with no <title> at all
 *
 * Read-only: issues GETs and HEADs, nothing else.
 */

// Marks this file as a module. Without it TypeScript treats these scripts as
// global scripts and `main` collides with the one in indexnow-ping.ts.
export {}

type Args = { base: string; max: number; titleMax: number }

function parseArgs(): Args {
  const get = (name: string) =>
    process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=")
  return {
    base: (get("base") ?? "https://cash4teststripsusa.com").replace(/\/+$/, ""),
    max: Number(get("max") ?? 1000),
    titleMax: Number(get("title-max") ?? 60),
  }
}

type Finding = { level: "error" | "warn"; check: string; page: string; detail: string }

const findings: Finding[] = []
const err = (check: string, page: string, detail: string) =>
  findings.push({ level: "error", check, page, detail })
const warn = (check: string, page: string, detail: string) =>
  findings.push({ level: "warn", check, page, detail })

/** Same-origin, non-asset page URLs only, with the fragment and trailing slash normalised off. */
function normalise(href: string, from: string, origin: string): string | null {
  let u: URL
  try {
    u = new URL(href, from)
  } catch {
    return null
  }
  if (u.origin !== origin) return null
  if (!/^https?:$/.test(u.protocol)) return null
  // Skip anything that is plainly a file rather than a page.
  if (/\.(png|jpe?g|gif|svg|webp|ico|css|js|xml|txt|pdf|webmanifest)$/i.test(u.pathname)) return null
  u.hash = ""
  if (u.pathname.length > 1) u.pathname = u.pathname.replace(/\/+$/, "")
  return u.toString()
}

function textBetween(html: string, re: RegExp): string | null {
  const m = html.match(re)
  return m ? m[1] : null
}

function checkStructuredData(html: string, page: string) {
  const blocks = [...html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )]
  for (const [, raw] of blocks) {
    let data: unknown
    try {
      data = JSON.parse(raw)
    } catch {
      err("schema-parse", page, "a JSON-LD block does not parse as JSON")
      continue
    }
    for (const node of Array.isArray(data) ? data : [data]) {
      if (!node || typeof node !== "object") continue
      const item = node as Record<string, unknown>
      const type = String(item["@type"] ?? "")
      if (type === "LocalBusiness") {
        // Google's required properties. Without them the item is invalid and
        // earns no rich result, which is exactly what shipped unnoticed.
        if (!item.name) err("schema-localbusiness", page, "LocalBusiness has no `name`")
        if (!item.address) err("schema-localbusiness", page, "LocalBusiness has no `address`")
      }
      if (type === "FAQPage") {
        const entities = item.mainEntity
        if (!Array.isArray(entities) || entities.length === 0) {
          err("schema-faq", page, "FAQPage has an empty `mainEntity`")
        }
      }
    }
  }
}

async function run() {
  const { base, max, titleMax } = parseArgs()
  const origin = new URL(base).origin

  const queue: string[] = [base]
  const seen = new Set<string>([base])
  const pages: string[] = []
  // link target -> the pages that link to it
  const linkSources = new Map<string, Set<string>>()

  process.stdout.write(`Crawling ${base}\n`)

  while (queue.length > 0 && pages.length < max) {
    const page = queue.shift() as string
    let res: Response
    try {
      res = await fetch(page, { headers: { "user-agent": "cfts-crawl-check" }, redirect: "follow" })
    } catch (e) {
      err("fetch", page, `request failed: ${(e as Error).message}`)
      continue
    }
    if (!res.ok) {
      err("page-status", page, `page returned ${res.status}`)
      continue
    }
    if (!(res.headers.get("content-type") ?? "").includes("text/html")) continue

    const html = await res.text()
    pages.push(page)
    if (pages.length % 25 === 0) process.stdout.write(`  ${pages.length} pages\n`)

    const title = textBetween(html, /<title[^>]*>([\s\S]*?)<\/title>/i)?.trim()
    if (!title) warn("title-missing", page, "page has no <title>")
    else if (title.length > titleMax)
      warn("title-long", page, `<title> is ${title.length} chars (limit ${titleMax})`)

    checkStructuredData(html, page)

    for (const [, href] of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)) {
      const target = normalise(href, page, origin)
      if (!target) continue
      if (!linkSources.has(target)) linkSources.set(target, new Set())
      ;(linkSources.get(target) as Set<string>).add(page)
      if (!seen.has(target)) {
        seen.add(target)
        queue.push(target)
      }
    }
  }

  // Every internal link target gets its status checked, including ones the
  // crawl never opened as a page (it stopped early, or they are not HTML).
  process.stdout.write(`Checking ${linkSources.size} internal link targets\n`)
  const targets = [...linkSources.keys()]
  const CONCURRENCY = 8
  let cursor = 0
  async function worker() {
    while (cursor < targets.length) {
      const target = targets[cursor++]
      try {
        let r = await fetch(target, { method: "HEAD", headers: { "user-agent": "cfts-crawl-check" } })
        // Some hosts refuse HEAD; fall back rather than reporting a false 405.
        if (r.status === 405 || r.status === 501) {
          r = await fetch(target, { headers: { "user-agent": "cfts-crawl-check" } })
        }
        if (!r.ok) {
          const from = [...(linkSources.get(target) as Set<string>)]
          err(
            "broken-link",
            from[0],
            `${target} returned ${r.status}, linked from ${from.length} page${from.length === 1 ? "" : "s"}`
          )
        }
      } catch (e) {
        err("broken-link", target, `request failed: ${(e as Error).message}`)
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))

  report(pages.length, linkSources.size)
}

function report(pageCount: number, linkCount: number) {
  const errors = findings.filter((f) => f.level === "error")
  const warns = findings.filter((f) => f.level === "warn")

  // Group by check so one systemic bug reads as one problem rather than
  // fifty rows — the mail-in 404 was a single fix across 25 pages.
  const byCheck = new Map<string, Finding[]>()
  for (const f of findings) {
    if (!byCheck.has(f.check)) byCheck.set(f.check, [])
    ;(byCheck.get(f.check) as Finding[]).push(f)
  }

  process.stdout.write(`\n${pageCount} pages crawled, ${linkCount} internal link targets checked\n`)
  for (const [check, list] of [...byCheck].sort((a, b) => b[1].length - a[1].length)) {
    const level = list[0].level === "error" ? "ERROR" : "warn "
    process.stdout.write(`\n${level}  ${check} — ${list.length}\n`)
    for (const f of list.slice(0, 10)) {
      process.stdout.write(`         ${f.detail}\n            on ${f.page}\n`)
    }
    if (list.length > 10) process.stdout.write(`         …and ${list.length - 10} more\n`)
  }

  process.stdout.write(
    `\n${errors.length} error${errors.length === 1 ? "" : "s"}, ` +
    `${warns.length} warning${warns.length === 1 ? "" : "s"}\n`
  )
  if (errors.length > 0) process.exit(1)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
