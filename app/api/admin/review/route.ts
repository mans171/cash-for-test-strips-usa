import { NextResponse } from 'next/server'
import { isValidSession, ADMIN_SESSION_COOKIE_NAME } from '@/lib/admin-auth'
import { approveSubmission, rejectSubmission } from '@/lib/submissions'

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
