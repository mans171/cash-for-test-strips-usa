import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// End to end through the real route handlers, against an in-memory database:
// request a reset -> token arrives by email -> set a new password -> log in.
vi.mock('@/lib/supabase-admin', async () => {
  const { fakeSupabaseAdmin } = await import('@/test/helpers/fake-admin-db')
  return { supabaseAdmin: fakeSupabaseAdmin }
})

const sentEmails: Array<{ to: string; subject: string; html: string }> = []
vi.mock('@/lib/email', () => ({
  sendEmail: async (message: { to: string; subject: string; html: string }) => {
    sentEmails.push(message)
  },
}))

import { fakeDb, resetFakeDb } from '@/test/helpers/fake-admin-db'
import { ADMIN_SESSION_COOKIE_NAME, hashPassword, isValidSession, requireAdmin } from '@/lib/admin-auth'
import { clearCredentialVersionCache } from '@/lib/admin-credential-version'
import { POST as login } from '../login/route'
import { POST as logout } from '../logout/route'
import { POST as forgotPassword } from '../forgot-password/route'
import { POST as resetPassword } from '../reset-password/route'

const SITE = 'http://localhost'
let ipCounter = 0

function post(path: string, body?: unknown, headers: Record<string, string> = {}) {
  return new Request(`${SITE}${path}`, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
    // A fresh address per request keeps the in-memory rate limiter out of the way.
    headers: { 'Content-Type': 'application/json', 'x-real-ip': `203.0.113.${++ipCounter}`, ...headers },
  })
}

function sessionFrom(response: Response): string {
  const setCookie = response.headers.get('set-cookie') ?? ''
  const match = setCookie.match(new RegExp(`${ADMIN_SESSION_COOKIE_NAME}=([^;]*)`))
  if (!match) throw new Error(`no session cookie in: ${setCookie}`)
  return decodeURIComponent(match[1])
}

beforeEach(() => {
  resetFakeDb()
  clearCredentialVersionCache()
  sentEmails.length = 0
  fakeDb.tick += 1000
  fakeDb.admin_credentials.push({
    id: '00000000-0000-4000-8000-999999999999',
    password_hash: hashPassword('original-password'),
    updated_at: new Date(fakeDb.tick).toISOString(),
  })
})

afterEach(() => vi.restoreAllMocks())

describe('login', () => {
  it('sets an httpOnly, SameSite=Lax, path=/ cookie with a 7-day max-age holding a valid session', async () => {
    const response = await login(post('/api/admin/login', { password: 'original-password' }))
    expect(response.status).toBe(200)

    const setCookie = (response.headers.get('set-cookie') ?? '').toLowerCase()
    expect(setCookie).toContain('httponly')
    expect(setCookie).toContain('samesite=lax')
    expect(setCookie).toContain('path=/')
    expect(setCookie).toContain(`max-age=${60 * 60 * 24 * 7}`)
    expect(await isValidSession(sessionFrom(response))).toBe(true)
  })

  it('marks the cookie Secure in production', async () => {
    vi.resetModules()
    vi.stubEnv('NODE_ENV', 'production')
    try {
      const { SESSION_COOKIE_OPTIONS } = await import('@/lib/admin-auth')
      expect(SESSION_COOKIE_OPTIONS.secure).toBe(true)
    } finally {
      vi.unstubAllEnvs()
      vi.resetModules()
    }
  })

  it('401 and no cookie for a wrong password, a missing password, or a non-JSON body', async () => {
    for (const request of [
      post('/api/admin/login', { password: 'wrong' }),
      post('/api/admin/login', {}),
      new Request(`${SITE}/api/admin/login`, { method: 'POST', body: '{not json', headers: { 'x-real-ip': '203.0.113.250' } }),
    ]) {
      const response = await login(request)
      expect(response.status).toBe(401)
      expect(response.headers.get('set-cookie')).toBeNull()
    }
  })

  it('403 from another origin, even with the right password; fine from our own', async () => {
    const cross = await login(post('/api/admin/login', { password: 'original-password' }, { origin: 'https://evil.example' }))
    expect(cross.status).toBe(403)
    expect(cross.headers.get('set-cookie')).toBeNull()

    const same = await login(post('/api/admin/login', { password: 'original-password' }, { origin: SITE }))
    expect(same.status).toBe(200)
  })

  it('still rate limits one address', async () => {
    const headers = { 'x-real-ip': '198.51.100.99' }
    let last = 0
    for (let i = 0; i < 11; i++) last = (await login(post('/api/admin/login', { password: 'wrong' }, headers))).status
    expect(last).toBe(429)
  })
})

describe('logout', () => {
  it('clears the session cookie with the same name, path and flags', async () => {
    const response = await logout(post('/api/admin/logout'))
    expect(response.status).toBe(200)

    const setCookie = (response.headers.get('set-cookie') ?? '').toLowerCase()
    expect(setCookie).toContain(`${ADMIN_SESSION_COOKIE_NAME}=;`)
    expect(setCookie).toContain('max-age=0')
    expect(setCookie).toContain('path=/')
    expect(setCookie).toContain('httponly')
    expect(setCookie).toContain('samesite=lax')
  })

  it('works with no session at all, and refuses a cross-site caller', async () => {
    expect((await logout(post('/api/admin/logout'))).status).toBe(200)
    expect((await logout(post('/api/admin/logout', undefined, { origin: 'https://evil.example' }))).status).toBe(403)
  })
})

describe('password reset, end to end', () => {
  it('request -> emailed token -> reset -> login; the reset kills every older session', async () => {
    // A session from before the reset (think: a stolen cookie).
    const oldSession = sessionFrom(await login(post('/api/admin/login', { password: 'original-password' })))
    const guarded = (session: string) =>
      requireAdmin(new Request(`${SITE}/api/admin/data`, { headers: { cookie: `${ADMIN_SESSION_COOKIE_NAME}=${session}` } }))
    expect(await guarded(oldSession)).toBeNull()

    // 1. Request the link.
    expect((await forgotPassword(post('/api/admin/forgot-password'))).status).toBe(200)
    expect(sentEmails).toHaveLength(1)
    const token = sentEmails[0].html.match(/\/admin\/reset\?token=([0-9a-f]{64})/)?.[1]
    expect(token).toBeTruthy()
    // Only the hash is stored.
    expect(JSON.stringify(fakeDb.admin_reset_tokens)).not.toContain(token!)

    // 2. Set the new password. No session and no Origin needed.
    const reset = await resetPassword(post('/api/admin/reset-password', { token, newPassword: 'brand-new-password' }))
    expect(reset.status).toBe(200)

    // 3. The old session is dead at once on this instance (cache cleared by the reset)...
    expect((await guarded(oldSession))?.status).toBe(401)
    // ...the old password no longer works...
    expect((await login(post('/api/admin/login', { password: 'original-password' }))).status).toBe(401)
    // ...and the new one does, yielding a session that passes the guard.
    const relogin = await login(post('/api/admin/login', { password: 'brand-new-password' }))
    expect(relogin.status).toBe(200)
    expect(await guarded(sessionFrom(relogin))).toBeNull()

    // 4. The link is single-use.
    const replay = await resetPassword(post('/api/admin/reset-password', { token, newPassword: 'attacker-password' }))
    expect(replay.status).toBe(400)
    expect((await login(post('/api/admin/login', { password: 'attacker-password' }))).status).toBe(401)
  })

  it('forgot-password and reset-password refuse a cross-site caller', async () => {
    const origin = 'https://evil.example'
    expect((await forgotPassword(post('/api/admin/forgot-password', undefined, { origin }))).status).toBe(403)
    expect(sentEmails).toHaveLength(0)
    expect((await resetPassword(post('/api/admin/reset-password', { token: 'x', newPassword: 'long-enough' }, { origin }))).status).toBe(403)
  })
})
