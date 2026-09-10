import type { Company } from './types'

/**
 * Whether a buyer has a public /company/[slug] profile page.
 *
 * Mail-in buyers deliberately have no profile — app/company/[slug]/page.tsx
 * calls notFound() for them. Every surface that renders a "View profile" link
 * must ask this first, or it ships a link straight to a 404. That happened:
 * the mail-in card on the state and city pages linked to /company/cfts-mail-in
 * on ~25 crawled state pages (all states with no local buyer), which is exactly
 * the set of pages where mail-in is the only offer we make.
 *
 * Kept in its own plain module so both server components and the route can
 * import it without pulling in a "use client" boundary.
 */
export function hasProfilePage(company: Pick<Company, 'mail_in'>): boolean {
  return !company.mail_in
}
