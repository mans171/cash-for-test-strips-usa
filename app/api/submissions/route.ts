import { NextResponse } from 'next/server'
import { createSubmission, validateSubmissionPayload } from '@/lib/submissions'

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

    const submission = await createSubmission({
      targetCompanyId: targetCompanyId ?? null,
      submittedPhone,
      payload,
    })

    return NextResponse.json({ submissionId: submission.id })
  } catch (error) {
    console.error('[POST /api/submissions]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
