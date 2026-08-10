import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { POST } from '../route'

// createSubmission fires a real admin-notification email whenever
// ADMIN_NOTIFY_EMAIL is set (it is, in .env.local), and awaits it — a real
// SMTP round trip to Gmail occasionally exceeds Vitest's 5000ms default
// timeout, which is the "approves a pending submission" flake's actual
// cause, not environmental noise. Mock it out, same precedent as
// app/api/leads/__tests__/route.test.ts mocking sendEmailOrThrow.
const mockSendEmail = vi.fn()
const mockGetCurrentUser = vi.fn()

beforeEach(() => {
  mockSendEmail.mockReset()
  mockSendEmail.mockResolvedValue(undefined)
  mockGetCurrentUser.mockReset()
  mockGetCurrentUser.mockResolvedValue(null)
})

vi.mock('@/lib/auth', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}))

vi.mock('@/lib/email', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/email')>()
  return {
    ...actual,
    sendEmail: (...args: unknown[]) => mockSendEmail(...args),
  }
})

// createSubmission defers that notification email with next/server's after(),
// which requires Next's real request-scope machinery — absent when a route
// handler is invoked directly like this. Stub it to just run the callback,
// preserving every other next/server export (NextResponse, etc.) untouched.
vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return {
    ...actual,
    after: (cb: () => unknown) => {
      void cb()
    },
  }
})

const cleanupIds: string[] = []
const cleanupUserIds: string[] = []

afterEach(async () => {
  if (cleanupIds.length) {
    await supabaseAdmin.from('submissions').delete().in('id', cleanupIds)
    cleanupIds.length = 0
  }
  for (const id of cleanupUserIds) {
    await supabaseAdmin.auth.admin.deleteUser(id)
  }
  cleanupUserIds.length = 0
})

// submitted_by_user_id is a uuid FK to auth.users (see
// supabase/migrations/20260810000000_create_claims_and_submissions_owner.sql),
// so the mocked getCurrentUser() result needs a real auth user id, not an
// arbitrary string, to satisfy the foreign key on insert.
async function makeBuyer(): Promise<string> {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: `submissions-route-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password: 'test-password-123',
    email_confirm: true,
  })
  expect(error).toBeNull()
  const userId = data!.user!.id
  cleanupUserIds.push(userId)
  return userId
}

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/submissions', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/submissions', () => {
  it('returns 400 for an invalid payload', async () => {
    const response = await POST(
      makeRequest({ targetCompanyId: null, submittedPhone: '5551234567', payload: { name: '', states: [] } })
    )
    expect(response.status).toBe(400)
  })

  it('creates a pending submission for a valid payload', async () => {
    const response = await POST(
      makeRequest({
        targetCompanyId: null,
        submittedPhone: '5551234568',
        payload: { name: 'Route Test Co', states: ['NY'], phone: '5551234568' },
      })
    )
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.submissionId).toBeDefined()
    cleanupIds.push(body.submissionId)
  })

  it('threads submitted_by_user_id through when the caller is an authenticated buyer', async () => {
    const userId = await makeBuyer()
    mockGetCurrentUser.mockResolvedValue({ id: userId, email: 'b@example.com', profile: { role: 'buyer' } })

    const response = await POST(
      makeRequest({
        targetCompanyId: null,
        submittedPhone: '5551234569',
        payload: { name: 'Route Buyer Test Co', states: ['NY'], phone: '5551234569' },
      })
    )
    const body = await response.json()
    expect(response.status).toBe(200)
    cleanupIds.push(body.submissionId)

    const { data: submission } = await supabaseAdmin
      .from('submissions')
      .select('submitted_by_user_id')
      .eq('id', body.submissionId)
      .single()
    expect(submission?.submitted_by_user_id).toBe(userId)
  })
})
