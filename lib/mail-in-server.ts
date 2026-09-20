/** Mail-in kits — server-side helpers shared by the admin label routes.
 *  Imports the mailer, so it must never be pulled into a client component. */

import { sendEmail, escapeHtml } from '@/lib/email'
import { OWNER_PHONE } from '@/lib/owner'
import { hasActiveLabel, labelReadyText, sellerLinkPath, type MailInOrder } from '@/lib/mail-in'

export const SITE_URL = 'https://cash4teststripsusa.com'

export function sellerLink(token: string): string {
  return `${SITE_URL}${sellerLinkPath(token)}`
}

/** The text an admin sends the seller. Carries the link and nothing else —
 *  never an amount. */
export function sellerLinkText(order: Pick<MailInOrder, 'token' | 'order_number' | 'easypost_shipment_id' | 'label_refund_status'>): string {
  const link = sellerLink(order.token)
  return hasActiveLabel(order) ? labelReadyText(link) : `Here is the status page for your mail-in kit ${order.order_number}: ${link}`
}

/** Email the seller their link. Returns false when there is no address.
 *  sendEmail swallows its own failures, so this never throws. */
export async function emailSellerLink(order: MailInOrder): Promise<boolean> {
  if (!order.email) return false
  const link = sellerLink(order.token)
  const ready = hasActiveLabel(order)
  await sendEmail({
    to: order.email,
    subject: ready ? `Your prepaid shipping label is ready (${order.order_number})` : `Your mail-in kit ${order.order_number}`,
    html: [
      '<p>Hi' + (order.name ? ' ' + escapeHtml(order.name.trim().split(/\s+/)[0]) : '') + ',</p>',
      ready
        ? '<p>Your prepaid shipping label for kit <strong>' + escapeHtml(order.order_number) + '</strong> is ready. Open this page to print it and to follow your kit:</p>'
        : '<p>You can follow your mail-in kit <strong>' + escapeHtml(order.order_number) + '</strong> on this page:</p>',
      '<p><a href="' + escapeHtml(link) + '">' + escapeHtml(link) + '</a></p>',
      '<p>Keep every box sealed, pad the gaps so nothing rattles, tape all the seams, and send one kit per shipment.</p>',
      '<p>Questions? Call or text ' + escapeHtml(OWNER_PHONE) + '.</p>',
      '<p>Cash For Test Strips USA</p>',
    ].join('\n'),
  })
  return true
}
