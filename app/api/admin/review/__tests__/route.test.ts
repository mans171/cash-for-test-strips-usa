import { describe, it, expect, afterEach } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { signSession, ADMIN_SESSION_COOKIE_NAME } from '@/lib/admin-auth'
import { createSubmission } from '@/lib/submissions'
import { POST } from '../route'

const cleanupSubmissionIds: string[] = []
const cleanupCompanySlugs: string[] = []

afterEach(async () => {
  if (cleanupSubmissionIds.length) {
    await supabaseAdmin.from('submissions').delete().in('id', cleanupSubmissionIds)
    cleanupSubmissionIds.length = 0
  }
  if (cleanupCompanySlugs.length) {
    await supabaseAdmin.from('companies').delete().in('slug', cleanupCompanySlugs)
    cleanupCompanySlugs.length = 0
  }
})

function makeRequest(body: unknown, cookie?: string) {
  return new Request('http://localhost/api/admin/review', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie: `${ADMIN_SESSION_COOKIE_NAME}=${cookie}` } : {}),
    },
  })
}

describe('POST /api/admin/review', () => {
  it('rejects requests without a valid admin session', async () => {
    const response = await POST(makeRequest({ submissionId: 'x', action: 'approve' }))
    expect(response.status).toBe(401)
  })

  it('approves a pending submission when authenticated', async () => {
    const submission = await createSubmission({
      targetCompanyId: null,
      submittedPhone: '5551110000',
      payload: { name: 'Admin Review Test Co', states: ['NY'], phone: '5551110000' },
    })
    cleanupSubmissionIds.push(submission.id)

    const response = await POST(makeRequest({ submissionId: submission.id, action: 'approve' }, signSession()))
    expect(response.status).toBe(200)

    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('slug')
      .eq('phone', '5551110000')
      .single()
    if (company) cleanupCompanySlugs.push(company.slug)
    expect(company).toBeDefined()
  })
})
