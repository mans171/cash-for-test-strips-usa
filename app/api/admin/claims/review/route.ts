import { NextResponse } from 'next/server'
import { isValidSession, ADMIN_SESSION_COOKIE_NAME } from '@/lib/admin-auth'
import { approveClaim, rejectClaim } from '@/lib/claims'

function getCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie') ?? ''
  const match = header.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${name}=`))
  return match?.slice(name.length + 1)
}

export async function POST(request: Request) {
  try {
    const session = getCookie(request, ADMIN_SESSION_COOKIE_NAME)
    if (!isValidSession(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { claimId, action } = body ?? {}

    if (!claimId || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json({ error: 'claimId and a valid action are required' }, { status: 400 })
    }

    if (action === 'approve') {
      await approveClaim(claimId)
    } else {
      await rejectClaim(claimId)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[POST /api/admin/claims/review]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
