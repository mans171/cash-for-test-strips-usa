/** The seller status page's ONE door into mail_in_orders — server only.
 *
 *  It uses the service role (the table has RLS on and no policies), so the
 *  whole safety of /kit/<token> rests on two things here: the token must be
 *  well-formed before the database is asked anything, and what comes back is
 *  toSellerView's field-by-field projection, never the row. */

import { supabaseAdmin } from '@/lib/supabase-admin'
import { toSellerView, type MailInOrder, type SellerView } from '@/lib/mail-in'

export const TOKEN_PATTERN = /^[0-9a-f]{64}$/

export async function loadSellerView(token: string): Promise<SellerView | null> {
  if (!TOKEN_PATTERN.test(token)) return null
  const { data, error } = await supabaseAdmin.from('mail_in_orders').select('*').eq('token', token).maybeSingle()
  if (error) throw new Error(`kit lookup failed: ${error.message}`)
  if (!data) return null
  const order = data as MailInOrder
  // A closed kit's link stops working, like an unknown one.
  if (order.status === 'closed') return null
  return toSellerView(order)
}
