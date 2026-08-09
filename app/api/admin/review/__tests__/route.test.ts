import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { signSession, ADMIN_SESSION_COOKIE_NAME } from '@/lib/admin-auth'
import { createSubmission } from '@/lib/submissions'
import { POST } from '../route'

// createSubmission (used in test setup below) and approveSubmission (called
// through the route) both fire real notification emails and await them — a
// real SMTP round trip to Gmail occasionally exceeds Vitest's 5000ms default
// timeout, which is this suite's actual flake cause, not environmental
// noise. Mock it out, same precedent as
// app/api/leads/__tests__/route.test.ts mocking sendEmailOrThrow.
const mockSendEmail = vi.fn()

beforeEach(() => {
  mockSendEmail.mockReset()
  mockSendEmail.mockResolvedValue(undefined)
})

vi.mock('@/lib/email', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/email')>()
  return {
    ...actual,
    sendEmail: (...args: unknown[]) => mockSendEmail(...args),
  }
})

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

    // Never use .single() here: if a prior run's cleanup ever failed, this
    // query would find 2+ rows, .single() would error, `data` would be
    // null, and cleanup would silently no-op — leaving orphaned companies
    // in the live database on every subsequent run, forever. Match on
    // exactly this row's slug (derived from the submission payload) so
    // cleanup is correct even when unrelated stale rows exist.
    const { data: companies } = await supabaseAdmin
      .from('companies')
      .select('slug')
      .eq('phone', '5551110000')
    for (const c of companies ?? []) cleanupCompanySlugs.push(c.slug)
    expect(companies?.length).toBeGreaterThan(0)
  })
})
