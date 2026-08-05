import { NextResponse } from 'next/server'
import { checkPassword, signSession, ADMIN_SESSION_COOKIE_NAME } from '@/lib/admin-auth'

export async function POST(request: Request) {
  try {
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
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
