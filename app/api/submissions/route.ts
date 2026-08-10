import { NextResponse } from 'next/server'
import { createSubmission, validateSubmissionPayload, SubmissionValidationError } from '@/lib/submissions'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { targetCompanyId, submittedPhone, payload } = body ?? {}

    if (!submittedPhone || !payload) {
      return NextResponse.json({ error: 'submittedPhone and payload are required' }, { status: 400 })
    }

    const validation = validateSubmissionPayload(payload)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 })
    }

    const user = await getCurrentUser()
    const submittedByUserId = user?.profile?.role === 'buyer' ? user.id : null

    const submission = await createSubmission({
      targetCompanyId: targetCompanyId ?? null,
      submittedPhone,
      payload,
      submittedByUserId,
    })

    return NextResponse.json({ submissionId: submission.id })
  } catch (error) {
    if (error instanceof SubmissionValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('[POST /api/submissions]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
