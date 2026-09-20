import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import crypto from 'crypto'

// No database: the service-role client is an in-memory fake.
vi.mock('@/lib/supabase-admin', async () => {
  const { fakeSupabaseAdmin } = await import('@/test/helpers/fake-admin-db')
  return { supabaseAdmin: fakeSupabaseAdmin }
})

import { fakeDb, resetFakeDb } from '@/test/helpers/fake-admin-db'
import {
  ADMIN_SESSION_COOKIE_NAME,
  buildSession,
  checkSameOrigin,
  getClientIp,
  hashPassword,
  isValidSession,
  requireAdmin,
  signSession,
} from '@/lib/admin-auth'
import {
  CREDENTIAL_VERSION_CACHE_MS,
  clearCredentialVersionCache,
  getCredentialVersion,
} from '@/lib/admin-credential-version'

const DAY_MS = 24 * 60 * 60 * 1000

function seedCredential(password = 'first-password') {
  fakeDb.tick += 1000
  fakeDb.admin_credentials.push({
    id: `00000000-0000-4000-8000-${String(fakeDb.nextId++).padStart(12, '0')}`,
    password_hash: hashPassword(password),
    updated_at: new Date(fakeDb.tick).toISOString(),
  })
}

function hmac(payload: string, secret = process.env.ADMIN_SESSION_SECRET!) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

beforeEach(() => {
  resetFakeDb()
  clearCredentialVersionCache()
  seedCredential()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('session format', () => {
  it('is v2.<issuedAtMs>.<nonce>.<credentialVersion>.<hmac>, unique per login, and carries no password material', async () => {
    const a = await signSession()
    const b = await signSession()
    expect(a).toMatch(/^v2\.\d{13}\.[0-9a-f]{32}\.[0-9a-f]{32}\.[0-9a-f]{64}$/)
    expect(a).not.toBe(b)

    const [, , , version] = a.split('.')
    const row = fakeDb.admin_credentials[0]
    expect(version).toBe(await getCredentialVersion())
    expect(String(row.password_hash)).not.toContain(version)
  })
})

describe('isValidSession', () => {
  it('accepts a freshly issued session', async () => {
    expect(await isValidSession(await signSession())).toBe(true)
  })

  it('rejects a missing or empty cookie without touching the database', async () => {
    expect(await isValidSession(undefined)).toBe(false)
    expect(await isValidSession('')).toBe(false)
    expect(fakeDb.credentialReads).toBe(0)
  })

  it('accepts a session just inside 7 days and rejects one just past it', async () => {
    const version = await getCredentialVersion()
    expect(await isValidSession(buildSession(version, Date.now() - (7 * DAY_MS - 60_000)))).toBe(true)
    expect(await isValidSession(buildSession(version, Date.now() - (7 * DAY_MS + 60_000)))).toBe(false)
  })

  it('rejects a session that outlives 7 days even though its signature is still good', async () => {
    const session = await signSession()
    vi.useFakeTimers()
    vi.setSystemTime(Date.now() + 8 * DAY_MS)
    clearCredentialVersionCache()
    expect(await isValidSession(session)).toBe(false)
  })

  it('rejects a session issued in the future', async () => {
    const version = await getCredentialVersion()
    expect(await isValidSession(buildSession(version, Date.now() + 10 * 60_000))).toBe(false)
  })

  it('rejects every kind of tampering, before the database is read', async () => {
    const session = await signSession()
    const [format, issuedAt, nonce, version, signature] = session.split('.')
    fakeDb.credentialReads = 0

    const tampered = [
      `${session}x`,
      `${format}.${Number(issuedAt) + 1}.${nonce}.${version}.${signature}`, // push the clock forward
      `${format}.${issuedAt}.${'0'.repeat(32)}.${version}.${signature}`,
      `${format}.${issuedAt}.${nonce}.${'0'.repeat(32)}.${signature}`,
      `${format}.${issuedAt}.${nonce}.${version}.${'0'.repeat(64)}`,
      `${format}.${issuedAt}.${nonce}.${version}`,
      `v3.${issuedAt}.${nonce}.${version}.${signature}`,
    ]
    for (const value of tampered) expect(await isValidSession(value)).toBe(false)
    expect(fakeDb.credentialReads).toBe(0)
  })

  it('rejects a well-formed session signed with a different secret', async () => {
    const payload = `v2.${Date.now()}.${'1'.repeat(32)}.${await getCredentialVersion()}`
    expect(await isValidSession(`${payload}.${hmac(payload, 'some-other-secret')}`)).toBe(false)
  })

  it('rejects the OLD constant cookie, even with its genuinely valid old signature', async () => {
    const oldCookie = `admin-authenticated.${hmac('admin-authenticated')}`
    expect(await isValidSession(oldCookie)).toBe(false)
    expect(await isValidSession('admin-authenticated')).toBe(false)
  })

  it('rejects a session once the credential version changes (password changed)', async () => {
    const session = await signSession()
    expect(await isValidSession(session)).toBe(true)

    seedCredential('second-password') // what a reset does: a newer row becomes live
    clearCredentialVersionCache()
    expect(await isValidSession(session)).toBe(false)
  })

  it('fails CLOSED when the credential row cannot be read', async () => {
    const session = await signSession()
    clearCredentialVersionCache()
    fakeDb.failCredentialReads = true
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await isValidSession(session)).toBe(false)
  })

  it('fails closed when no credential row exists at all', async () => {
    const session = await signSession()
    fakeDb.admin_credentials.length = 0
    clearCredentialVersionCache()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await isValidSession(session)).toBe(false)
  })

  it('fails closed when ADMIN_SESSION_SECRET is missing', async () => {
    const session = await signSession()
    const secret = process.env.ADMIN_SESSION_SECRET
    delete process.env.ADMIN_SESSION_SECRET
    try {
      expect(await isValidSession(session)).toBe(false)
    } finally {
      process.env.ADMIN_SESSION_SECRET = secret
    }
  })
})

describe('credential version cache', () => {
  it('reads the database once for many validations inside the TTL', async () => {
    const session = await signSession()
    fakeDb.credentialReads = 0
    clearCredentialVersionCache()
    for (let i = 0; i < 5; i++) expect(await isValidSession(session)).toBe(true)
    expect(fakeDb.credentialReads).toBe(1)
  })

  it('re-reads after the TTL', async () => {
    vi.useFakeTimers()
    const session = await signSession()
    fakeDb.credentialReads = 0
    vi.setSystemTime(Date.now() + CREDENTIAL_VERSION_CACHE_MS + 1)
    expect(await isValidSession(session)).toBe(true)
    expect(fakeDb.credentialReads).toBe(1)
  })

  it('documented trade-off: a stale warm cache keeps an old session alive, but only until the TTL', async () => {
    vi.useFakeTimers()
    const oldSession = await signSession() // also warms the cache
    seedCredential('second-password') // reset happened on ANOTHER instance: cache not cleared here
    expect(await isValidSession(oldSession)).toBe(true)

    vi.setSystemTime(Date.now() + CREDENTIAL_VERSION_CACHE_MS + 1)
    expect(await isValidSession(oldSession)).toBe(false)
  })

  it('never locks the owner out: a NEW session is accepted at once by an instance whose cache is stale', async () => {
    await getCredentialVersion() // this instance caches the old version
    seedCredential('second-password')
    // Issued by "another instance" against the new row:
    const row = fakeDb.admin_credentials[fakeDb.admin_credentials.length - 1]
    const newVersion = crypto
      .createHash('sha256')
      .update(`cfts-admin-credential:v1:${row.id}:${row.updated_at}`)
      .digest('hex')
      .slice(0, 32)
    expect(await isValidSession(buildSession(newVersion))).toBe(true)
  })
})

describe('checkSameOrigin', () => {
  const make = (method: string, headers: Record<string, string> = {}) =>
    new Request('https://cash4teststripsusa.com/api/admin/review', { method, headers })

  it('allows a state-changing request with no Origin header', () => {
    expect(checkSameOrigin(make('POST'))).toBeNull()
  })

  it('allows a matching Origin', () => {
    expect(checkSameOrigin(make('POST', { origin: 'https://cash4teststripsusa.com' }))).toBeNull()
    expect(checkSameOrigin(make('PATCH', { origin: 'https://CASH4TESTSTRIPSUSA.com' }))).toBeNull()
  })

  it('matches against the Host header too (proxy in front)', () => {
    const request = new Request('http://internal:3000/api/admin/review', {
      method: 'POST',
      headers: { origin: 'https://cash4teststripsusa.com', host: 'cash4teststripsusa.com' },
    })
    expect(checkSameOrigin(request)).toBeNull()
  })

  it.each([
    ['another site', 'https://evil.example'],
    ['a lookalike subdomain', 'https://cash4teststripsusa.com.evil.example'],
    ['a different port', 'https://cash4teststripsusa.com:8443'],
    ['the opaque "null" origin', 'null'],
    ['garbage', 'not a url'],
  ])('refuses %s with 403', (_label, origin) => {
    for (const method of ['POST', 'PATCH', 'DELETE', 'PUT']) {
      expect(checkSameOrigin(make(method, { origin }))?.status).toBe(403)
    }
  })

  it('does not apply to reads', () => {
    expect(checkSameOrigin(make('GET', { origin: 'https://evil.example' }))).toBeNull()
  })
})

describe('requireAdmin', () => {
  const make = (method: string, cookie?: string, origin?: string) =>
    new Request('https://cash4teststripsusa.com/api/admin/review', {
      method,
      headers: {
        ...(cookie ? { cookie: `other=1; ${ADMIN_SESSION_COOKIE_NAME}=${cookie}; more=2` } : {}),
        ...(origin ? { origin } : {}),
      },
    })

  it('returns null (proceed) for a valid session, with or without a matching origin', async () => {
    const session = await signSession()
    expect(await requireAdmin(make('GET', session))).toBeNull()
    expect(await requireAdmin(make('POST', session))).toBeNull()
    expect(await requireAdmin(make('POST', session, 'https://cash4teststripsusa.com'))).toBeNull()
  })

  it('401 without a session', async () => {
    expect((await requireAdmin(make('GET')))?.status).toBe(401)
    expect((await requireAdmin(make('POST', 'nonsense')))?.status).toBe(401)
  })

  it('403 for a cross-site write even WITH a valid session', async () => {
    const session = await signSession()
    expect((await requireAdmin(make('POST', session, 'https://evil.example')))?.status).toBe(403)
  })

  it('401 when the database is down — never open', async () => {
    const session = await signSession()
    clearCredentialVersionCache()
    fakeDb.failCredentialReads = true
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await requireAdmin(make('GET', session)))?.status).toBe(401)
  })
})

describe('getClientIp', () => {
  const make = (headers: Record<string, string>) => new Request('http://localhost/', { headers })

  it('prefers x-real-ip, then the first x-forwarded-for hop, then a shared bucket', () => {
    expect(getClientIp(make({ 'x-real-ip': '203.0.113.7', 'x-forwarded-for': '198.51.100.1' }))).toBe('203.0.113.7')
    expect(getClientIp(make({ 'x-forwarded-for': '198.51.100.1, 10.0.0.1' }))).toBe('198.51.100.1')
    expect(getClientIp(make({}))).toBe('unknown')
  })
})
