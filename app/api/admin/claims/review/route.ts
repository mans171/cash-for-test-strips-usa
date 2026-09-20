import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { approveClaim, rejectClaim } from '@/lib/claims'

export async function POST(request: Request) {
  try {
    const denied = await requireAdmin(request)
    if (denied) return denied

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
