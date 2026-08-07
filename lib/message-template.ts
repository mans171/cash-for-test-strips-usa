import type { OrderItem } from './types'

export function buildQuoteMessage(items: OrderItem[], customerName: string): string {
  const itemLines = items
    .map(
      (item) =>
        `- ${item.brand} × ${item.count} box${item.count === 1 ? '' : 'es'} (exp: ${item.expiration}, ${item.condition})`
    )
    .join('\n')

  return `Hi, this is ${customerName}. I got your information from cash4teststripsusa.com. You are my local buyer. Can you give me a quote for the items in my cart?\n\n${itemLines}`
}
