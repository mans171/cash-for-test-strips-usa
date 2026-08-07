import { describe, it, expect } from 'vitest'
import { PRODUCT_BRANDS } from '@/lib/product-catalog'

describe('PRODUCT_BRANDS', () => {
  it('has 9 brands, each with a non-empty label, image, and at least one product line', () => {
    expect(PRODUCT_BRANDS).toHaveLength(9)
    for (const brand of PRODUCT_BRANDS) {
      expect(brand.key.length).toBeGreaterThan(0)
      expect(brand.label.length).toBeGreaterThan(0)
      expect(brand.image.length).toBeGreaterThan(0)
      expect(brand.lines.length).toBeGreaterThan(0)
      expect(['Test Strips', 'CGM', 'Infusion Sets']).toContain(brand.category)
    }
  })

  it('has unique brand keys', () => {
    const keys = PRODUCT_BRANDS.map((b) => b.key)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
