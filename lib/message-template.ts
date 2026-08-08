import type { OrderItem } from './types'
import { escapeHtml } from './email'

export function buildQuoteMessage(items: OrderItem[], customerName: string): string {
  const itemLines = items
    .map(
      (item) =>
        `- ${item.brand} × ${item.count} box${item.count === 1 ? '' : 'es'} (exp: ${item.expiration}, ${item.condition})`
    )
    .join('\n')

  return `Hi, this is ${customerName}. I got your information from cash4teststripsusa.com. You are my local buyer. Can you give me a quote for the items in my cart?\n\n${itemLines}`
}

export function buildBuyerEmail(
  items: OrderItem[],
  customerName: string,
  customerPhone: string | undefined,
  customerEmail: string | undefined
): { subject: string; html: string } {
  const itemRows = items
    .map(
      (item) =>
        `<li>${escapeHtml(item.brand)} × ${item.count} box${item.count === 1 ? '' : 'es'} (exp: ${escapeHtml(item.expiration)}, ${escapeHtml(item.condition)})</li>`
    )
    .join('')

  const contactLines = [
    `<p><strong>Name:</strong> ${escapeHtml(customerName)}</p>`,
    customerPhone ? `<p><strong>Phone:</strong> ${escapeHtml(customerPhone)}</p>` : '',
    customerEmail ? `<p><strong>Email:</strong> ${escapeHtml(customerEmail)}</p>` : '',
  ].join('')

  const html = `
    <p>New quote request from cash4teststripsusa.com:</p>
    ${contactLines}
    <p><strong>Items:</strong></p>
    <ul>${itemRows}</ul>
  `

  return {
    subject: `New quote request from ${customerName} — cash4teststripsusa.com`,
    html,
  }
}
