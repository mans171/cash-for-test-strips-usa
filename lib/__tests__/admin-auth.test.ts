import { describe, it, expect, afterEach } from 'vitest'
import crypto from 'crypto'
import {
  checkPassword,
  hashPassword,
  verifyPassword,
  signSession,
  isValidSession,
  createResetToken,
  verifyResetToken,
  consumeResetToken,
} from '@/lib/admin-auth'
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

describe('reset token lifecycle', () => {
  // consumeResetToken inserts a new admin_credentials row as a side effect
  // (single-row table shared with real production login — see Task 3's note
  // in the checkPassword tests above). Any test here that calls it records a
  // "before" timestamp and deletes rows inserted after it in cleanup, so the
  // real seeded row is once again the most-recently-updated one once the
  // test ends, instead of permanently overwriting the real admin password.
  const createdAfter: string[] = []

  afterEach(async () => {
    for (const ts of createdAfter) {
      await supabaseAdmin.from('admin_credentials').delete().gt('updated_at', ts)
    }
    createdAfter.length = 0
  })

  it('a freshly created token verifies as valid', async () => {
    const token = await createResetToken()
    expect(await verifyResetToken(token)).toBe(true)
  })

  it('an unknown token does not verify', async () => {
    expect(await verifyResetToken('not-a-real-token')).toBe(false)
  })

  it('consumeResetToken updates the password and checkPassword reflects it', async () => {
    const before = new Date().toISOString()
    createdAfter.push(before)
    const token = await createResetToken()
    await consumeResetToken(token, 'brand-new-password-Task4')
    expect(await checkPassword('brand-new-password-Task4')).toBe(true)
  })

  it('a token cannot be consumed twice', async () => {
    const before = new Date().toISOString()
    createdAfter.push(before)
    const token = await createResetToken()
    await consumeResetToken(token, 'first-use-password-Task4')
    await expect(consumeResetToken(token, 'second-use-password-Task4')).rejects.toThrow()
  })

  it('an expired token cannot be consumed', async () => {
    const token = await createResetToken()
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    await supabaseAdmin
      .from('admin_reset_tokens')
      .update({ expires_at: new Date(Date.now() - 1000).toISOString() })
      .eq('token_hash', tokenHash)
    await expect(consumeResetToken(token, 'should-not-work')).rejects.toThrow()
  })
})
