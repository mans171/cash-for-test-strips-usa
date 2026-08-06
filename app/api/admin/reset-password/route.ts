import { NextResponse } from 'next/server'
import { consumeResetToken } from '@/lib/admin-auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, newPassword } = body ?? {}

    if (typeof token !== 'string' || typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'A token and a password of at least 8 characters are required' },
        { status: 400 }
      )
    }

    try {
      await consumeResetToken(token, newPassword)
    } catch (consumeError) {
      const message = consumeError instanceof Error ? consumeError.message : 'Invalid or expired reset link'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[POST /api/admin/reset-password]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
