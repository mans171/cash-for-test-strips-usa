import crypto from 'crypto'

export const ADMIN_SESSION_COOKIE_NAME = 'cfts_admin_session'

const SESSION_VALUE = 'admin-authenticated'

export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  return password === expected
}

function sign(value: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET!
  return crypto.createHmac('sha256', secret).update(value).digest('hex')
}

export function signSession(): string {
  return `${SESSION_VALUE}.${sign(SESSION_VALUE)}`
}

export function isValidSession(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false
  const [value, sig] = cookieValue.split('.')
  if (value !== SESSION_VALUE || !sig) return false

  const expectedSig = sign(SESSION_VALUE)
  const sigBuffer = Buffer.from(sig)
  const expectedBuffer = Buffer.from(expectedSig)
  if (sigBuffer.length !== expectedBuffer.length) return false
  return crypto.timingSafeEqual(sigBuffer, expectedBuffer)
}
