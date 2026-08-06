import { NextResponse } from 'next/server'
import { createResetToken } from '@/lib/admin-auth'
import { sendEmail } from '@/lib/email'

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT_MAX_ATTEMPTS = 5
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
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    const token = await createResetToken()
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cash4teststripsusa.com'}/admin/reset?token=${token}`
    const notifyEmail = process.env.ADMIN_NOTIFY_EMAIL

    if (notifyEmail) {
      await sendEmail({
        to: notifyEmail,
        subject: 'Reset your Cash4TestStripsUSA admin password',
        html: `<p>Click the link below to set a new admin password. This link expires in 30 minutes.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[POST /api/admin/forgot-password]', error)
    return NextResponse.json({ ok: true })
  }
}
