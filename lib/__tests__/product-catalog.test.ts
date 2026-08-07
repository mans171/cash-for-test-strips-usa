import { describe, it, expect } from 'vitest'
import { existsSync } from 'fs'
import { join } from 'path'
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
      for (const line of brand.lines) {
        expect(line.label.length).toBeGreaterThan(0)
        expect(line.image.length).toBeGreaterThan(0)
        if (line.code !== undefined) {
          expect(line.code.length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('every line image file exists in public/', () => {
    for (const brand of PRODUCT_BRANDS) {
      for (const line of brand.lines) {
        const filePath = join(process.cwd(), 'public', line.image)
        expect(existsSync(filePath), `missing file for ${brand.label} — ${line.label}: ${line.image}`).toBe(true)
      }
    }
  })

  it('has unique key+category pairs', () => {
    const identities = PRODUCT_BRANDS.map((b) => `${b.category}:${b.key}`)
    expect(new Set(identities).size).toBe(identities.length)
  })

  it('Dexcom has exactly 3 verified REF-coded lines out of 6 total', () => {
    const dexcom = PRODUCT_BRANDS.find((b) => b.key === 'dexcom' && b.category === 'CGM')!
    expect(dexcom.lines).toHaveLength(6)
    const coded = dexcom.lines.filter((l) => l.code)
    expect(coded.map((l) => l.label)).toEqual(['G6 Sensors', 'G7 10 Day Sensors', 'G7 15 Day Sensors'])
    expect(coded.map((l) => l.code)).toEqual([
      'STS-OE-001 / STS-OR-001',
      'STP-AT-011 / -012 / -018',
      'STP-FT-010 / -012',
    ])
  })
})
