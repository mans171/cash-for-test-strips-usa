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
