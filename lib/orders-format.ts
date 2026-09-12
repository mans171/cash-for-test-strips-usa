import type { OrderItem } from './types'

/** Pure presentation helpers for /orders. Kept out of the page so they can be
 *  unit-tested without a Supabase session or a React renderer. */

/** "3 × Dexcom G7 sensors · 2 × OneTouch Verio".
 *  A lead's `items` column is nullable (bulk enquiries carry none) and rows
 *  written before the product catalog settled can hold a blank brand, so both
 *  cases fall back rather than rendering a bare count. A count that is
 *  missing or not a number renders as "?" rather than "NaN"/"undefined". */
export function summarizeItems(items: OrderItem[] | null): string {
  if (!items || items.length === 0) return 'No items listed'
  const parts = items
    .filter((i) => typeof i?.brand === 'string' && i.brand.trim().length > 0)
    .map((i) => `${Number.isFinite(i.count) ? i.count : '?'} × ${i.brand.trim()}`)
  return parts.length > 0 ? parts.join(' · ') : 'No items listed'
}

/** Which form the lead came from. The bulk enquiry has no item list, so the
 *  source page is the only reliable signal. */
export function orderKind(lead: { items: unknown; source_page: string | null }): 'quote' | 'bulk' {
  return lead.source_page === '/sell-test-strips-in-bulk' ? 'bulk' : 'quote'
}
