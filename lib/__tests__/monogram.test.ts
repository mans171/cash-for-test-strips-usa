import { describe, it, expect } from 'vitest'
import { monogramFromName } from '@/lib/monogram'

describe('monogramFromName', () => {
  it('takes first letters of first two words', () => {
    expect(monogramFromName('Cash For Test Strips Indiana').initials).toBe('CF')
  })
  it('single word gives first two letters', () => {
    expect(monogramFromName('Melissa').initials).toBe('ME')
  })
  it('is deterministic: same name, same tint', () => {
    expect(monogramFromName('864 Medex - Greenville, SC').tintClass)
      .toBe(monogramFromName('864 Medex - Greenville, SC').tintClass)
  })
  it('tintClass is one of the known tints', () => {
    const known = ['bg-teal-100 text-teal-800','bg-sky-100 text-sky-800','bg-amber-100 text-amber-800','bg-violet-100 text-violet-800','bg-rose-100 text-rose-800']
    expect(known).toContain(monogramFromName('Jerome Jones').tintClass)
  })
})
