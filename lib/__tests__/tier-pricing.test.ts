import { describe, it, expect } from 'vitest'
import { TEST_STRIP_TIERS, CGM_TIERS } from '@/lib/tier-pricing'

describe('tier-pricing data', () => {
  const allRows = [...TEST_STRIP_TIERS, ...CGM_TIERS]

  it('every row has a valid tier', () => {
    for (const row of allRows) {
      expect(['top', 'mid', 'lower']).toContain(row.tier)
    }
  })

  it('every row has a non-empty brand name and note', () => {
    for (const row of allRows) {
      expect(row.brand.length).toBeGreaterThan(0)
      expect(row.note.length).toBeGreaterThan(0)
    }
  })

  it('has no duplicate brand names within a single list', () => {
    const testStripNames = TEST_STRIP_TIERS.map((r) => r.brand)
    expect(new Set(testStripNames).size).toBe(testStripNames.length)
    const cgmNames = CGM_TIERS.map((r) => r.brand)
    expect(new Set(cgmNames).size).toBe(cgmNames.length)
  })

  it('no row text mentions a dollar sign — the whole point of this data', () => {
    for (const row of allRows) {
      expect(row.brand).not.toMatch(/\$/)
      expect(row.note).not.toMatch(/\$/)
    }
  })
})
