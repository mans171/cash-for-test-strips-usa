import { describe, it, expect } from 'vitest'
import { STATE_LABELS, VALID_STATE_CODES } from '@/lib/states'

describe('states', () => {
  it('has 50 states plus Canada', () => {
    expect(Object.keys(STATE_LABELS)).toHaveLength(51)
  })

  it('VALID_STATE_CODES matches STATE_LABELS keys', () => {
    expect(VALID_STATE_CODES.has('NY')).toBe(true)
    expect(VALID_STATE_CODES.has('CANADA')).toBe(true)
    expect(VALID_STATE_CODES.has('XX')).toBe(false)
  })
})
