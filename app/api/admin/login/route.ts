import { NextResponse } from 'next/server'
import {
  ADMIN_SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  SESSION_MAX_AGE_SECONDS,
  checkPassword,
  checkSameOrigin,
  getClientIp,
  signSession,
} from '@/lib/admin-auth'

// In-memory rate limit for login attempts, per client address.
//
// KNOWN LIMIT, stated plainly: this Map lives inside ONE serverless instance.
// Vercel can run several instances at once and recycles them, so the real
// ceiling is "10 per 15 minutes per address PER INSTANCE", and it resets on a
// cold start. It slows a single-source brute force; it does not stop a
// distributed one. Closing that needs a shared store (or a Vercel Firewall
// rate-limit rule on /api/admin/login), which is infrastructure and was
// deliberately left out. The fixed delay on failure below and scrypt's own
// cost put a second, instance-independent brake on guessing.
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT_MAX_ATTEMPTS = 10
const attempts = new Map<string, { count: number; resetAt: number }>()

// Every failed attempt waits this long before answering. It costs a person
// who mistyped nothing noticeable, and caps one connection at ~2 guesses/sec.
const FAILED_LOGIN_DELAY_MS = process.env.NODE_ENV === 'test' ? 0 : 500

function delay(ms: number): Promise<void> {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve()
}

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const entry = attempts.get(key)

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  entry.count += 1
  return entry.count > RATE_LIMIT_MAX_ATTEMPTS
}

export async function POST(request: Request) {
  try {
    const forbidden = checkSameOrigin(request)
    if (forbidden) return forbidden

    const key = getClientIp(request)
    if (isRateLimited(key)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => null)
    const password = body?.password

    // checkPassword -> verifyPassword compares scrypt output with
    // crypto.timingSafeEqual, so the comparison itself is constant-time.
    if (typeof password !== 'string' || !(await checkPassword(password))) {
      await delay(FAILED_LOGIN_DELAY_MS)
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const response = NextResponse.json({ ok: true })
    response.cookies.set(ADMIN_SESSION_COOKIE_NAME, await signSession(), {
      ...SESSION_COOKIE_OPTIONS,
      // Browser-side hint only; isValidSession enforces the same limit server-side.
      maxAge: SESSION_MAX_AGE_SECONDS,
    })
    return response
  } catch (error) {
    console.error('[POST /api/admin/login]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
