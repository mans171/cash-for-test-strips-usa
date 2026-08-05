import { NextResponse } from 'next/server'
import { checkPassword, signSession, ADMIN_SESSION_COOKIE_NAME } from '@/lib/admin-auth'

// Simple in-memory rate limit for login attempts. This is a single-instance
// internal tool — no need for Redis/an external store. It just needs to slow
// down brute-forcing a single shared password, not survive a restart or work
// across multiple instances.
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT_MAX_ATTEMPTS = 10
const attempts = new Map<string, { count: number; resetAt: number }>()

function getClientKey(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
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
    const key = getClientKey(request)
    if (isRateLimited(key)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const password = body?.password

    if (typeof password !== 'string' || !checkPassword(password)) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const response = NextResponse.json({ ok: true })
    response.cookies.set(ADMIN_SESSION_COOKIE_NAME, signSession(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
    return response
  } catch (error) {
    console.error('[POST /api/admin/login]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
