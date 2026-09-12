import { describe, it, expect } from 'vitest'
import { hasAnyContact } from '@/lib/company-contact'

const base = { url: null, phone: null, email: null }
describe('hasAnyContact', () => {
  it('is true for any single contact method', () => {
    expect(hasAnyContact({ ...base, phone: '518-278-6008' })).toBe(true)
    expect(hasAnyContact({ ...base, url: 'https://x.com' })).toBe(true)
    expect(hasAnyContact({ ...base, email: 'a@b.c' })).toBe(true)
  })
  it('is false with none', () => {
    expect(hasAnyContact(base)).toBe(false)
  })
})
