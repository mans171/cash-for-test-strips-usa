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
  // tightly-bounded [before, after] window around its own write and deletes
  // only rows inserted inside that window in cleanup, so the real seeded row
  // is once again the most-recently-updated one once the test ends, instead
  // of permanently overwriting the real admin password. The window must be
  // bounded on both sides (not just `.gt('updated_at', before)`) because
  // Vitest can run test files in parallel — an open-ended delete could wipe
  // out a row written concurrently by a different test file (e.g. the
  // reset-password route test), or a real password reset performed by a
  // human while the suite happens to be running.
  const cleanupWindows: Array<{ before: string; after: string }> = []

  afterEach(async () => {
    for (const { before, after } of cleanupWindows) {
      await supabaseAdmin.from('admin_credentials').delete().gt('updated_at', before).lte('updated_at', after)
    }
    cleanupWindows.length = 0
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
    const token = await createResetToken()
    await consumeResetToken(token, 'brand-new-password-Task4')
    const after = new Date().toISOString()
    cleanupWindows.push({ before, after })
    expect(await checkPassword('brand-new-password-Task4')).toBe(true)
  })

  it('a token cannot be consumed twice', async () => {
    const before = new Date().toISOString()
    const token = await createResetToken()
    await consumeResetToken(token, 'first-use-password-Task4')
    const after = new Date().toISOString()
    cleanupWindows.push({ before, after })
    await expect(consumeResetToken(token, 'second-use-password-Task4')).rejects.toThrow()
  })

  it('two concurrent consume attempts with the same token: exactly one succeeds', async () => {
    const before = new Date().toISOString()
    const token = await createResetToken()

    const results = await Promise.allSettled([
      consumeResetToken(token, 'concurrent-a-Task4'),
      consumeResetToken(token, 'concurrent-b-Task4'),
    ])
    const after = new Date().toISOString()
    cleanupWindows.push({ before, after })

    const fulfilled = results.filter((r) => r.status === 'fulfilled')
    const rejected = results.filter((r) => r.status === 'rejected')
    expect(fulfilled).toHaveLength(1)
    expect(rejected).toHaveLength(1)
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
