import crypto from 'crypto'
import { supabaseAdmin } from './supabase-admin'

/**
 * The "credential version": a fingerprint of WHICH admin_credentials row is
 * live right now. Every admin session carries the version it was issued
 * under, and a session is only valid while that still matches — so a password
 * reset (which inserts a new row) logs out every older session everywhere.
 *
 * It is a hash of the live row's id + updated_at. It is deliberately NOT
 * derived from the password or its hash: the value rides in a cookie, and
 * nothing about the secret should.
 *
 * The row is chosen exactly the way checkPassword() chooses it (newest
 * updated_at), so "the password that logs you in" and "the version your
 * session is tied to" can never be two different rows.
 *
 * This lives in its own module so route tests can mock it without a database.
 */

// Trade-off, on purpose: without a cache every admin request costs an extra
// database round trip. With it, a warm serverless instance can keep accepting
// an old session for up to this long after a password reset. 60 seconds of
// lag on revocation is acceptable for a single-owner tool; an extra query on
// every click is not needed. The instance that PERFORMS the reset clears its
// own cache immediately (see consumeResetToken).
export const CREDENTIAL_VERSION_CACHE_MS = 60 * 1000

let cached: { version: string; fetchedAt: number } | null = null

export function clearCredentialVersionCache(): void {
  cached = null
}

/**
 * Throws if the row cannot be read or does not exist. Callers validating a
 * session MUST treat a throw as "not authenticated" — fail closed.
 */
export async function getCredentialVersion(options: { fresh?: boolean } = {}): Promise<string> {
  const now = Date.now()
  if (!options.fresh && cached && now - cached.fetchedAt < CREDENTIAL_VERSION_CACHE_MS) {
    return cached.version
  }

  const { data, error } = await supabaseAdmin
    .from('admin_credentials')
    .select('id, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`Could not read admin credential version: ${error.message}`)
  if (!data) throw new Error('No admin credential row exists')

  const version = crypto
    .createHash('sha256')
    .update(`cfts-admin-credential:v1:${data.id}:${data.updated_at}`)
    .digest('hex')
    .slice(0, 32)

  cached = { version, fetchedAt: now }
  return version
}
