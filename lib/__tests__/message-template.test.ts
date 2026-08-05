import { describe, it, expect } from 'vitest'
import { buildQuoteMessage } from '@/lib/message-template'

describe('buildQuoteMessage', () => {
  it('includes the fixed intro line', () => {
    const message = buildQuoteMessage([
      { brand: 'OneTouch Verio', count: 3, expiration: '2027-01', condition: 'sealed' },
    ])
    expect(message).toContain(
      'I got your information from cash4teststripsusa.com. You are my local buyer. Can you give me a quote for the items in my cart?'
    )
  })

  it('lists each item with brand, count, expiration, and condition', () => {
    const message = buildQuoteMessage([
      { brand: 'OneTouch Verio', count: 3, expiration: '2027-01', condition: 'sealed' },
      { brand: 'FreeStyle Lite', count: 1, expiration: '2026-11', condition: 'unsealed' },
    ])
    expect(message).toContain('- OneTouch Verio × 3 boxes (exp: 2027-01, sealed)')
    expect(message).toContain('- FreeStyle Lite × 1 box (exp: 2026-11, unsealed)')
  })
})
