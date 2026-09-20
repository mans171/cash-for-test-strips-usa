import { NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS, checkSameOrigin } from '@/lib/admin-auth'

// Clears the session cookie in THIS browser. It needs no valid session —
// logging out an already-expired session should still succeed — so it is one
// of the four routes exempt from requireAdmin. The same-origin check stops
// another site from logging the owner out as a nuisance.
//
// Sessions are stateless, so this does not revoke a copy of the cookie held
// elsewhere; that copy dies at the 7-day limit, or immediately on a password
// reset (which changes the credential version every session is tied to).
export async function POST(request: Request) {
  const forbidden = checkSameOrigin(request)
  if (forbidden) return forbidden

  const response = NextResponse.json({ ok: true })
  // Same name, path and flags as the login cookie, or the browser treats it
  // as a different cookie and keeps the original.
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, '', { ...SESSION_COOKIE_OPTIONS, maxAge: 0 })
  return response
}
