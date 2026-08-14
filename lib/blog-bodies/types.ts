/**
 * Hand-written post bodies, one per state.
 *
 * Why these exist alongside the derived content in `blog-post-content.ts`:
 * the derived version is one skeleton with per-state figures dropped into it.
 * That took mean similarity between posts from 95.5% to 55.5%, but it left
 * states sharing an angle at 83% — the skeleton is identical and only the
 * numbers move. A generator cannot get past that. Writing does.
 *
 * The division of labour:
 *   - `state-health-data.ts` remains the only source of figures. A body may
 *     quote a number, but the number has to be one that file carries, so
 *     nothing on the site is invented and everything stays checkable.
 *   - The body supplies the argument, the structure and the voice, which is
 *     what the generator could never vary.
 *
 * Any state without an entry here falls back to the derived version, so the
 * site is never half-finished while these are written.
 */

export type BodySection = {
  heading: string
  paragraphs: string[]
}

export type PostBody = {
  /** Overrides the derived title. Keep stable once live. */
  title: string
  /** Overrides the derived H1. */
  heading: string
  /** Overrides the derived meta description. */
  metaDescription: string
  /** Opening paragraphs, before the first subheading. */
  lead: string[]
  /** Body sections in render order. */
  sections: BodySection[]
  /** Replaces the derived FAQ set entirely. */
  faqs: { q: string; a: string }[]
}
