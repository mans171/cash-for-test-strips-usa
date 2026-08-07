import { describe, it, expect } from 'vitest'
import { PRODUCT_BRANDS } from '@/lib/product-catalog'

describe('PRODUCT_BRANDS', () => {
  it('has 15 brands, each with a non-empty label, image, and at least one product line', () => {
    expect(PRODUCT_BRANDS).toHaveLength(15)
    for (const brand of PRODUCT_BRANDS) {
      expect(brand.key.length).toBeGreaterThan(0)
      expect(brand.label.length).toBeGreaterThan(0)
      expect(brand.image.length).toBeGreaterThan(0)
      expect(brand.lines.length).toBeGreaterThan(0)
      expect(['Test Strips', 'CGM', 'Infusion Sets', 'Lancets']).toContain(brand.category)
    }
  })

  it('has unique key+category pairs', () => {
    const identities = PRODUCT_BRANDS.map((b) => `${b.category}:${b.key}`)
    expect(new Set(identities).size).toBe(identities.length)
  })
})
