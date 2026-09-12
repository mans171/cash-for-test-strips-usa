import type { Company } from './types'

/** Contacts are public since 2026-09-12 (the account gate was removed — nobody
 *  was creating accounts, and gated contact detail is content Google cannot
 *  see). This is the one place that decides "has a way to reach them". */
export function hasAnyContact(company: Pick<Company, 'url' | 'phone' | 'email'>): boolean {
  return !!(company.url || company.phone || company.email)
}
