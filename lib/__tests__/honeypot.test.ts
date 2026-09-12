import { describe, it, expect } from 'vitest'
import { isHoneypotTripped, HONEYPOT_FIELD } from '@/lib/honeypot'

describe('isHoneypotTripped', () => {
  it('empty or missing → not tripped', () => {
    expect(isHoneypotTripped({})).toBe(false)
    expect(isHoneypotTripped({ [HONEYPOT_FIELD]: '' })).toBe(false)
    expect(isHoneypotTripped(null)).toBe(false)
  })

  it('whitespace only → not tripped', () => {
    expect(isHoneypotTripped({ [HONEYPOT_FIELD]: '   ' })).toBe(false)
  })

  it('a non-string value → not tripped, so a broken client cannot lock a seller out', () => {
    expect(isHoneypotTripped({ [HONEYPOT_FIELD]: 1 })).toBe(false)
    expect(isHoneypotTripped('not an object')).toBe(false)
    expect(isHoneypotTripped(undefined)).toBe(false)
  })

  it('filled → tripped', () => {
    expect(isHoneypotTripped({ [HONEYPOT_FIELD]: 'http://spam' })).toBe(true)
  })
})
