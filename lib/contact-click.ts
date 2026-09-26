import { HOUSE_PHONES, PUBLIC_EMAIL } from '@/lib/owner'
import type { ContactMethod, ContactTarget } from '@/lib/data-layer'

/**
 * Which contact link a click landed on, for the `contact_click` event.
 *
 * The site has call, text and email links in two dozen places, most of them
 * in server components (blog posts, city pages, the footer, every buyer card).
 * Rather than convert each to a client component, one delegated listener on
 * the document (app/components/GtmLoader.tsx) passes every clicked href
 * through this function. A link added next month is counted with no extra
 * work, which is the failure a sister site hit: seven raw phone links shipped
 * untracked, including the header and footer, and nobody noticed because an
 * untracked link still works perfectly for the visitor.
 *
 * Only the method and whether the number is ours or a listed buyer's leave
 * this function. The number or address itself never does.
 */

const HOUSE_DIGITS = new Set(HOUSE_PHONES.map((p) => p.replace(/\D/g, '')))
// PUBLIC_EMAIL only. OWNER_EMAIL is a personal address and this module ships in
// the browser bundle, so importing it here would publish it.
const HOUSE_ADDRESSES = new Set([PUBLIC_EMAIL.toLowerCase()])

function lastTenDigits(value: string): string {
  const digits = value.replace(/\D/g, '')
  return digits.length > 10 ? digits.slice(-10) : digits
}

export function classifyContactHref(href: string | null | undefined): { method: ContactMethod; target: ContactTarget } | null {
  if (!href) return null
  const trimmed = href.trim()
  const lower = trimmed.toLowerCase()

  if (lower.startsWith('tel:') || lower.startsWith('sms:')) {
    const number = trimmed.slice(4).split('?')[0]
    return {
      method: lower.startsWith('tel:') ? 'call' : 'text',
      target: HOUSE_DIGITS.has(lastTenDigits(number)) ? 'house' : 'buyer',
    }
  }
  if (lower.startsWith('mailto:')) {
    const address = decodeURIComponent(trimmed.slice(7).split('?')[0]).toLowerCase()
    return { method: 'email', target: HOUSE_ADDRESSES.has(address) ? 'house' : 'buyer' }
  }
  // Outbound buyer websites all go through the click logger (see CLAUDE.md).
  if (lower.startsWith('/api/track?') || /^https?:\/\/[^/]+\/api\/track\?/.test(lower)) {
    return { method: 'website', target: 'buyer' }
  }
  return null
}
