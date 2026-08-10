import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createClaim, ClaimValidationError } from '@/lib/claims'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'buyer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { companyId, submittedPhone } = body ?? {}

    if (!companyId || !submittedPhone) {
      return NextResponse.json({ error: 'companyId and submittedPhone are required' }, { status: 400 })
    }

    const claim = await createClaim({ companyId, userId: user.id, submittedPhone })
    return NextResponse.json({ claimId: claim.id })
  } catch (error) {
    if (error instanceof ClaimValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('[POST /api/claims]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
