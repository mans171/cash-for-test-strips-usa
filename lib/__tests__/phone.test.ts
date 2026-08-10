import { describe, it, expect } from 'vitest'
import { normalizePhone } from '@/lib/phone'

describe('normalizePhone', () => {
  it('strips formatting characters down to digits only', () => {
    expect(normalizePhone('(555) 999-0301')).toBe('5559990301')
  })

  it('leaves an already-normalized number unchanged', () => {
    expect(normalizePhone('5559990301')).toBe('5559990301')
  })

  it('returns an empty string for an empty input', () => {
    expect(normalizePhone('')).toBe('')
  })
})
