import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { approveSubmission, rejectSubmission } from '@/lib/submissions'

export async function POST(request: Request) {
  try {
    const denied = await requireAdmin(request)
    if (denied) return denied

    const body = await request.json()
    const { submissionId, action } = body ?? {}

    if (!submissionId || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json({ error: 'submissionId and a valid action are required' }, { status: 400 })
    }

    if (action === 'approve') {
      await approveSubmission(submissionId)
    } else {
      await rejectSubmission(submissionId)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[POST /api/admin/review]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
