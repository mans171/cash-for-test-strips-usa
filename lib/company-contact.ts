import type { Company } from './types'

// Strips buyer contact fields for a request that hasn't authenticated yet.
// hasContact preserves whether the underlying buyer has any contact method
// at all, without revealing which one, so callers can still render a
// "log in to see this" prompt instead of treating the buyer as contact-less.
export function stripCompanyContact(company: Company): Company {
  const hasContact = !!(company.email || company.phone || company.url)
  return { ...company, email: null, phone: null, url: null, hasContact }
}

// Whether a company has any contact method to show — real fields for an
// authenticated request, or the hasContact flag stripCompanyContact() left
// behind for an anonymous one. Deliberately lives in a plain module (not
// UnlockContact.tsx, which is "use client"): Next's RSC boundary turns every
// export of a "use client" file into an opaque client reference, so a server
// component (e.g. BuyerCard) cannot call a function like this if it's
// defined there — it can only render the file's components as JSX.
export function hasAnyContact(company: Company): boolean {
  return !!(company.url || company.phone || company.hasContact)
}
