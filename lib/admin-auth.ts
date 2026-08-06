import crypto from 'crypto'
import { supabaseAdmin } from './supabase-admin'

export const ADMIN_SESSION_COOKIE_NAME = 'cfts_admin_session'

const SESSION_VALUE = 'admin-authenticated'
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

export function signSession(): string {
  return `${SESSION_VALUE}.${sign(SESSION_VALUE)}`
}

export function isValidSession(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false
  const parts = cookieValue.split('.')
  if (parts.length !== 2) return false
  const [value, sig] = parts
  if (value !== SESSION_VALUE || !sig) return false

  const expectedSig = sign(SESSION_VALUE)
  const sigBuffer = Buffer.from(sig)
  const expectedBuffer = Buffer.from(expectedSig)
  if (sigBuffer.length !== expectedBuffer.length) return false
  return crypto.timingSafeEqual(sigBuffer, expectedBuffer)
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
  const { data } = await supabaseAdmin
    .from('admin_reset_tokens')
    .select('id, expires_at, used_at')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (!data) throw new Error('Invalid or expired reset link')
  if (data.used_at) throw new Error('This reset link has already been used')
  if (new Date(data.expires_at).getTime() < Date.now()) throw new Error('This reset link has expired')

  const { error: insertError } = await supabaseAdmin
    .from('admin_credentials')
    .insert({ password_hash: hashPassword(newPassword) })
  if (insertError) throw new Error(`Failed to update password: ${insertError.message}`)

  const { error: updateError } = await supabaseAdmin
    .from('admin_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', data.id)
  if (updateError) throw new Error(`Failed to mark reset token used: ${updateError.message}`)
}
