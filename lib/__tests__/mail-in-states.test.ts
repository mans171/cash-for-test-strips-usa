import { describe, it, expect } from 'vitest'
import { STATE_LABELS, MAIL_IN_STATE_LABELS, MAIL_IN_STATE_CODES } from '../states'

describe('mail-in ship-from states', () => {
  it('is the 50 states plus DC, without the CANADA pseudo-code', () => {
    expect(MAIL_IN_STATE_CODES.size).toBe(51)
    expect(MAIL_IN_STATE_LABELS.DC).toBe('District of Columbia')
    expect(MAIL_IN_STATE_CODES.has('CANADA')).toBe(false)
  })

  it('is sorted by name so DC sits between Delaware and Florida', () => {
    const names = Object.values(MAIL_IN_STATE_LABELS)
    expect(names.indexOf('District of Columbia')).toBe(names.indexOf('Delaware') + 1)
    expect(names.indexOf('Florida')).toBe(names.indexOf('District of Columbia') + 1)
  })

  it('never adds DC to the site-wide list, which would create a state page for it', () => {
    expect('DC' in STATE_LABELS).toBe(false)
  })
})
