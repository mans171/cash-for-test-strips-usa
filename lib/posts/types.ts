/**
 * Type definitions for the non-state blog post registry.
 *
 * Why this exists: the site's blog route (app/blog/[slug]/page.tsx) previously
 * served only the 50 state posts generated from lib/blog-bodies/. Adding a
 * Wednesday cadence of topical (non-state) posts required a second content
 * path so each new post does not need its own Next.js route.
 *
 * Usage: create a file in lib/posts/<slug>.ts that exports a RegistryPost,
 * add it to POST_REGISTRY in lib/posts/index.ts, and the post automatically
 * appears in the blog index, sitemap, and at /blog/<slug>.
 *
 * Constraints carried from the rest of the site:
 *  - No dollar figures, exact prices, or payout amounts anywhere in body or
 *    FAQs. Tier language ("top tier", "mid tier") is fine; "$15 per box" is not.
 *  - No unqualified legality claims ("is legal in [state]").
 *  - Author is always the business name, never a personal name.
 *  - JSON-LD Article publisher name must match the site's Organization schema.
 */

export type PostFaq = {
  q: string
  a: string
}

export type RegistryPost = {
  /** URL slug, no leading slash. Must be unique across state posts and other registry posts. */
  slug: string
  /** <title> tag. Keep under 70 characters. */
  title: string
  /** Meta description. Keep 120–160 characters. */
  description: string
  /**
   * ISO date string "YYYY-MM-DD". Used in Article JSON-LD datePublished,
   * sitemap lastmod, and displayed as "Published" on the page.
   */
  datePublished: string
  /**
   * ISO date string "YYYY-MM-DD". Used in Article JSON-LD dateModified
   * and sitemap lastmod (sitemap uses dateModified, not datePublished).
   */
  dateModified: string
  /**
   * Article body as an HTML string. Rendered with dangerouslySetInnerHTML
   * inside a <div className="prose"> block. Do not include the H1 here —
   * the template renders it separately from the title field. Use semantic
   * H2/H3 headings, <p>, <ul>/<ol>, <strong>, <em>, and <a>. No inline styles.
   */
  bodyHtml: string
  /**
   * Optional FAQ items. They appear as a styled Q&A section below the body
   * and are also emitted as FAQPage JSON-LD alongside the Article schema.
   */
  faqs?: PostFaq[]
}
