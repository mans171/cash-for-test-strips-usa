import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from './supabase-admin'
import { clearCredentialVersionCache, getCredentialVersion } from './admin-credential-version'

export const ADMIN_SESSION_COOKIE_NAME = 'cfts_admin_session'

const SCRYPT_KEY_LENGTH = 64

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16)
  const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH)
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [saltHex, keyHex] = storedHash.split(':')
  if (!saltHex || !keyHex) return false

  const salt = Buffer.from(saltHex, 'hex')
  const expectedKey = Buffer.from(keyHex, 'hex')
  const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH)
  if (derivedKey.length !== expectedKey.length) return false
  return crypto.timingSafeEqual(derivedKey, expectedKey)
}

export async function checkPassword(password: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('admin_credentials')
    .select('password_hash')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return false
  return verifyPassword(password, data.password_hash)
}

function sign(value: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not set')
  return crypto.createHmac('sha256', secret).update(value).digest('hex')
}

function safeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a)
  const bBuffer = Buffer.from(b)
  if (aBuffer.length !== bBuffer.length) return false
  return crypto.timingSafeEqual(aBuffer, bBuffer)
}

// ---------------------------------------------------------------------------
// Sessions
//
// Cookie value:  v2.<issuedAtMs>.<nonce>.<credentialVersion>.<signature>
//   issuedAtMs         when the session was issued (ms since epoch, decimal)
//   nonce              16 random bytes, hex — makes every session unique
//   credentialVersion  fingerprint of the live admin_credentials row
//                      (lib/admin-credential-version.ts) — never the password
//   signature          HMAC-SHA256(ADMIN_SESSION_SECRET, everything before it), hex
//
// The previous format was one constant string signed once: identical for
// everyone, valid forever, and untouched by a password change. Cookies in
// that format no longer validate — the owner logs in again, once.
// ---------------------------------------------------------------------------

const SESSION_FORMAT = 'v2'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7
const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000
// An issued-at in the future means a forged or corrupt value; allow only
// ordinary clock drift between serverless instances.
const CLOCK_SKEW_MS = 60 * 1000

/**
 * Builds a signed session value for a known credential version. Synchronous
 * and database-free; login uses signSession() below, which looks the version
 * up first.
 */
export function buildSession(credentialVersion: string, issuedAtMs: number = Date.now()): string {
  const nonce = crypto.randomBytes(16).toString('hex')
  const payload = `${SESSION_FORMAT}.${issuedAtMs}.${nonce}.${credentialVersion}`
  return `${payload}.${sign(payload)}`
}

/** Issues a session tied to the credential row that is live right now. */
export async function signSession(): Promise<string> {
  // fresh: a login straight after a reset must not be stamped with a cached,
  // already-dead version.
  return buildSession(await getCredentialVersion({ fresh: true }))
}

/**
 * Validation order matters: everything that can be decided without the
 * database is decided first, so an unsigned or forged cookie never causes a
 * query. Any failure to read the credential version fails CLOSED.
 */
export async function isValidSession(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false

  // 1. Shape. Old-format cookies ("admin-authenticated.<sig>") stop here.
  const parts = cookieValue.split('.')
  if (parts.length !== 5) return false
  const [format, issuedAtRaw, nonce, credentialVersion, signature] = parts
  if (format !== SESSION_FORMAT) return false
  if (!/^\d{1,15}$/.test(issuedAtRaw) || !/^[0-9a-f]{32}$/.test(nonce) || !/^[0-9a-f]{32}$/.test(credentialVersion)) {
    return false
  }

  // 2. Signature, constant-time.
  let expectedSignature: string
  try {
    expectedSignature = sign(`${format}.${issuedAtRaw}.${nonce}.${credentialVersion}`)
  } catch {
    return false // no ADMIN_SESSION_SECRET: nobody is authenticated
  }
  if (!safeEqual(signature, expectedSignature)) return false

  // 3. Server-side age. The cookie's own maxAge is only a hint to the browser.
  const age = Date.now() - Number(issuedAtRaw)
  if (age > SESSION_MAX_AGE_MS || age < -CLOCK_SKEW_MS) return false

  // 4. Still the live password? A reset inserts a new credential row, which
  //    changes the version and kills every session issued before it.
  try {
    if (safeEqual(credentialVersion, await getCredentialVersion())) return true
    // A mismatch against a CACHED version may just mean this instance has not
    // noticed a reset yet, and the cookie is the new, legitimate one. Re-read
    // once before refusing, so the owner is never bounced to the login page
    // right after resetting. Only reachable with a correctly signed cookie.
    return safeEqual(credentialVersion, await getCredentialVersion({ fresh: true }))
  } catch (error) {
    console.error('[admin-auth] could not verify credential version; refusing session', error)
    return false
  }
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  // 'lax', not 'strict': the notification emails (lib/submissions.ts,
  // lib/claims.ts) link straight to /admin, and under 'strict' a click from a
  // mail client would arrive without the cookie and bounce a logged-in owner
  // to the login page every time. 'lax' still withholds the cookie from every
  // cross-site POST/PATCH/DELETE, and checkSameOrigin() below covers those
  // independently.
  sameSite: 'lax' as const,
  path: '/',
}

function getCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie') ?? ''
  const match = header.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${name}=`))
  return match?.slice(name.length + 1)
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * CSRF guard for state-changing requests. Browsers attach an Origin header to
 * every cross-site POST/PATCH/DELETE; if one is present and it is not this
 * site, refuse. An absent Origin is allowed (curl, server-to-server, and some
 * same-origin requests omit it) — such a request still needs the session
 * cookie, which SameSite=Lax keeps off cross-site writes.
 *
 * Returns the 403 response, or null when the request may proceed.
 */
export function checkSameOrigin(request: Request): NextResponse | null {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return null
  const origin = request.headers.get('origin')
  if (origin === null) return null

  let originHost: string | null = null
  try {
    originHost = new URL(origin).host.toLowerCase()
  } catch {
    originHost = null // includes the literal "null" origin
  }

  const allowedHosts = new Set<string>()
  const hostHeader = request.headers.get('host')
  if (hostHeader) allowedHosts.add(hostHeader.toLowerCase())
  try {
    allowedHosts.add(new URL(request.url).host.toLowerCase())
  } catch {
    // request.url is always absolute in route handlers; nothing to add if not
  }

  if (!originHost || !allowedHosts.has(originHost)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

/**
 * THE guard for every route under /api/admin/ (login, forgot-password,
 * reset-password and logout excepted — they are unauthenticated by nature and
 * call checkSameOrigin directly). Call it first, before anything touches the
 * database:
 *
 *   const denied = await requireAdmin(request)
 *   if (denied) return denied
 *
 * lib/__tests__/admin-route-guard.test.ts walks app/api/admin on disk and
 * fails CI if a route file does not reference it.
 */
export async function requireAdmin(request: Request): Promise<NextResponse | null> {
  const forbidden = checkSameOrigin(request)
  if (forbidden) return forbidden

  if (!(await isValidSession(getCookie(request, ADMIN_SESSION_COOKIE_NAME)))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

/**
 * Best available client address for rate limiting. On Vercel both headers are
 * set by the platform itself — it overwrites x-forwarded-for rather than
 * appending to whatever the client sent, and x-real-ip carries the same
 * address — so neither can be spoofed there
 * (https://vercel.com/docs/headers/request-headers). x-real-ip is preferred
 * because it is always a single address. Off Vercel neither header is
 * trustworthy; requests with no address share one 'unknown' bucket, which
 * errs toward limiting too much rather than too little.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-real-ip')?.trim() ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  )
}

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000

function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex')
}

export async function createResetToken(): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString()

  const { error } = await supabaseAdmin.from('admin_reset_tokens').insert({
    token_hash: tokenHash,
    expires_at: expiresAt,
  })
  if (error) throw new Error(`Failed to create reset token: ${error.message}`)

  return rawToken
}

export async function verifyResetToken(rawToken: string): Promise<boolean> {
  const tokenHash = hashToken(rawToken)
  const { data } = await supabaseAdmin
    .from('admin_reset_tokens')
    .select('id, expires_at, used_at')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (!data) return false
  if (data.used_at) return false
  if (new Date(data.expires_at).getTime() < Date.now()) return false
  return true
}

export async function consumeResetToken(rawToken: string, newPassword: string): Promise<void> {
  const tokenHash = hashToken(rawToken)
  const nowIso = new Date().toISOString()

  // Atomic conditional update: mark used_at only if the token still exists,
  // is unused, and unexpired — in ONE operation, not a separate select-then-
  // update. This collapses the validity check and the mark-used step so two
  // concurrent requests carrying the same token (or a partial failure
  // between a separate check and a separate write) can't both pass
  // validation and consume the same token twice. Only one caller can ever
  // get a matching row back from this update.
  const { data, error } = await supabaseAdmin
    .from('admin_reset_tokens')
    .update({ used_at: nowIso })
    .eq('token_hash', tokenHash)
    .is('used_at', null)
    .gt('expires_at', nowIso)
    .select('id')
    .maybeSingle()

  if (error || !data) throw new Error('Invalid or expired reset link')

  const { error: insertError } = await supabaseAdmin
    .from('admin_credentials')
    .insert({ password_hash: hashPassword(newPassword) })
  if (insertError) throw new Error(`Failed to update password: ${insertError.message}`)

  // The live credential row just changed, so every existing session is now
  // stale. Drop this instance's cached version so that takes effect here at
  // once; other warm instances catch up within CREDENTIAL_VERSION_CACHE_MS.
  clearCredentialVersionCache()
}
