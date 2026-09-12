import type { Company } from './types'
import { HOUSE_PHONES } from './owner'

const digits = (s: string) => s.replace(/\D/g, '')

/** A listing is a real, independent buyer worth indexing when it has its own
 *  number or its own site. 21 of the active listings are the house network —
 *  identical fields, no site of their own — and read to Google as thin
 *  near-duplicates of each other. Mail-in has no profile page at all
 *  (see lib/company-profile.ts) but still needs to drop out of the sitemap.
 *  Decided 2026-09-12. */
export function isIndexableProfile(c: Pick<Company, 'phone' | 'url' | 'mail_in'>): boolean {
  if (c.mail_in) return false
  const isHouseNumber = !!c.phone && HOUSE_PHONES.some((h) => digits(h) === digits(c.phone as string))
  if (isHouseNumber && !c.url) return false
  return true
}
