import { describe, it, expect } from 'vitest'
import { checkPassword, signSession, isValidSession } from '@/lib/admin-auth'

describe('admin-auth', () => {
  it('checkPassword accepts the configured password and rejects others', () => {
    expect(checkPassword(process.env.ADMIN_PASSWORD!)).toBe(true)
    expect(checkPassword('definitely-wrong')).toBe(false)
  })

  it('a freshly signed session is valid', () => {
    const session = signSession()
    expect(isValidSession(session)).toBe(true)
  })

  it('a tampered or missing session is invalid', () => {
    expect(isValidSession(undefined)).toBe(false)
    expect(isValidSession('admin-authenticated.tampered-signature')).toBe(false)
  })
})
