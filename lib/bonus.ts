import type { Company } from './types'
import { HOUSE_PHONES } from './owner'

const digits = (s: string) => s.replace(/\D/g, '')

export const BONUS_MENTION_COPY = 'Mention Cash For Test Strips USA when you call or text for a $10 bonus on your order.'
export const BONUS_FORM_COPY = 'Complete this form and get a $10 bonus on your order.'

/** The bonus is paid by the buyer, and no third-party buyer has agreed to it.
 *  So it is only advertised where the call reaches the house — a listing on
 *  one of our own numbers, or the mail-in listing. Decided 2026-09-12. */
export function honorsBonus(c: Pick<Company, 'phone' | 'mail_in' | 'slug'>): boolean {
  if (c.mail_in) return true
  if (!c.phone) return false
  const d = digits(c.phone)
  return HOUSE_PHONES.some((h) => digits(h) === d)
}
