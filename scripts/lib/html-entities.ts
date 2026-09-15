/**
 * Decode the HTML entities that can appear inside an attribute value.
 *
 * Covers the five XML entities (`&amp; &lt; &gt; &quot; &#39;`) and numeric
 * character references (`&#NN;` decimal, `&#xHH;` hex). No dependencies.
 *
 * Why: `scripts/crawl-check.ts` pulls `href` values straight out of raw HTML,
 * where `&` is serialised as `&amp;`. Fetching `/api/track?company=…&amp;url=…`
 * with the literal `&amp;` sends a query key named `amp;url`, the route 400s,
 * and the checker reports a broken link on a page that is fine.
 */
const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
}

export function decodeHtmlEntities(s: string): string {
  if (!s.includes("&")) return s
  return s.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (match, body: string) => {
    if (body[0] === "#") {
      const hex = body[1] === "x" || body[1] === "X"
      const code = parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10)
      return Number.isFinite(code) && code >= 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : match
    }
    return NAMED[body.toLowerCase()] ?? match
  })
}
