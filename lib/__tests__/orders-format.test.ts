import { describe, it, expect } from 'vitest'
import { summarizeItems, orderKind } from '@/lib/orders-format'
import type { OrderItem } from '@/lib/types'

const item = (brand: string, count: number): OrderItem => ({
  brand,
  count,
  expiration: '2027-06',
  condition: 'sealed',
})

describe('summarizeItems', () => {
  it('joins count and brand with a middot', () => {
    expect(
      summarizeItems([item('Dexcom G7 sensors', 3), item('OneTouch Verio', 2)])
    ).toBe('3 × Dexcom G7 sensors · 2 × OneTouch Verio')
  })

  it('handles a single item', () => {
    expect(summarizeItems([item('FreeStyle Libre 3', 1)])).toBe('1 × FreeStyle Libre 3')
  })

  it('falls back when the list is null or empty', () => {
    expect(summarizeItems(null)).toBe('No items listed')
    expect(summarizeItems([])).toBe('No items listed')
  })

  it('skips entries with no brand rather than printing a bare count', () => {
    expect(summarizeItems([item('', 4), item('Contour Next', 1)])).toBe('1 × Contour Next')
    expect(summarizeItems([item('   ', 4)])).toBe('No items listed')
  })
})

describe('orderKind', () => {
  it('is bulk for the bulk enquiry page', () => {
    expect(orderKind({ items: null, source_page: '/sell-test-strips-in-bulk' })).toBe('bulk')
  })

  it('is quote for the sell flow', () => {
    expect(orderKind({ items: [item('Dexcom G7 sensors', 3)], source_page: '/sell' })).toBe('quote')
  })

  it('is quote when the source page is unknown', () => {
    expect(orderKind({ items: null, source_page: null })).toBe('quote')
  })
})
