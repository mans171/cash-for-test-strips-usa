import { describe, it, expect } from 'vitest'
import { buildQuoteMessage, buildBuyerEmail } from '@/lib/message-template'
import type { OrderItem } from '@/lib/types'

describe('buildQuoteMessage', () => {
  it('includes the fixed intro line with the customer name', () => {
    const message = buildQuoteMessage(
      [{ brand: 'OneTouch Verio', count: 3, expiration: '2027-01', condition: 'sealed' }],
      'Jane Doe'
    )
    expect(message).toContain(
      'Hi, this is Jane Doe. I got your information from cash4teststripsusa.com. You are my local buyer. Can you give me a quote for the items in my cart?'
    )
  })

  it('lists each item with brand, count, expiration, and condition', () => {
    const message = buildQuoteMessage(
      [
        { brand: 'OneTouch Verio', count: 3, expiration: '2027-01', condition: 'sealed' },
        { brand: 'FreeStyle Lite', count: 1, expiration: '2026-11', condition: 'unsealed' },
      ],
      'Jane Doe'
    )
    expect(message).toContain('- OneTouch Verio × 3 boxes (exp: 2027-01, sealed)')
    expect(message).toContain('- FreeStyle Lite × 1 box (exp: 2026-11, unsealed)')
  })

  it('opens with the customer name', () => {
    const message = buildQuoteMessage(
      [{ brand: 'OneTouch Verio', count: 3, expiration: '2027-01', condition: 'sealed' }],
      'Jane Doe'
    )
    expect(message).toContain('Jane Doe')
    expect(message.indexOf('Jane Doe')).toBeLessThan(message.indexOf('OneTouch Verio'))
  })
})

describe('buildBuyerEmail', () => {
  const items: OrderItem[] = [
    { brand: 'OneTouch Verio', count: 2, expiration: '2027-01', condition: 'sealed' },
  ]

  it('includes the customer name in the subject', () => {
    const { subject } = buildBuyerEmail(items, 'Jane Doe', undefined, undefined)
    expect(subject).toContain('Jane Doe')
  })

  it('includes item details in the html body', () => {
    const { html } = buildBuyerEmail(items, 'Jane Doe', undefined, undefined)
    expect(html).toContain('OneTouch Verio')
    expect(html).toContain('2027-01')
    expect(html).toContain('sealed')
  })

  it('includes phone and email when provided', () => {
    const { html } = buildBuyerEmail(items, 'Jane Doe', '5551234567', 'jane@example.com')
    expect(html).toContain('5551234567')
    expect(html).toContain('jane@example.com')
  })

  it('omits phone/email lines when not provided', () => {
    const { html } = buildBuyerEmail(items, 'Jane Doe', undefined, undefined)
    expect(html).not.toContain('Phone:')
    expect(html).not.toContain('Email:')
  })

  it('escapes html-unsafe characters in the customer name', () => {
    const { html } = buildBuyerEmail(items, '<script>alert(1)</script>', undefined, undefined)
    expect(html).not.toContain('<script>')
  })
})
