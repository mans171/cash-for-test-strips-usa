import { describe, it, expect, afterEach, vi } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { POST } from '../route'

const mockGetCurrentUser = vi.fn()
vi.mock('@/lib/auth', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}))

// createClaim defers its admin-notification email with next/server's after(),
// which needs Next's real request-scope machinery — absent when a route
// handler is invoked directly in a test. Stub it to just run the callback.
vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return {
    ...actual,
    after: (cb: () => unknown) => {
      void cb()
    },
  }
})

const cleanupCompanySlugs: string[] = []
const cleanupClaimIds: string[] = []
const cleanupUserIds: string[] = []

afterEach(async () => {
  if (cleanupClaimIds.length) {
    await supabaseAdmin.from('claims').delete().in('id', cleanupClaimIds)
    cleanupClaimIds.length = 0
  }
  if (cleanupCompanySlugs.length) {
    await supabaseAdmin.from('companies').delete().in('slug', cleanupCompanySlugs)
    cleanupCompanySlugs.length = 0
  }
  for (const id of cleanupUserIds) {
    await supabaseAdmin.auth.admin.deleteUser(id)
  }
  cleanupUserIds.length = 0
  mockGetCurrentUser.mockReset()
})

// claims.user_id has a real FK to auth.users(id) — every test that ends up
// inserting a claims row (directly or via the route) needs a real auth user,
// not an arbitrary string. Tests that only check the 401/400 short-circuit
// (before any insert happens) can use a fake id since it's never persisted.
async function makeBuyer(): Promise<string> {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: `claims-route-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password: 'test-password-123',
    email_confirm: true,
  })
  expect(error).toBeNull()
  const userId = data!.user!.id
  cleanupUserIds.push(userId)
  return userId
}

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/claims', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/claims', () => {
  it('returns 401 when there is no session', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const response = await POST(makeRequest({ companyId: 'x', submittedPhone: '5551234567' }))
    expect(response.status).toBe(401)
  })

  it('returns 401 when the session belongs to a customer, not a buyer', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', email: 'c@example.com', profile: { role: 'customer' } })
    const response = await POST(makeRequest({ companyId: 'x', submittedPhone: '5551234567' }))
    expect(response.status).toBe(401)
  })

  it('returns 400 when companyId or submittedPhone is missing', async () => {
    const userId = await makeBuyer()
    mockGetCurrentUser.mockResolvedValue({ id: userId, email: 'b@example.com', profile: { role: 'buyer' } })
    const response = await POST(makeRequest({ companyId: 'x' }))
    expect(response.status).toBe(400)
  })

  it('creates a pending claim for an authenticated buyer with a matching phone', async () => {
    const userId = await makeBuyer()
    const { data: company } = await supabaseAdmin
      .from('companies')
      .insert({ name: 'Route Claim Test Co', slug: 'route-claim-test-co', states: ['NY'], active: true, phone: '5559994001' })
      .select('id, slug')
      .single()
    cleanupCompanySlugs.push(company!.slug)

    mockGetCurrentUser.mockResolvedValue({ id: userId, email: 'b@example.com', profile: { role: 'buyer' } })
    const response = await POST(makeRequest({ companyId: company!.id, submittedPhone: '5559994001' }))
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.claimId).toBeDefined()
    cleanupClaimIds.push(body.claimId)
  })
})
