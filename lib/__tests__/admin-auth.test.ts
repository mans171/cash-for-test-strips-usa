import { describe, it, expect, afterEach } from 'vitest'
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
  // admin_credentials is a single-row table shared with real production
  // login — checkPassword always uses the most-recently-updated row, so
  // these tests INSERT a new row (which takes precedence during the test)
  // rather than deleting existing ones, and clean up only what they inserted
  // afterward. Never delete-all here: that would wipe the real seeded
  // password out from under production login on every test run.
  const insertedIds: string[] = []

  afterEach(async () => {
    if (insertedIds.length) {
      await supabaseAdmin.from('admin_credentials').delete().in('id', insertedIds)
      insertedIds.length = 0
    }
  })

  it('accepts whatever password is currently stored in admin_credentials, rejects others', async () => {
    const testHash = hashPassword('test-only-password-Task3')
    const { data } = await supabaseAdmin
      .from('admin_credentials')
      .insert({ password_hash: testHash })
      .select('id')
      .single()
    if (data) insertedIds.push(data.id)

    expect(await checkPassword('test-only-password-Task3')).toBe(true)
    expect(await checkPassword('definitely-wrong')).toBe(false)
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
