import { OWNER_EMAIL, HOUSE_EMAILS } from '@/lib/owner'
import type { Company } from '@/lib/types'

/** The columns bulk routing needs from a `companies` row. `active` is a real
 *  column but is not on the public `Company` type (the public reads are already
 *  filtered to active rows), so it is declared here rather than Pick-ed. */
export type BulkRoutingCompany = Pick<Company, 'states' | 'email' | 'name' | 'slug'> & {
  active?: boolean | null
  mail_in?: boolean | null
}

export type BulkRecipient = {
  to: string
  cc: string | null
  buyerName: string | null
}

/** True when the address is one of ours, so it is not a dedicated buyer inbox. */
export function isHouseEmail(email: string): boolean {
  const needle = email.trim().toLowerCase()
  return HOUSE_EMAILS.some((house) => house.toLowerCase() === needle)
}

function findBuyer(
  stateCode: string,
  companies: BulkRoutingCompany[],
): BulkRoutingCompany | null {
  const code = stateCode.trim().toUpperCase()
  if (!code) return null
  const qualifying = companies.filter((company) => {
    if (company.active === false) return false
    if (company.mail_in) return false
    const email = company.email?.trim()
    if (!email || isHouseEmail(email)) return false
    return (company.states ?? []).some((s) => s.trim().toUpperCase() === code)
  })
  if (qualifying.length === 0) return null
  // Several buyers can cover one state. Whichever row Postgres happened to
  // return first is not a decision, so sort by name: the same state always
  // routes to the same buyer, and a caller can predict which.
  return [...qualifying].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))[0]
}

/** Who a bulk inquiry from `stateCode` should go to: the state's dedicated
 *  buyer (cc the house) or, when there isn't one, the house alone. */
export function pickBulkRecipient(
  stateCode: string,
  companies: BulkRoutingCompany[],
): BulkRecipient {
  const buyer = findBuyer(stateCode, companies)
  if (!buyer) return { to: OWNER_EMAIL, cc: null, buyerName: null }
  return { to: buyer.email!.trim(), cc: OWNER_EMAIL, buyerName: buyer.name }
}

/** Same predicate as pickBulkRecipient, for copy that needs to know. */
export function hasDedicatedBulkBuyer(
  stateCode: string,
  companies: BulkRoutingCompany[],
): boolean {
  return findBuyer(stateCode, companies) !== null
}
