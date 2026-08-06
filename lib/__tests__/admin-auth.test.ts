import { describe, it, expect } from 'vitest'
import { checkPassword, hashPassword, verifyPassword, signSession, isValidSession } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

describe('hashPassword / verifyPassword', () => {
  it('a password verifies against its own hash', () => {
    const hash = hashPassword('correct-horse-battery-staple')
    expect(verifyPassword('correct-horse-battery-staple', hash)).toBe(true)
  })

  it('a wrong password does not verify', () => {
    const hash = hashPassword('correct-horse-battery-staple')
    expect(verifyPassword('wrong-password', hash)).toBe(false)
  })

  it('a malformed stored hash does not verify (no crash)', () => {
    expect(verifyPassword('anything', 'not-a-valid-hash')).toBe(false)
  })
})

describe('checkPassword (DB-backed)', () => {
  it('accepts whatever password is currently stored in admin_credentials, rejects others', async () => {
    const testHash = hashPassword('test-only-password-Task3')
    await supabaseAdmin.from('admin_credentials').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('admin_credentials').insert({ password_hash: testHash })

    expect(await checkPassword('test-only-password-Task3')).toBe(true)
    expect(await checkPassword('definitely-wrong')).toBe(false)
  })

  it('rejects everything if no row exists in admin_credentials', async () => {
    await supabaseAdmin.from('admin_credentials').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    expect(await checkPassword('anything')).toBe(false)
  })
})

describe('sessions (unchanged behavior)', () => {
  it('a freshly signed session is valid', () => {
    const session = signSession()
    expect(isValidSession(session)).toBe(true)
  })

  it('a tampered or missing session is invalid', () => {
    expect(isValidSession(undefined)).toBe(false)
    expect(isValidSession('admin-authenticated.tampered-signature')).toBe(false)
  })

  it('a session with no dot or extra dots is invalid', () => {
    expect(isValidSession('admin-authenticated')).toBe(false)
    expect(isValidSession('admin-authenticated.sig.extra')).toBe(false)
  })
})
