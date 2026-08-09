import type { Company } from './types'

// Strips buyer contact fields for a request that hasn't authenticated yet.
// hasContact preserves whether the underlying buyer has any contact method
// at all, without revealing which one, so callers can still render a
// "log in to see this" prompt instead of treating the buyer as contact-less.
export function stripCompanyContact(company: Company): Company {
  const hasContact = !!(company.email || company.phone || company.url)
  return { ...company, email: null, phone: null, url: null, hasContact }
}
